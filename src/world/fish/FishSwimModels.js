import { BufferGeometry, BufferAttribute, Matrix4, Quaternion, Vector3 } from '../../engine/index.js';
import { Texture, generateMipmaps } from '../../engine/webgpu.js';
import { loadGLB, decodeImage } from '../../engine/loaders/GLTF.js';
import { FISH_GLB, FISH_GLB_BASE } from './FishSkins.js';

// 3D models for the swimming fish (docs/DISENO.md D61, M5). The water has many fish at once, so the swimmers
// don't use the skeleton: each species' model in its rest pose goes into the shared fish batch (ReefBatch) and
// the engine's swimming wave bends it like the procedural fish. The model's texture coordinates ride in the
// vertex data the batch already carries (aData.zw), and the species' textures are layers of one texture array.
//
//   await loadSwimModels( ids )   load the GLBs, build the geometries and the texture array (before the fish)
//   swimGeometry( id )            [ lod0, lod1, lod2, lod3 ] geometries in the fish model frame, or null
//   GLB_LAYER[ id ]               the species' layer in glbTexture()
//   glbTexture()                  the texture array (a 1 x 1 placeholder when no model is loaded)
//
// Geometry: nose +z, back +y, total length 1, centred (like fishGeometry); aData = ( u along the body 0 snout ..
// 1 tail tip, part 0 (body), texture u, texture v ). Levels of detail: the full mesh, then vertex clustering on a
// grid in position and texture space (the far levels are only a few pixels long).

export const GLB_PART = 0;
export const GLB_LAYER = {};
const GEO = {};
const W = 1024;
let _tex = null;

const _p = new Vector3(), _n = new Vector3(), _m3 = new Matrix4();

export function glbTexture() {

	if ( ! _tex ) _tex = new Texture( { label: 'fishGlb', width: 1, height: 1, depth: 1, dimension: '2d-array', format: 'rgba8unorm-srgb', usage: [ 'sample', 'copyDst' ], data: new Uint8Array( 4 ) } );
	return _tex;

}

export const swimGeometry = ( id ) => GEO[ id ] || null;

// node world matrices of a parsed GLB
function worldMatrices( gltf ) {

	const world = [];
	const visit = ( i, parent ) => {

		const n = gltf.nodes[ i ];
		const m = new Matrix4().compose( new Vector3( ...n.t ), new Quaternion( ...n.r ), new Vector3( ...n.s ) );
		world[ i ] = parent ? parent.clone().multiply( m ) : m;
		for ( const c of n.children ) visit( c, world[ i ] );

	};

	for ( const r of gltf.roots ) visit( r, null );
	return world;

}

// the drawn meshes (the first skin's, or all for a static model) merged into one, in the GLB's own frame
function mergedMesh( gltf ) {

	const world = worldMatrices( gltf );
	const skinned = gltf.skins.length > 0;
	const P = [], N = [], T = [], I = [];
	let base = 0, albedo = null;
	gltf.nodes.forEach( ( n, i ) => {

		if ( n.mesh === undefined || ! world[ i ] ) return;
		if ( skinned && n.skin !== 0 ) return;
		const M = world[ i ];
		const NM = _m3.copy( M ).invert().transpose();
		for ( const p of gltf.meshes[ n.mesh ] ) {

			const A = p.attributes;
			const pos = A.POSITION.array, nrm = A.NORMAL ? A.NORMAL.array : null, uv = A.TEXCOORD_0;
			const count = pos.length / 3;
			for ( let v = 0; v < count; v ++ ) {

				_p.set( pos[ v * 3 ], pos[ v * 3 + 1 ], pos[ v * 3 + 2 ] ).applyMatrix4( M );
				P.push( _p.x, _p.y, _p.z );
				if ( nrm ) _n.set( nrm[ v * 3 ], nrm[ v * 3 + 1 ], nrm[ v * 3 + 2 ] ).applyMatrix4( NM ).normalize();
				else _n.set( 0, 1, 0 );
				N.push( _n.x, _n.y, _n.z );
				if ( uv ) {

					const k = uv.normalized ? ( uv.array instanceof Uint8Array ? 255 : 65535 ) : 1;
					T.push( uv.array[ v * 2 ] / k, uv.array[ v * 2 + 1 ] / k );

				} else T.push( 0, 0 );

			}

			const idx = p.indices || Uint32Array.from( { length: count }, ( _, k ) => k );
			for ( let k = 0; k < idx.length; k ++ ) I.push( idx[ k ] + base );
			base += count;
			const gm = gltf.materials[ p.material ] || {};
			const bc = gm.pbrMetallicRoughness && gm.pbrMetallicRoughness.baseColorTexture;
			if ( bc && albedo === null ) albedo = gltf.textures[ bc.index ].source;

		}

	} );

	return { P: Float32Array.from( P ), N: Float32Array.from( N ), T: Float32Array.from( T ), I: Uint32Array.from( I ), albedo };

}

