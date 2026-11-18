import { smoothstep, clamp, lerp } from '../util/Noise.js';
import { upsample2, boxBlur } from './terrain/TerrainNoise.js';
import { TerrainData } from './TerrainData.js';

// Map 1 · the mountain lake (docs/DISENO.md D30, D51: inspired by Lake Tota). Same data as the island's heightmap
// (TerrainData: heights, rock / sand / path / gully / seagrass / rubble / scarp masks, rock sites, building pads)
// so every system that reads the terrain works unchanged; only the generation differs.
//
// Layout (x east, z south, water level y = 0): the village, the pier, the traders and the boat sit where they are on
// the island, on the lake's north shore, a white-sand beach ("Playa Blanca") with the island's tuned profile (the
// pier ends over ~4 m of water). The lake opens to the south: a big island and a small one, a western arm with a
// river mouth, a shallow muddy bay to the east and a deep centre (~50 m). All around, slopes climb to mountains of
// 250–300 m (the páramo) up to the edge of the domain. A prototype (D50): cold vegetation, colours and details come
// in the polishing layers.
const RES = 2048;

const ell = ( x, z, cx, cz, rx, rz ) => ( Math.hypot( ( x - cx ) / rx, ( z - cz ) / rz ) - 1 ) * Math.min( rx, rz );
const smin = ( a, b, k ) => {

	const h = clamp( 0.5 + 0.5 * ( b - a ) / k, 0, 1 );
	return lerp( b, a, h ) - k * h * ( 1 - h );

};

const smax = ( a, b, k ) => - smin( - a, - b, k );

// the beach zone around the village and the pier: a straight shoreline at z ≈ -42 and the island's beach profile
const beachZoneAt = ( x, z ) => ( 1 - smoothstep( 130, 215, Math.abs( x - 20 ) ) ) * ( 1 - smoothstep( 70, 170, z + 40 ) ) * smoothstep( - 280, - 140, z );
const SHORE_Z = - 42;

// the river that feeds the western arm: out of a gorge in the western mountains (it never reaches the edge of the
// domain: the water plane beyond it would show through the valley as an open sea) down to the arm's tip
const RIVER = [ [ - 930, 225 ], [ - 890, 245 ], [ - 850, 262 ], [ - 800, 270 ] ];

function riverDistance( x, z ) {

	let best = Infinity;
	for ( let i = 0; i < RIVER.length - 1; i ++ ) {

		const [ ax, az ] = RIVER[ i ], [ bx, bz ] = RIVER[ i + 1 ];
		const dx = bx - ax, dz = bz - az;
		const t = clamp( ( ( x - ax ) * dx + ( z - az ) * dz ) / ( dx * dx + dz * dz ), 0, 1 );
		best = Math.min( best, Math.hypot( x - ax - dx * t, z - az - dz * t ) );

	}

	return best;

}

export class LakeTerrainData extends TerrainData {

	// signed distance to the lake shore (m): > 0 water, < 0 land (before the beach blend)
	_lakeSDF( x, z ) {

		const n = this.noise;
		// irregular coast: warp the shapes, less near the village beach
		const bz = beachZoneAt( x, z );
		const w = 1 - bz;
		const wx = x + n.fbm( x / 260, z / 260, 3 ) * 55 * w, wz = z + n.fbm( x / 260 + 4.7, z / 260 - 2.9, 3 ) * 55 * w;
		let e = ell( wx, wz, 40, 368, 620, 410 ); // main body (north edge at z ≈ -42 by the pier)
		e = smin( e, ell( wx, wz, - 560, 262, 270, 130 ), 70 ); // western arm (river mouth)
		e = smin( e, ell( wx, wz, 540, 150, 195, 160 ), 70 ); // eastern muddy bay
		e = smax( e, - ell( wx, wz, - 170, 540, 125, 85 ), 30 ); // the big island
		e = smax( e, - ell( wx, wz, 310, 650, 72, 52 ), 20 ); // the small island
		const d = - e;
		return { d: lerp( d, z - SHORE_Z, bz ), bz };

	}

