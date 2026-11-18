import { activeMap } from '../maps/registry.js';

// Named fishing spots of the active map (docs/DISENO.md D9, D40; the list lives in maps/*.js). Phase 1 keeps the
// five water types the game already computes (Bites.habitatAt) and gives each one a name, so the bites and the
// balance stay as they were: the spot under the bobber is the water type that weighs the most there (between
// spots, the nearest one wins).
//   label: where the name sits on the minimap (world x, z)
export const SPOTS = activeMap().spots;
export const ISLAND_SPOTS = SPOTS; // (older name)

const BY_ID = Object.fromEntries( SPOTS.map( ( s ) => [ s.id, s ] ) );

// the spot for a habitat (Bites.habitatAt weights); null on the sand / where nothing lives
export function spotOf( habitat ) {

	let best = null, w = 0;
	for ( const s of SPOTS ) {

		const x = habitat[ s.id ] || 0;
		if ( x > w ) {

			w = x;
			best = s;

		}

	}

	return w > 1e-3 ? best : null;

}

export const spotById = ( id ) => BY_ID[ id ] || null;
