import { loc } from '../i18n.js';
import { mapName } from './catalog.js';
import { ISLAND } from './island.js';

// Map 1 · the mountain lake (docs/DISENO.md D30, D50–D52, section 7d), inspired by Lake Tota. A prototype (L3): its
// own terrain and calm water; the village, the pier, the traders and the boat stand where they stand on the island
// (the lake's north shore reuses the island's beach). Species, spots and the XP multiplier of the lake come in L4:
// until then it fishes like the island.
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

	// L4 brings the lake's species and spots (D30); until then the island's
	species: ISLAND.species,
	spots: [
		{ id: 'shallows', name: loc( 'Playa Blanca', 'Playa Blanca' ), label: { x: - 30, z: 8 } },
		{ id: 'pier', name: loc( 'Village pier', 'Muelle del pueblo' ), label: { x: 30, z: 25 } },
		{ id: 'reef', name: loc( 'Reef', 'Arrecife' ), label: { x: 5000, z: 5000 } },
		{ id: 'bay', name: loc( 'Open lake', 'Lago abierto' ), label: { x: 10, z: 160 } },
		{ id: 'deep', name: loc( 'Deep centre', 'Centro profundo' ), label: { x: 60, z: 560 } },
	],

	// the lake's licences (D37 lake prices ×5 for the 120-minute day, D47: basic $10, intermediate $35 at level 4,
	// advanced $60 at level 7, each ×5)
	licenses: [
		null,
		{ tier: 1, id: 'basic', price: 50, minLevel: 1 },
		{ tier: 2, id: 'intermediate', price: 175, minLevel: 4 },
		{ tier: 3, id: 'advanced', price: 300, minLevel: 7 },
	],

	features: { reef: false, surf: false, seabirds: true, whale: false, palms: false },

	// calm fresh water: light breeze, short fetch, no swell and no surf. Colour (per metre, RGB): Tota's water takes
	// more of the blue than the Caribbean (dissolved organic matter), so the sandy shallows turn pale green and the
	// deep water dark (the reference photo, docs/DISENO.md 7d)
	water: { wind: 2.5, fetch: 6, swell: 0, chop: 0.55, surf: 0, absorption: [ 0.55, 0.11, 0.3 ], scattering: [ 0.0035, 0.0075, 0.0055 ] },

	// a páramo sky: more cloud, a little more haze
	sky: { clouds: 0.72, haze: 2.0 },
};
