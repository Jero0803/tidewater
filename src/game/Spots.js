import { loc } from '../i18n.js';

// Named fishing spots of the island (docs/DISENO.md D9, D40). Phase 1 keeps the five water types the game already
// computes (Bites.habitatAt) and gives each one a name, so the bites and the balance stay as they were: the spot
// under the bobber is the water type that weighs the most there (between spots, the nearest one wins).
//   label: where the name sits on the minimap (world x, z)
export const ISLAND_SPOTS = [
	{ id: 'shallows', name: loc( 'Bay beach', 'Playa de la bahía' ), label: { x: - 30, z: 8 } },
	{ id: 'pier', name: loc( 'Pier', 'Muelle' ), label: { x: 30, z: 25 } },
	{ id: 'reef', name: loc( 'Bay reef', 'Arrecife de la bahía' ), label: { x: - 78, z: 60 } },
	{ id: 'bay', name: loc( 'Mid-bay', 'Centro de la bahía' ), label: { x: 10, z: 125 } },
	{ id: 'deep', name: loc( 'Open sea', 'Mar abierto' ), label: { x: 0, z: 860 } },
];

const BY_ID = Object.fromEntries( ISLAND_SPOTS.map( ( s ) => [ s.id, s ] ) );

// the spot for a habitat (Bites.habitatAt weights); null on the sand / where nothing lives
export function spotOf( habitat ) {

	let best = null, w = 0;
	for ( const s of ISLAND_SPOTS ) {

		const x = habitat[ s.id ] || 0;
		if ( x > w ) {

			w = x;
			best = s;

		}

	}

	return w > 1e-3 ? best : null;

}

export const spotById = ( id ) => BY_ID[ id ] || null;
