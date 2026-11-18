import { loc } from '../i18n.js';
import { mapName, catalogEntry } from './catalog.js';
import { ISLAND } from './island.js';

// Map 1 · the mountain lake (docs/DISENO.md D30, D50–D52, section 7d), inspired by Lake Tota. A prototype (L3): its
// own terrain and calm water; the village, the pier, the traders and the boat stand where they stand on the island
// (the lake's north shore reuses the island's beach). L4: its 7 species and its 5 spots. New games start here (D52).
export const LAKE = {
	id: 'lake',
	name: mapName( 'lake' ),
	xpIndex: 0,

	terrain: async () => ( await import( '../world/LakeTerrainData.js' ) ).LakeTerrainData,

	// same places as the island (the shore around the village is the same); no reef
	layout: {
		...ISLAND.layout,
		reef: { center: ISLAND.layout.reef.center.clone().set( 5000, 0, 5000 ), radius: 1 }, // (no reef on the lake)
	},

	vendors: ISLAND.vendors,

	// the 7 species of the lake (D30; listed in the catalog so the landing page knows them too)
	species: catalogEntry( 'lake' ).species,

	// tackle by pieces (docs/DISENO.md 7h, E2): the new fight, not every bite hooks, values per hour (Tackle.js).
	// Maps without it (the island, until it has its catalogue) keep the P1 fight and rhythm.
	tackle: true,

	// the 5 spots of the lake (D30): each one is one of the lake's water types (habitat below)
	spots: [
		{ id: 'reeds', name: loc( 'Reed shore', 'Orilla de juncos' ), label: { x: - 330, z: 70 } },
		{ id: 'pier', name: loc( 'Village pier', 'Muelle del pueblo' ), label: { x: 150, z: 8 } },
		{ id: 'river', name: loc( 'River mouth', 'Desembocadura' ), label: { x: - 720, z: 230 } },
		{ id: 'mud', name: loc( 'Mud bay', 'Bahía de lodo' ), label: { x: 560, z: 150 } },
		{ id: 'deep', name: loc( 'Deep centre', 'Centro profundo' ), label: { x: 60, z: 470 } },
	],

	// the water types under a point of the lake (weights; Bites.pickSpecies matches them with FISH[id].habitat):
	// the reed shores (shallow), around the pier, the river mouth (the western arm), the mud bay (east), the deep
	// water. Between them the weights stay above zero, so fish bite everywhere in the water.
	habitat( { x, z, depth, pierDist } ) {

		const h = { reeds: 0, pier: 0, river: 0, mud: 0, deep: 0 };
		if ( depth < 0.25 ) return h;
		const s = ( e0, e1, v ) => {

			const t = Math.min( 1, Math.max( 0, ( v - e0 ) / ( e1 - e0 ) ) );
			return t * t * ( 3 - 2 * t );

		};

		h.pier = s( 9, 2, pierDist ) * s( 0.6, 2, depth );
		h.river = 1 - s( 140, 300, Math.hypot( x + 790, z - 268 ) );
		h.mud = s( 380, 460, x ) * ( 1 - s( 5, 9, depth ) );
		h.deep = s( 4, 16, depth ) * ( 1 - h.river ) * ( 1 - h.mud );
		h.reeds = s( 6, 1.5, depth ) * ( 1 - h.river ) * ( 1 - h.mud ) * ( 1 - h.pier );
		return h;

	},

	// the lake's licences (D37 lake prices ×5 for the 120-minute day, D47: basic $10, intermediate $35 at level 4,
	// advanced $60 at level 7, each ×5)
	licenses: [
		null,
		{ tier: 1, id: 'basic', price: 50, minLevel: 1 },
		{ tier: 2, id: 'intermediate', price: 175, minLevel: 4 },
		{ tier: 3, id: 'advanced', price: 300, minLevel: 7 },
	],

	// the minimap and the big map (N) cover the whole valley
	minimap: { x0: - 1024, z0: - 1024, ext: 2048, res: 1024 },

	// the fish that swim in the lake (world/Fish.js BEHAVIOUR kinds; D30 habitats, D61 3D models): groups per
	// zone, each a count of fish. Small fish in the shallows, pejerrey schools by the pier and in open water,
	// trout at the river mouth and in the deep, carp in the mud bay, the capitán on the bottom.
	swimmers: [
		// small fish of the shallows, all around the lake (the zones overlap; each group finds water of its depth)
		{ kind: 'lakeGuapucha', groups: [ 34, 30, 28, 26, 24, 22, 20 ], zone: { x: - 120, z: 20, r: 260 } },
		{ kind: 'lakeGuapucha', groups: [ 30, 26, 24, 22, 20 ], zone: { x: - 520, z: 230, r: 260 } },
		{ kind: 'lakeGuapucha', groups: [ 30, 26, 24, 20 ], zone: { x: 480, z: 140, r: 220 } },
		{ kind: 'lakeGuapucha', groups: [ 28, 24, 22, 20 ], zone: { x: 40, z: 520, r: 700 } },
		{ kind: 'lakeCarachi', groups: [ 9, 8, 8, 7, 6, 6, 5 ], zone: { x: - 200, z: 50, r: 240 } },
		{ kind: 'lakeCarachi', groups: [ 8, 7, 6, 6, 5 ], zone: { x: - 520, z: 230, r: 260 } },
		{ kind: 'lakeCarachi', groups: [ 8, 7, 6, 5 ], zone: { x: 40, z: 520, r: 700 } },
		// pejerrey schools by the pier and in open water
		{ kind: 'lakePejerrey', groups: [ 18, 14, 12 ], zone: { x: 55, z: 30, r: 40 } },
		{ kind: 'lakePejerrey', groups: [ 24, 20, 18, 16 ], zone: { x: 60, z: 260, r: 200 } },
		{ kind: 'lakePejerrey', groups: [ 22, 18, 16, 14 ], zone: { x: 40, z: 450, r: 450 } },
		// trout at the river mouth and in the deep
		{ kind: 'lakeRainbow', groups: [ 4, 3, 3, 3, 2 ], zone: { x: - 720, z: 230, r: 110, band: [ 1.2, 40 ] } },
		{ kind: 'lakeRainbow', groups: [ 4, 3, 3, 2, 2 ], zone: { x: 60, z: 420, r: 300 } },
		{ kind: 'lakeBrown', groups: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], zone: { x: 40, z: 450, r: 400 } },
		// carp in the mud bay and the shallow edges
		{ kind: 'lakeCarp', groups: [ 5, 4, 4, 3, 3 ], zone: { x: 560, z: 150, r: 110 } },
		{ kind: 'lakeCarp', groups: [ 4, 3, 3 ], zone: { x: 120, z: 60, r: 80 } },
		{ kind: 'lakeCarp', groups: [ 4, 3, 3, 2 ], zone: { x: - 300, z: 150, r: 250 } },
		// the capitán on the bottom
		{ kind: 'lakeCapitan', groups: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], zone: { x: 100, z: 200, r: 500 } },
	],

	features: { reef: false, surf: false, seabirds: true, whale: false, palms: false },

	// calm fresh water: light breeze, short fetch, no swell and no surf. Colour (per metre, RGB): Tota's water takes
	// more of the blue than the Caribbean (dissolved organic matter), so the sandy shallows turn pale green and the
	// deep water dark (the reference photo, docs/DISENO.md 7d)
	water: { wind: 2.5, fetch: 6, swell: 0, chop: 0.55, surf: 0, absorption: [ 0.55, 0.11, 0.3 ], scattering: [ 0.0035, 0.0075, 0.0055 ] },

	// a páramo sky: more cloud, a little more haze
	sky: { clouds: 0.72, haze: 2.0 },
};
