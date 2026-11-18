import * as THREE from '../engine/index.js';
import { loc } from '../i18n.js';

// The island (the tropical map, highest of the chain, D25 / D29; the starting map until the lake exists, D45).
// Everything that is particular to this map lives here; the rest of the game reads it through the registry
// (maps/registry.js -> activeMap()). See docs/DISENO.md section 7d.
export const ISLAND = {
	id: 'island',
	name: loc( 'The island', 'La isla' ),
	// XP multiplier index (Progression.mapXpMultiplier): ×1.0 while the island is the starting map (D45)
	xpIndex: 0,

	// the procedural heightmap of this map (loaded lazily: the generator is large and imports the layout)
	terrain: async () => ( await import( '../world/TerrainData.js' ) ).TerrainData,

	// Shared world layout. Coordinates in meters, y up, sea level y = 0.
	// The open ocean lies to the south (+z); the island to the north (-z).
	// Sun rises in the east (+x) and sets in the west (-x).
	layout: {
		terrainSize: 2048, // heightmap domain, centered at origin
		terrainRes: 2048,

		// Central sandy beach inside the bay, shoreline near z ≈ -42 at x = 0.
		beach: { xMin: - 150, xMax: 170 },

		pier: {
			x: 55,
			zStart: - 64, // on dry sand
			zEnd: 40, // end of pier (~4 m depth)
			deckHeight: 2.3, // deck surface above sea level
			width: 2.6,
			headWidth: 14, // T-shaped platform at the end
			headDepth: 7,
		},

		// Where the boat is moored: east side of the pier head, bow pointing south.
		boatDock: { position: new THREE.Vector3( 64.5, 0, 36.5 ), heading: 0 },

		village: { center: new THREE.Vector3( 40, 0, - 118 ), radius: 95 },

		reef: { center: new THREE.Vector3( - 78, 0, 58 ), radius: 58 },

		spawn: { position: new THREE.Vector3( 18, 0, - 60 ), yaw: Math.PI }, // kept clear of rocks, plants and debris
		// where the player starts: on the boardwalk up from the pier foot, looking down it toward the pier
		start: { position: new THREE.Vector3( 53.6, 0, - 77 ), yaw: Math.PI },

		// Incoming swell direction (unit, travel direction)
		swellDir: new THREE.Vector2( - 0.12, - 1 ).normalize(),
	},

	// the traders: Joe's fish stand beside the boardwalk up from the pier foot, Marta's chandlery facing the beach
	vendors: {
		stand: { x: 49.9, z: - 74.6, yaw: 1.45 },
		chandlery: { x: 85.5, z: - 60.5, yaw: - 1.9 },
	},

	// the species that bite here (keys of FishTable.FISH)
	species: [ 'silverside', 'mullet', 'needlefish', 'sergeant', 'grunt', 'chromis', 'tang', 'yellowtail', 'wrasse', 'parrot',
		'angel', 'jack', 'barracuda', 'redSnapper', 'grouper', 'tuna', 'mahi', 'tarpon' ],

	// named spots (D9, D40): each is one of the water types Bites.habitatAt computes; label = where the name sits on
	// the minimap (world x, z)
	spots: [
		{ id: 'shallows', name: loc( 'Bay beach', 'Playa de la bahía' ), label: { x: - 30, z: 8 } },
		{ id: 'pier', name: loc( 'Pier', 'Muelle' ), label: { x: 30, z: 25 } },
		{ id: 'reef', name: loc( 'Bay reef', 'Arrecife de la bahía' ), label: { x: - 78, z: 60 } },
		{ id: 'bay', name: loc( 'Mid-bay', 'Centro de la bahía' ), label: { x: 10, z: 125 } },
		{ id: 'deep', name: loc( 'Open sea', 'Mar abierto' ), label: { x: 0, z: 860 } },
	],

	// licences of this map (D37 island prices ×5 for the 120-minute day, D47; levels 4 and 7, D43)
	licenses: [
		null,
		{ tier: 1, id: 'basic', price: 175, minLevel: 1 },
		{ tier: 2, id: 'intermediate', price: 500, minLevel: 4 },
		{ tier: 3, id: 'advanced', price: 1000, minLevel: 7 },
	],

	// world systems this map has (read by App when building the world; the island has all of them)
	features: { reef: true, surf: true, seabirds: true, whale: true, palms: true },
};