	coastDistance( x, z ) {

		const { d, bz } = this._lakeSDF( x, z );
		return { d, beachZone: bz };

	}

	heightFn( x, z ) {

		const { d, bz } = this._lakeSDF( x, z );
		return { h: this._height( x, z, d, bz ), rock: 0 };

	}

	// no footpaths on the lake yet
	pathDistance() {

		return Infinity;

	}

	// terrain height from the shore distance (d > 0 water)
	_height( x, z, d, bz ) {

		const n = this.noise, n2 = this.noise2;
		let h;
		if ( d > 0 ) {

			// lake bed: steep-ish shores, a deep centre, the island's beach profile by the pier
			let depth = 14 * ( 1 - Math.exp( - d / 40 ) ) + Math.max( 0, d - 50 ) * 0.09;
			depth += 22 * Math.exp( - ( ( x - 60 ) ** 2 + ( z - 520 ) ** 2 ) / ( 240 * 240 ) );
			const beach = d <= 82 ? d * 0.0512 : 4.2 + ( d - 82 ) * 0.145;
			depth = lerp( depth, beach, bz );
			// the muddy bay (east) and the river delta (west) stay shallow
			const east = smoothstep( 390, 520, x ), west = smoothstep( - 390, - 520, x );
			depth = Math.min( depth, lerp( depth, 2.2 + d * 0.004, east ) );
			depth = Math.min( depth, lerp( depth, 1.6 + d * 0.006, west ) );
			depth += n2.fbm( x / 45, z / 45, 3 ) * 0.7 * smoothstep( 2, 8, depth ) * ( 1 - bz );
			h = - Math.max( 0.3, depth );

		} else {

			const e = - d;
			// rounded Andean hills (the reference photo: broad, low, layered), higher toward the edge of the domain
			const roll = 0.5 + 0.5 * n.fbm( x / 460, z / 460, 4 );
			// separate rounded hills (smooth lumps of the noise) on top of the broad rise
			const knolls = smoothstep( - 0.05, 0.55, n2.fbm( x / 280 + 3.1, z / 280 - 1.7, 3 ) ) * smoothstep( 60, 420, e );
			const hills = 34 * ( 1 - Math.exp( - e / 90 ) ) + smoothstep( 40, 650, e ) * ( 40 + 110 * roll ) + knolls * 90 + n2.fbm( x / 160, z / 160, 3 ) * 9 * smoothstep( 6, 50, e );
			// by the village: the beach (white sand), the village terrace, the hills behind
			const village = Math.min( e * 0.035, 2.1 ) + smoothstep( 60, 170, e ) * 4 + smoothstep( 170, 520, e ) * 70 + n2.fbm( x / 90, z / 90, 3 ) * 3 * smoothstep( 120, 220, e );
			h = lerp( hills, village, bz );
			// a mountain wall along the edge of the domain hides the world beyond it (the ocean plane goes on forever)
			const edge = 1024 - Math.max( Math.abs( x ), Math.abs( z ) );
			h += ( 1 - smoothstep( 0, 320, edge ) ) * ( 95 + 110 * roll + 50 * knolls ) * smoothstep( 0, 120, e );
			h = Math.max( h, 0.2 + e * 0.025 ); // the shore always rises out of the water

		}

		// the river: a valley and a channel below the water level, closing into a gorge at its source
		const c = riverDistance( x, z ) + Math.max( 0, - 900 - x ) * 6;
		if ( c < 220 ) {

			const valley = smoothstep( 12, 200, c );
			if ( h > 0 ) h = lerp( Math.min( h, 3 ), h, valley );
			h = lerp( - 1.4, h, smoothstep( 6, 16, c ) );

		}

		return h;

	}