// normalize to the fish frame (see FishModel.js: spec.nose / pitch / roll)
function normalize( mesh, spec ) {

	const { P, N } = mesh;
	const lo = [ Infinity, Infinity, Infinity ], hi = [ - Infinity, - Infinity, - Infinity ];
	for ( let i = 0; i < P.length; i += 3 ) for ( let c = 0; c < 3; c ++ ) {

		lo[ c ] = Math.min( lo[ c ], P[ i + c ] );
		hi[ c ] = Math.max( hi[ c ], P[ i + c ] );

	}

	const axis = spec.nose[ 1 ], sign = spec.nose[ 0 ] === '-' ? - 1 : 1;
	const k = { x: 0, y: 1, z: 2 }[ axis ];
	const len = hi[ k ] - lo[ k ];
	const fix = new Matrix4();
	if ( axis === 'z' && sign < 0 ) fix.makeRotationY( Math.PI );
	else if ( axis === 'x' ) fix.makeRotationY( sign > 0 ? - Math.PI / 2 : Math.PI / 2 );
	if ( spec.pitch ) fix.premultiply( new Matrix4().makeRotationX( spec.pitch ) );
	if ( spec.roll ) fix.premultiply( new Matrix4().makeRotationZ( spec.roll ) );
	fix.multiply( new Matrix4().makeScale( 1 / len, 1 / len, 1 / len ) ).multiply( new Matrix4().makeTranslation( - ( lo[ 0 ] + hi[ 0 ] ) / 2, - ( lo[ 1 ] + hi[ 1 ] ) / 2, - ( lo[ 2 ] + hi[ 2 ] ) / 2 ) );
	const rot = new Matrix4().extractRotation( fix );
	for ( let i = 0; i < P.length; i += 3 ) {

		_p.set( P[ i ], P[ i + 1 ], P[ i + 2 ] ).applyMatrix4( fix );
		P[ i ] = _p.x; P[ i + 1 ] = _p.y; P[ i + 2 ] = _p.z;
		_n.set( N[ i ], N[ i + 1 ], N[ i + 2 ] ).applyMatrix4( rot ).normalize();
		N[ i ] = _n.x; N[ i + 1 ] = _n.y; N[ i + 2 ] = _n.z;

	}

	// the scaled length can differ from 1 by the pitch / roll: re-centre on z
	let zl = Infinity, zh = - Infinity;
	for ( let i = 2; i < P.length; i += 3 ) {

		zl = Math.min( zl, P[ i ] );
		zh = Math.max( zh, P[ i ] );

	}

	const s = 1 / ( zh - zl ), zc = ( zl + zh ) / 2;
	for ( let i = 0; i < P.length; i ++ ) P[ i ] = ( i % 3 === 2 ? P[ i ] - zc : P[ i ] ) * s;

}

function geometryOf( P, N, T, I ) {

	const n = P.length / 3;
	const D = new Float32Array( n * 4 );
	for ( let v = 0; v < n; v ++ ) {

		D[ v * 4 ] = Math.min( 1, Math.max( 0, 0.5 - P[ v * 3 + 2 ] ) ); // along the body: 0 snout .. 1 tail tip
		D[ v * 4 + 1 ] = GLB_PART;
		D[ v * 4 + 2 ] = T[ v * 2 ];
		D[ v * 4 + 3 ] = T[ v * 2 + 1 ];

	}

	const g = new BufferGeometry();
	g.setAttribute( 'position', new BufferAttribute( P, 3 ) );
	g.setAttribute( 'normal', new BufferAttribute( N, 3 ) );
	g.setAttribute( 'aData', new BufferAttribute( D, 4 ) );
	g.setIndex( new BufferAttribute( I, 1 ) );
	g.computeBoundingSphere();
	return g;

}

