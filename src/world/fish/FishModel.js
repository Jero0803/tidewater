import { Group, Mesh, BufferGeometry, BufferAttribute, Matrix4, Quaternion, Vector3 } from '../../engine/index.js';
import { Texture, Material, generateMipmaps } from '../../engine/webgpu.js';
import { loadGLB, decodeImage } from '../../engine/loaders/GLTF.js';
import { SkinnedModel } from '../../engine/render/Skinning.js';
import { FISH_GLB, FISH_GLB_BASE } from './FishSkins.js';

// 3D fish models (docs/DISENO.md D61): a GLB per species (FishSkins.js FISH_GLB), skinned and animated or
// static (scans). loadFishModel( id ) resolves to
//   { group, update( dt ), animated }
// where `group` is normalized to the fish model frame used everywhere in the game: nose +z, back +y, total
// length 1, centred. Scale it by the fish's length (m) and place it like a FishProps fish.
//
// Material tweaks for fish: the downloaded maps often mark the whole fish as metal (thin bluish fins turn
// almost black), so metalness is capped; scans with their light baked into the photo (KHR_materials_unlit)
// get some light of their own.

const FISH_SURFACE = ( unlit, recolor ) => 's.metalness = min( s.metalness, 0.3 ); s.roughness = max( s.roughness, 0.25 );' + ( unlit ? ' s.emissive += s.albedo * 0.3;' : '' ) + ( RECOLOR[ recolor ] || '' );
// recolours (spec.recolor) for models whose colours are off, e.g. a preserved museum specimen gone brown: the
// texture's shading kept, its colour replaced
const RECOLOR = {
	// a live silverside: silvery flanks, a darker greenish back, some mirror-like sheen
	silver: ' { let lum = dot( s.albedo, vec3f( 0.2126, 0.7152, 0.0722 ) ); let up = smoothstep( -0.2, 0.6, in.N.y ); s.albedo = clamp( vec3f( lum ) * mix( vec3f( 1.7, 1.8, 1.85 ), vec3f( 0.9, 1.1, 1.0 ), up * 0.6 ), vec3f( 0.0 ), vec3f( 0.9 ) ); s.metalness = 0.45; s.roughness = 0.3; }',
};
const isUnlit = ( gm ) => !! ( gm && gm.extensions && gm.extensions.KHR_materials_unlit );

const _p = new Vector3();

// static GLB (no skin): one Mesh per primitive at its node's world transform
async function staticModel( gltf, spec ) {

	const group = new Group();
	const world = [];
	const visit = ( i, parent ) => {

		const n = gltf.nodes[ i ];
		const m = new Matrix4().compose( new Vector3( ...n.t ), new Quaternion( ...n.r ), new Vector3( ...n.s ) );
		world[ i ] = parent ? parent.clone().multiply( m ) : m;
		for ( const c of n.children ) visit( c, world[ i ] );

	};

	for ( const r of gltf.roots ) visit( r, null );
	const texCache = new Map();
	const tex = async ( info, srgb ) => {

		if ( ! info ) return null;
		const src = gltf.textures[ info.index ].source;
		const key = src + ( srgb ? 's' : 'l' );
		if ( ! texCache.has( key ) ) {

			const im = gltf.images[ src ];
			const px = await decodeImage( im.bytes, im.mimeType );
			const t = new Texture( { label: 'fishModel' + src, width: px.width, height: px.height, format: srgb ? 'rgba8unorm-srgb' : 'rgba8unorm', data: px.data, mips: true, usage: [ 'sample', 'copyDst' ], sampler: 'anisoRepeat' } );
			t.getGPU();
			generateMipmaps( t );
			texCache.set( key, t );

		}

		return texCache.get( key );

	};

	const parts = [];
	for ( let i = 0; i < gltf.nodes.length; i ++ ) {

		const n = gltf.nodes[ i ];
		if ( n.mesh === undefined || ! world[ i ] ) continue;
		for ( const p of gltf.meshes[ n.mesh ] ) {

			const A = p.attributes;
			const geo = new BufferGeometry();
			geo.setAttribute( 'position', new BufferAttribute( A.POSITION.array, 3 ) );
			if ( A.NORMAL ) geo.setAttribute( 'normal', new BufferAttribute( A.NORMAL.array, 3 ) );
			if ( A.TEXCOORD_0 ) geo.setAttribute( 'uv', new BufferAttribute( A.TEXCOORD_0.array instanceof Float32Array ? A.TEXCOORD_0.array : Float32Array.from( A.TEXCOORD_0.array, ( v ) => v / ( A.TEXCOORD_0.normalized ? 65535 : 1 ) ), 2 ) );
			if ( p.indices ) geo.setIndex( new BufferAttribute( p.indices instanceof Uint32Array || p.indices instanceof Uint16Array ? p.indices : Uint32Array.from( p.indices ), 1 ) );
			if ( ! A.NORMAL ) geo.computeVertexNormals();
			geo.computeBoundingSphere();
			const gm = gltf.materials[ p.material ] || {};
			const pbr = gm.pbrMetallicRoughness || {};
			const albedo = await tex( pbr.baseColorTexture, true );
			const mat = new Material( {
				name: 'fishModel-' + ( gm.name || 'material' ),
				textures: albedo ? { fmAlbedo: albedo } : {},
				roughness: pbr.roughnessFactor ?? 1,
				metalness: pbr.metallicFactor ?? 1,
				side: gm.doubleSided ? 'double' : 'front',
				surface: ( albedo ? 'let ca = textureSample( fmAlbedo, smpAnisoRepeat, in.uv ); s.albedo *= ca.rgb;\n' : '' ) + FISH_SURFACE( isUnlit( gm ), spec.recolor ),
			} );
			const mesh = new Mesh( geo, mat );
			mesh.matrixAutoUpdate = false;
			mesh.matrix.copy( world[ i ] );
			mesh.frustumCulled = false;
			mesh.castShadow = true;
			group.add( mesh );
			parts.push( { pos: A.POSITION.array, M: world[ i ] } );

		}

	}

	return { group, parts, update() {}, animated: false };

}