	generate() {

		const T = this.timings;
		let t = performance.now();
		const tick = ( name ) => {

			const now = performance.now();
			T[ name ] = Math.round( now - t );
			t = now;

		};

		this.paths = [];
		const { origin } = this;

		// ---- 2 m grid: shore distance, beach zone, height
		const NB = RES / 2, TB = this.size / NB;
		const Bh = new Float32Array( NB * NB ), Bd = new Float32Array( NB * NB ), Bbz = new Float32Array( NB * NB );
		for ( let j = 0; j < NB; j ++ ) {

			const z = origin + ( j + 0.5 ) * TB;
			for ( let i = 0; i < NB; i ++ ) {

				const x = origin + ( i + 0.5 ) * TB;
				const { d, bz } = this._lakeSDF( x, z );
				const k = j * NB + i;
				Bd[ k ] = d; Bbz[ k ] = bz;
				Bh[ k ] = this._height( x, z, d, bz );

			}

		}

		tick( 'gridB' );

		// ---- 1 m grid
		const H = upsample2( Bh, NB, true );
		const D = upsample2( Bd, NB, false );
		const BZ = upsample2( Bbz, NB, false );
		this.heights = H;
		tick( 'upsample' );

		// fine relief on land (stones, tussocks), not on the beach or the village terrace
		const n3 = this.noise3;
		for ( let j = 0; j < RES; j ++ ) {

			const z = origin + j + 0.5;
			for ( let i = 0; i < RES; i ++ ) {

				const k = j * RES + i;
				if ( D[ k ] > - 3 ) continue;
				const x = origin + i + 0.5;
				H[ k ] += n3.fbm( x / 9, z / 9, 2 ) * 0.35 * smoothstep( 3, 25, - D[ k ] ) * ( 1 - BZ[ k ] * smoothstep( - 150, - 60, D[ k ] ) );

			}

		}

		tick( 'detail' );

		this._lakeMasks( H, D, BZ );
		this.rock = boxBlur( this.rock, RES, RES, 1 );
		tick( 'masks' );
		T.total = Object.values( T ).reduce( ( a, b ) => a + b, 0 );

	}

	_lakeMasks( H, D, BZ ) {

		const res = RES, o = this.origin, n2 = this.noise2, n3 = this.noise3;
		const { rock, sand, seagrass } = this;
		for ( let j = 1; j < res - 1; j ++ ) {

			const z = o + j + 0.5;
			for ( let i = 1; i < res - 1; i ++ ) {

				const k = j * res + i;
				const h = H[ k ], d = D[ k ], bz = BZ[ k ];
				const x = o + i + 0.5;
				const gx = H[ k + 1 ] - H[ k - 1 ], gz = H[ k + res ] - H[ k - res ];
				const slope = Math.sqrt( gx * gx + gz * gz ) * 0.5;
				const nz = n2.noise( x / 23, z / 23 ) * 0.5 + n3.noise( x / 7, z / 7 ) * 0.25;
				if ( d > 0 ) {

					// lake bed: sand and mud; weed beds in the shallows away from the beach; rock on steep drops
					sand[ k ] = 255;
					rock[ k ] = smoothstep( 0.7, 1.1, slope ) * 0.7;
					const depth = - h;
					const weed = smoothstep( 0.8, 1.6, depth ) * ( 1 - smoothstep( 5, 8, depth ) ) * ( 1 - bz ) * smoothstep( - 0.1, 0.25, nz );
					seagrass[ k ] = Math.round( clamp( weed, 0, 1 ) * 255 );
					continue;

				}

				const e = - d;
				// bare rock: steep faces and the high páramo
				const steep = smoothstep( 0.85 + nz * 0.3, 1.25 + nz * 0.3, slope );
				const high = smoothstep( 170, 250, h ) * smoothstep( 0.25, 0.6, slope ) * ( 0.6 + nz );
				rock[ k ] = clamp( Math.max( steep, high ), 0, 1 );
				// white sand: Playa Blanca by the village, a thin strip on gentle shores elsewhere
				const beach = bz * ( 1 - smoothstep( 40 + nz * 10, 58 + nz * 12, e ) );
				const strip = ( 1 - smoothstep( 2, 5 + nz * 3, e ) ) * ( 1 - smoothstep( 0.15, 0.35, slope ) ) * 0.7;
				sand[ k ] = Math.round( clamp( Math.max( beach, strip ) * ( 1 - smoothstep( 0.3, 0.6, slope ) ), 0, 1 ) * 255 );

			}

		}

	}

}