// vertex clustering: vertices sharing a cell (position grid of `cells` along the length, texture grid) merge
function cluster( P, N, T, I, cells ) {

	const h = 1 / cells, ht = 1 / ( cells * 0.75 );
	const map = new Map(), remap = new Uint32Array( P.length / 3 );
	const sum = [];
	for ( let v = 0; v < P.length / 3; v ++ ) {

		const key = Math.floor( P[ v * 3 ] / h ) + ',' + Math.floor( P[ v * 3 + 1 ] / h ) + ',' + Math.floor( P[ v * 3 + 2 ] / h ) + ',' + Math.floor( T[ v * 2 ] / ht ) + ',' + Math.floor( T[ v * 2 + 1 ] / ht );
		let c = map.get( key );
		if ( c === undefined ) {

			c = sum.length;
			map.set( key, c );
			sum.push( [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ] );

		}

		const s = sum[ c ];
		s[ 0 ] += P[ v * 3 ]; s[ 1 ] += P[ v * 3 + 1 ]; s[ 2 ] += P[ v * 3 + 2 ];
		s[ 3 ] += N[ v * 3 ]; s[ 4 ] += N[ v * 3 + 1 ]; s[ 5 ] += N[ v * 3 + 2 ];
		s[ 6 ] += T[ v * 2 ]; s[ 7 ] += T[ v * 2 + 1 ]; s[ 8 ] ++;
		remap[ v ] = c;

	}

	const n = sum.length;
	const P2 = new Float32Array( n * 3 ), N2 = new Float32Array( n * 3 ), T2 = new Float32Array( n * 2 );
	sum.forEach( ( s, c ) => {

		const k = 1 / s[ 8 ];
		P2[ c * 3 ] = s[ 0 ] * k; P2[ c * 3 + 1 ] = s[ 1 ] * k; P2[ c * 3 + 2 ] = s[ 2 ] * k;
		const l = Math.hypot( s[ 3 ], s[ 4 ], s[ 5 ] ) || 1;
		N2[ c * 3 ] = s[ 3 ] / l; N2[ c * 3 + 1 ] = s[ 4 ] / l; N2[ c * 3 + 2 ] = s[ 5 ] / l;
		T2[ c * 2 ] = s[ 6 ] * k; T2[ c * 2 + 1 ] = s[ 7 ] * k;

	} );
	const out = [];
	for ( let i = 0; i < I.length; i += 3 ) {

		const a = remap[ I[ i ] ], b = remap[ I[ i + 1 ] ], c = remap[ I[ i + 2 ] ];
		if ( a !== b && b !== c && a !== c ) out.push( a, b, c );

	}

	return [ P2, N2, T2, Uint32Array.from( out ) ];

}

async function albedoPixels( gltf, src ) {

	if ( src === null || src === undefined ) return null;
	const im = gltf.images[ src ];
	const px = await decodeImage( im.bytes, im.mimeType );
	if ( px.width === W && px.height === W ) return px.data;
	// resample to the layer size (nearest is enough: the mips filter it)
	const out = new Uint8Array( W * W * 4 );
	for ( let y = 0; y < W; y ++ ) {

		const sy = Math.min( px.height - 1, Math.floor( ( y + 0.5 ) * px.height / W ) );
		for ( let x = 0; x < W; x ++ ) {

			const sx = Math.min( px.width - 1, Math.floor( ( x + 0.5 ) * px.width / W ) );
			const s = ( sy * px.width + sx ) * 4, d = ( y * W + x ) * 4;
			out[ d ] = px.data[ s ]; out[ d + 1 ] = px.data[ s + 1 ]; out[ d + 2 ] = px.data[ s + 2 ]; out[ d + 3 ] = 255;

		}

	}

	return out;

}

// load the swimmers' models (ids: species with a FISH_GLB entry); call before the fish materials are made
export async function loadSwimModels( ids ) {

	ids = ids.filter( ( id ) => FISH_GLB[ id ] && ! GEO[ id ] );
	if ( ! ids.length ) return;
	const layers = [];
	for ( const id of ids ) {

		try {

			const gltf = await loadGLB( FISH_GLB_BASE + FISH_GLB[ id ].file );
			const mesh = mergedMesh( gltf );
			normalize( mesh, FISH_GLB[ id ] );
			const { P, N, T, I } = mesh;
			const l1 = cluster( P, N, T, I, 48 ), l2 = cluster( P, N, T, I, 20 ), l3 = cluster( P, N, T, I, 9 );
			GEO[ id ] = [ geometryOf( P, N, T, I ), geometryOf( ...l1 ), geometryOf( ...l2 ), geometryOf( ...l3 ) ];
			layers.push( { id, pixels: await albedoPixels( gltf, mesh.albedo ) } );

		} catch ( e ) {

			console.warn( 'swim model ' + id + ':', e.message );

		}

	}

	if ( ! layers.length ) return;
	_tex = new Texture( { label: 'fishGlb', width: W, height: W, depth: layers.length, dimension: '2d-array', format: 'rgba8unorm-srgb', mips: true, usage: [ 'sample', 'copyDst' ], sampler: 'anisoRepeat' } );
	layers.forEach( ( l, i ) => {

		GLB_LAYER[ l.id ] = i;
		_tex.upload( l.pixels || new Uint8Array( W * W * 4 ).fill( 160 ), { layer: i, layers: 1, width: W, height: W } );

	} );
	generateMipmaps( _tex );

}