async function skinnedModel( gltf, spec ) {

	const clip = spec.clip;

	const model = await SkinnedModel.create( gltf, { materials: ( info ) => ( { surface: FISH_SURFACE( isUnlit( info.gltfMaterial ), spec.recolor ) } ) } );
	if ( clip && model.clips.has( clip ) ) model.play( clip, { fade: 0.01 } );
	else if ( model.clips.size ) model.play( [ ...model.clips.keys() ][ 0 ], { fade: 0.01 } );
	model.update( 0 );
	// bind-pose bounds: the mesh node's transform applied to its vertices
	const mi = gltf.nodes.findIndex( ( n ) => n.mesh !== undefined && n.skin !== undefined );
	const M = new Matrix4().fromArray( model.world, mi * 16 );
	return { group: model.group, parts: [ { pos: model.meshes[ 0 ].geometry.attributes.position.array, M } ], update: ( dt ) => model.update( dt ), animated: model.clips.size > 0 };

}

// the species' model, normalized to the fish frame (see above)
export async function loadFishModel( id ) {

	const spec = FISH_GLB[ id ];
	const gltf = await loadGLB( FISH_GLB_BASE + spec.file );
	const raw = gltf.skins.length ? await skinnedModel( gltf, spec ) : await staticModel( gltf, spec );
	const lo = [ Infinity, Infinity, Infinity ], hi = [ - Infinity, - Infinity, - Infinity ];
	for ( const { pos, M } of raw.parts ) for ( let i = 0; i < pos.length; i += 3 ) {

		_p.set( pos[ i ], pos[ i + 1 ], pos[ i + 2 ] ).applyMatrix4( M );
		lo[ 0 ] = Math.min( lo[ 0 ], _p.x ); lo[ 1 ] = Math.min( lo[ 1 ], _p.y ); lo[ 2 ] = Math.min( lo[ 2 ], _p.z );
		hi[ 0 ] = Math.max( hi[ 0 ], _p.x ); hi[ 1 ] = Math.max( hi[ 1 ], _p.y ); hi[ 2 ] = Math.max( hi[ 2 ], _p.z );

	}

	// spec.nose: the axis the snout points along ('+x', '-z', ...)
	const axis = spec.nose[ 1 ], sign = spec.nose[ 0 ] === '-' ? - 1 : 1;
	const k = { x: 0, y: 1, z: 2 }[ axis ];
	const len = hi[ k ] - lo[ k ];
	const fix = new Matrix4();
	if ( axis === 'z' && sign < 0 ) fix.makeRotationY( Math.PI );
	else if ( axis === 'x' ) fix.makeRotationY( sign > 0 ? - Math.PI / 2 : Math.PI / 2 );
	// spec.pitch: tilts the nose down (+) / up (-) about the fish's side axis; spec.roll: turns it about its length
	if ( spec.pitch ) fix.premultiply( new Matrix4().makeRotationX( spec.pitch ) );
	if ( spec.roll ) fix.premultiply( new Matrix4().makeRotationZ( spec.roll ) );
	const c = new Vector3( ( lo[ 0 ] + hi[ 0 ] ) / 2, ( lo[ 1 ] + hi[ 1 ] ) / 2, ( lo[ 2 ] + hi[ 2 ] ) / 2 );
	fix.multiply( new Matrix4().makeScale( 1 / len, 1 / len, 1 / len ) ).multiply( new Matrix4().makeTranslation( - c.x, - c.y, - c.z ) );
	const inner = new Group();
	inner.matrixAutoUpdate = false;
	inner.matrix.copy( fix );
	inner.add( raw.group );
	return { group: inner, update: raw.update, animated: raw.animated };

}
