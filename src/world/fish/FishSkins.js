import { Texture } from '../../engine/gpu/Texture.js';
import { generateMipmaps } from '../../engine/gpu/Mipmaps.js';

// Illustrated fish skins (docs/DISENO.md D59, section 7f): a side-view illustration of the species is
// projected onto the body and fins of the fish model (both flanks), instead of the procedural colours and
// markings. The illustrations are public domain (U.S. Fish and Wildlife Service, many by Duane Raver;
// credits in public/models/fish/skins/CREDITOS.md).
//
// Each skin is one layer of a texture array, prepared offline in a fixed frame (1024 x 512):
//   u = z + 0.5 (z along the fish in total lengths, snout at +0.5, the right edge), v = 0.5 - 2 y
// so the shader samples it at the rest-pose position of the fragment. Outside the silhouette the colours
// are bled outward (alpha keeps the silhouette). The species anatomy (FishSpecies.js) is fitted to the
// illustration, so eye, fins and tail meet their painted counterparts.
//
// Two kinds of illustration:
//   colour   the illustration's colours replace the procedural ones (USFWS paintings)
//   tint     a black and white drawing (old engravings): its shading and lines darken the species' own
//            procedural colours (FishSpecies.js SKIN), so the fish keeps its colours with the drawing's detail
//
// The texture starts empty (alpha 0: the procedural skin shows) and fills in as the images load.

export const SKIN_ART = {
	brownTrout: { file: 'brownTrout.webp' },
	carp: { file: 'carp.webp' },
	guapucha: { file: 'guapucha.webp', tint: true },
	rainbowTrout: { file: 'rainbowTrout.webp' },
	carachi: { file: 'carachi.webp' },
};

// 3D models (GLB, skinned and animated) for a few species, tried on the catch card against the illustrated
// skin (D59). nose: the model axis the snout points along once the GLB's own node transforms are applied.
// Off with ?fishglb=0 in the address.
export const FISH_GLB = {
	rainbowTrout: { file: 'rainbowTrout.glb', clip: 'Casual_Swim', nose: '-z', credit: 'Rainbow Trout - Redband, eb78 (Sketchfab, CC-BY)' },
	carp: { file: 'carp.glb', clip: 'Animation', nose: '-x', credit: 'CC0 Carp, Cyprinus carpio, Animation, ffish.asia / floraZia.com (Sketchfab, CC0)' },
	// stand-ins (no free model of the exact species): a close-looking fish, the card still names the game's species
	brownTrout: { file: 'brownTrout.glb', clip: 'Animation', nose: '-x', credit: 'CC0 Yamame Masu Salmon, ffish.asia / floraZia.com (Sketchfab, CC0)' },
	pejerrey: { file: 'pejerrey.glb', nose: '-x', credit: 'CC0 Flathead Mullet, Mugil cephalus, ffish.asia / floraZia.com (Sketchfab, CC0)' },
	capitan: { file: 'capitan.glb', clip: 'Animation', nose: '-x', credit: 'CC0 Japanese Common Loach, ffish.asia / floraZia.com (Sketchfab, CC0)' },
	guapucha: { file: 'guapucha.glb', clip: 'Animation', nose: '-x', credit: 'CC0 Amur Minnow, ffish.asia / floraZia.com (Sketchfab, CC0)' },
	carachi: { file: 'carachi.glb', clip: 'Animation', nose: '-x', credit: 'CC0 Rice Fish, Oryzias latipes, ffish.asia / floraZia.com (Sketchfab, CC0)' },
};
export const fishGlbOn = () => ! ( typeof location !== 'undefined' && new URLSearchParams( location.search ).get( 'fishglb' ) === '0' );
export const FISH_GLB_BASE = ( ( typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ) || '/' ) + 'models/fish/';

// layer of each illustrated species (the shader reads it from the skin table; -1: procedural skin)
export const SKIN_LAYER = Object.fromEntries( Object.keys( SKIN_ART ).map( ( k, i ) => [ k, i ] ) );
// 1 for the black and white drawings (tint), 0 for the colour illustrations
export const SKIN_TINT = Object.fromEntries( Object.keys( SKIN_ART ).map( ( k ) => [ k, SKIN_ART[ k ].tint ? 1 : 0 ] ) );

const W = 1024, H = 512;
const BASE = ( ( typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL ) || '/' ) + 'models/fish/skins/';

let _tex = null;

async function loadLayer( tex, name, layer ) {

	const blob = await fetch( BASE + SKIN_ART[ name ].file ).then( ( r ) => {

		if ( ! r.ok ) throw new Error( r.status + ' ' + SKIN_ART[ name ].file );
		return r.blob();

	} );
	const bmp = await createImageBitmap( blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' } );
	const cv = new OffscreenCanvas( W, H );
	const g = cv.getContext( '2d', { willReadFrequently: true } );
	g.drawImage( bmp, 0, 0, W, H );
	const data = new Uint8Array( g.getImageData( 0, 0, W, H ).data.buffer );
	tex.upload( data, { layer, layers: 1, width: W, height: H } );

}

// the skins texture array (shared by every fish material); starts loading on first use
export function skinTexture() {

	if ( _tex ) return _tex;
	const n = Math.max( 1, Object.keys( SKIN_ART ).length );
	_tex = new Texture( {
		label: 'fishSkins',
		width: W, height: H, depth: n,
		dimension: '2d-array',
		format: 'rgba8unorm-srgb',
		mips: true,
		usage: [ 'sample', 'copyDst' ],
		sampler: 'anisoClamp',
		data: new Uint8Array( W * H * 4 * n ),
	} );
	if ( typeof fetch !== 'undefined' && typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined' ) {

		Promise.all( Object.keys( SKIN_ART ).map( ( k ) => loadLayer( _tex, k, SKIN_LAYER[ k ] ) ) )
			.then( () => generateMipmaps( _tex ) )
			.catch( ( e ) => console.warn( 'fish skins:', e.message ) );

	}

	return _tex;

}
