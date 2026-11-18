import { loc } from '../i18n.js';
// Catchable fish: game data for the species the world already swims (world/fish/FishSpecies.js).
//
//   name      display name
//   sci       scientific name
//   lw        [ a, b ] length-weight relation W (g) = a * L (cm, total length) ^ b (FishBase-style values)
//   model     key in SPECIES (the swimming model / skin)
//   habitat   weights per water type (see Bites.habitatAt): shallows (sand, < 3 m), reef (over the
//             reef), pier (around the piles), bay (open water 3–20 m), deep (offshore, > 20 m)
//   kg        [ min, max ] weight; sizes follow a skewed distribution (most fish are small)
//   price     $ per kg at the fish stand
//   fight     0..1 how hard it pulls (surge strength and frequency in the catch mini-game)
//   stamina   seconds of good pressure it takes to tire a typical one
//   time      activity by time of day: 'day', 'dawnDusk', 'night' or 'any'
//   rarity    0..1, scales how often it bites relative to the others in the same water
//   license   1 basic, 2 intermediate, 3 advanced: the licence needed to keep it (Progression.js, docs/DISENO.md D14)
//   protected (optional) true: catch and release only, XP but never money (D31)
export const FISH = {
	silverside: { name: loc( 'Hardhead silverside', 'Pejerrey cabezón' ), sci: 'Atherinomorus stipes', lw: [ 0.0074, 3.1 ], model: 'silverside', habitat: { shallows: 1, pier: 0.6, bay: 0.2 }, kg: [ 0.02, 0.08 ], price: 3, fight: 0.05, stamina: 1.5, time: 'any', rarity: 0.2, license: 1 },
	mullet: { name: loc( 'Striped mullet', 'Lisa rayada' ), sci: 'Mugil cephalus', lw: [ 0.0112, 2.98 ], model: 'mullet', habitat: { shallows: 1, pier: 0.4 }, kg: [ 0.4, 2.2 ], price: 5, fight: 0.3, stamina: 5, time: 'day', rarity: 0.8, license: 1 },
	needlefish: { name: loc( 'Houndfish', 'Agujón' ), sci: 'Tylosurus crocodilus', lw: [ 0.0012, 3.1 ], model: 'needlefish', habitat: { shallows: 0.7, bay: 0.5, pier: 0.3 }, kg: [ 0.5, 2.5 ], price: 4, fight: 0.45, stamina: 5, time: 'day', rarity: 0.5, license: 1 },
	sergeant: { name: loc( 'Sergeant major', 'Sargento mayor' ), sci: 'Abudefduf saxatilis', lw: [ 0.0234, 3.0 ], model: 'sergeant', habitat: { pier: 1, reef: 0.8 }, kg: [ 0.1, 0.35 ], price: 6, fight: 0.15, stamina: 2.5, time: 'day', rarity: 1, license: 1 },
	grunt: { name: loc( 'Bluestriped grunt', 'Ronco amarillo' ), sci: 'Haemulon sciurus', lw: [ 0.0145, 3.06 ], model: 'grunt', habitat: { pier: 1, reef: 0.8, bay: 0.2 }, kg: [ 0.3, 1.2 ], price: 7, fight: 0.25, stamina: 4, time: 'any', rarity: 1, license: 1 },
	yellowtail: { name: loc( 'Yellowtail snapper', 'Rabirrubia' ), sci: 'Ocyurus chrysurus', lw: [ 0.0137, 2.98 ], model: 'yellowtail', habitat: { reef: 1, pier: 0.4, bay: 0.4 }, kg: [ 0.4, 1.6 ], price: 12, fight: 0.4, stamina: 5, time: 'dawnDusk', rarity: 0.9, license: 2 },
	chromis: { name: loc( 'Blue chromis', 'Cromis azul' ), sci: 'Chromis cyanea', lw: [ 0.0209, 3.0 ], model: 'chromis', habitat: { reef: 1 }, kg: [ 0.03, 0.1 ], price: 4, fight: 0.05, stamina: 1.5, time: 'day', rarity: 0.4, license: 1 },
	tang: { name: loc( 'Blue tang', 'Cirujano azul' ), sci: 'Acanthurus coeruleus', lw: [ 0.0282, 2.95 ], model: 'tang', habitat: { reef: 1 }, kg: [ 0.2, 0.6 ], price: 8, fight: 0.2, stamina: 3, time: 'day', rarity: 0.6, license: 1 },
	wrasse: { name: loc( 'Hogfish', 'Pez perro' ), sci: 'Lachnolaimus maximus', lw: [ 0.0151, 3.07 ], model: 'wrasse', habitat: { reef: 0.8, bay: 0.3 }, kg: [ 0.5, 4 ], price: 16, fight: 0.35, stamina: 6, time: 'day', rarity: 0.35, license: 2 },
	parrot: { name: loc( 'Stoplight parrotfish', 'Loro brilloso' ), sci: 'Sparisoma viride', lw: [ 0.0151, 3.06 ], model: 'parrot', habitat: { reef: 1 }, kg: [ 0.8, 4 ], price: 9, fight: 0.35, stamina: 6, time: 'day', rarity: 0.5, license: 2 },
	angel: { name: loc( 'Queen angelfish', 'Ángel reina' ), sci: 'Holacanthus ciliaris', lw: [ 0.0302, 2.94 ], model: 'angel', habitat: { reef: 1 }, kg: [ 0.4, 1.6 ], price: 14, fight: 0.25, stamina: 4, time: 'day', rarity: 0.3, license: 2 },
	jack: { name: loc( 'Crevalle jack', 'Jurel común' ), sci: 'Caranx hippos', lw: [ 0.02, 2.93 ], model: 'jack', habitat: { shallows: 0.5, pier: 0.7, bay: 0.8 }, kg: [ 1, 9 ], price: 6, fight: 0.75, stamina: 12, time: 'dawnDusk', rarity: 0.5, license: 2 },
	barracuda: { name: loc( 'Great barracuda', 'Barracuda' ), sci: 'Sphyraena barracuda', lw: [ 0.0051, 3.08 ], model: 'barracuda', habitat: { reef: 0.5, bay: 0.8, deep: 0.5 }, kg: [ 2, 16 ], price: 5, fight: 0.7, stamina: 11, time: 'any', rarity: 0.45, license: 2 },
	grouper: { name: loc( 'Nassau grouper', 'Mero de Nassau' ), sci: 'Epinephelus striatus', lw: [ 0.0107, 3.07 ], model: 'grouper', habitat: { reef: 0.6, deep: 0.6 }, kg: [ 3, 14 ], price: 15, fight: 0.6, stamina: 12, time: 'any', rarity: 0.3, license: 3 },
	redSnapper: { name: loc( 'Red snapper', 'Pargo colorado' ), sci: 'Lutjanus campechanus', lw: [ 0.0137, 2.98 ], model: 'redSnapper', habitat: { deep: 1, bay: 0.2 }, kg: [ 1.5, 9 ], price: 18, fight: 0.5, stamina: 9, time: 'any', rarity: 0.7, license: 3 },
	tuna: { name: loc( 'Blackfin tuna', 'Atún aleta negra' ), sci: 'Thunnus atlanticus', lw: [ 0.0145, 3.0 ], model: 'tuna', habitat: { deep: 1 }, kg: [ 3, 14 ], price: 16, fight: 0.85, stamina: 16, time: 'dawnDusk', rarity: 0.5, license: 3 },
	mahi: { name: loc( 'Mahi-mahi', 'Dorado' ), sci: 'Coryphaena hippurus', lw: [ 0.0079, 3.0 ], model: 'mahi', habitat: { deep: 0.8 }, kg: [ 4, 18 ], price: 14, fight: 0.8, stamina: 15, time: 'day', rarity: 0.4, license: 3 },
	tarpon: { name: loc( 'Tarpon', 'Sábalo' ), sci: 'Megalops atlanticus', lw: [ 0.0077, 3.02 ], model: 'tarpon', habitat: { pier: 0.35, bay: 0.5, shallows: 0.15 }, kg: [ 10, 45 ], price: 4, fight: 1, stamina: 24, time: 'night', rarity: 0.2, license: 3 },

	// ---- Map 1 · the mountain lake (docs/DISENO.md D30; sizes, prices and length-weight approximate, to validate).
	// Habitats are the lake's water types (maps/lake.js habitat): reeds, pier, river (the mouth), mud (the bay), deep.
	guapucha: { name: loc( 'Guapucha', 'Guapucha' ), sci: 'Grundulus bogotensis', lw: [ 0.01, 3.0 ], model: 'guapucha', habitat: { reeds: 1, pier: 0.4 }, kg: [ 0.005, 0.02 ], price: 2, fight: 0.02, stamina: 1, time: 'day', rarity: 1, license: 1 },
	carachi: { name: loc( 'Carachi', 'Carachi' ), sci: 'Orestias sp.', lw: [ 0.015, 3.0 ], model: 'carachi', habitat: { reeds: 1, pier: 0.6, river: 0.3, mud: 0.5 }, kg: [ 0.02, 0.15 ], price: 3, fight: 0.05, stamina: 1.5, time: 'day', rarity: 1, license: 1 },
	pejerrey: { name: loc( 'Argentinian silverside', 'Pejerrey' ), sci: 'Odontesthes bonariensis', lw: [ 0.006, 3.1 ], model: 'pejerrey', habitat: { reeds: 0.3, pier: 1, river: 0.5, deep: 0.4 }, kg: [ 0.1, 1.2 ], price: 4, fight: 0.15, stamina: 2.5, time: 'day', rarity: 1, license: 1 },
	capitan: { name: loc( 'Savanna catfish', 'Capitán de la sabana' ), sci: 'Eremophilus mutisii', lw: [ 0.006, 3.0 ], model: 'capitan', habitat: { reeds: 0.4, mud: 0.5 }, kg: [ 0.1, 0.8 ], price: 0, fight: 0.25, stamina: 4, time: 'night', rarity: 1, license: 1, protected: true },
	rainbowTrout: { name: loc( 'Rainbow trout', 'Trucha arcoíris' ), sci: 'Oncorhynchus mykiss', lw: [ 0.0107, 3.04 ], model: 'rainbowTrout', habitat: { pier: 0.35, river: 1, deep: 0.8 }, kg: [ 0.2, 4 ], price: 6, fight: 0.45, stamina: 6, time: 'dawnDusk', rarity: 1, license: 2 },
	carp: { name: loc( 'Common carp', 'Carpa común' ), sci: 'Cyprinus carpio', lw: [ 0.0174, 3.1 ], model: 'carp', habitat: { mud: 1, deep: 0.5 }, kg: [ 0.5, 12 ], price: 2, fight: 0.55, stamina: 10, time: 'any', rarity: 1, license: 2 },
	brownTrout: { name: loc( 'Brown trout', 'Trucha café' ), sci: 'Salmo trutta', lw: [ 0.0105, 3.0 ], model: 'brownTrout', habitat: { river: 0.15, deep: 0.45 }, kg: [ 0.5, 6 ], price: 8, fight: 0.55, stamina: 8, time: 'dawnDusk', rarity: 1, license: 3 },
};

// How each species fights (CatchMinigame.js, D62): runs (how often), speed (how fast its runs are), jumps (chance of a
// jump after a run: let go of the right click), dive (how often it heads for the bottom), snag (a dive reaching the
// weeds or rocks cuts the line unless you pull), come (how often it swims at you). Missing values follow from fight.
const STYLES = {
	// the lake
	guapucha: { runs: 0.1, speed: 0.1, come: 0.05 },
	carachi: { runs: 0.2, speed: 0.15 },
	pejerrey: { runs: 0.55, speed: 0.55, come: 0.2 },
	capitan: { runs: 0.15, speed: 0.2, dive: 0.8 },
	rainbowTrout: { runs: 0.8, speed: 0.8, jumps: 0.55, come: 0.25 },
	brownTrout: { runs: 0.6, speed: 0.6, jumps: 0.25, dive: 0.35, snag: true },
	carp: { runs: 0.45, speed: 0.45, dive: 0.7, snag: true },
	// the island
	needlefish: { runs: 0.7, speed: 0.8, jumps: 0.45 },
	mullet: { runs: 0.6, speed: 0.6, jumps: 0.2 },
	grunt: { dive: 0.3 },
	parrot: { dive: 0.3 },
	angel: { dive: 0.3 },
	grouper: { runs: 0.3, speed: 0.5, dive: 0.9, snag: true },
	redSnapper: { runs: 0.5, speed: 0.6, dive: 0.5, snag: true },
	jack: { runs: 0.85, speed: 0.85, dive: 0.2 },
	barracuda: { runs: 0.7, speed: 1.0, jumps: 0.2 },
	tuna: { runs: 0.9, speed: 0.95, dive: 0.4 },
	mahi: { runs: 0.85, speed: 0.9, jumps: 0.5, come: 0.25 },
	tarpon: { runs: 0.8, speed: 0.85, jumps: 0.8 },
};
for ( const k in STYLES ) if ( FISH[ k ] ) FISH[ k ].style = STYLES[ k ];

// Value per hour (docs/DISENO.md D75, D78; measured with tools/balance/equipo-lago.mjs): hourMul scales the price per
// kg and xpMul the XP of each fish so an hour of fishing yields what it did before. The lake has the new rhythm (not
// every bite hooks, fights of a minute or more: 4 to 5 times fewer fish an hour); the island keeps its rhythm and only
// gets back what the flatter size-class prices (trophy ×1.1, unique ×1.2) took. [ hourMul, xpMul ]
const PER_HOUR = {
	guapucha: [ 5.9, 4.8 ], carachi: [ 6.1, 5.4 ], pejerrey: [ 5.0, 3.8 ], capitan: [ 1, 3.6 ],
	rainbowTrout: [ 6.4, 4.7 ], carp: [ 2.5, 2.2 ], brownTrout: [ 4.8, 3.9 ],
	silverside: [ 1.26, 1 ], mullet: [ 1.28, 1 ], needlefish: [ 1.28, 1 ], sergeant: [ 1.26, 1 ], grunt: [ 1.26, 1 ],
	chromis: [ 1.26, 1 ], tang: [ 1.26, 1 ], yellowtail: [ 1.28, 1 ], wrasse: [ 1.3, 1 ], parrot: [ 1.28, 1 ],
	angel: [ 1.27, 1 ], jack: [ 1.3, 1 ], barracuda: [ 1.3, 1 ], redSnapper: [ 1.28, 1 ], grouper: [ 1.27, 1 ],
	tuna: [ 1.28, 1 ], mahi: [ 1.28, 1 ], tarpon: [ 1.27, 1 ],
};
for ( const id in FISH ) [ FISH[ id ].hourMul, FISH[ id ].xpMul ] = PER_HOUR[ id ] || [ 1, 1 ];

export const FISH_IDS = Object.keys( FISH );

// $ value of a fish; trophy-sized ones fetch a bit more per kg
export function fishValue( id, kg ) {

	const f = FISH[ id ];
	const t = ( kg - f.kg[ 0 ] ) / Math.max( f.kg[ 1 ] - f.kg[ 0 ], 1e-6 );
	return Math.max( 1, Math.round( f.price * f.hourMul * kg * ( 1 + 0.25 * Math.max( 0, t - 0.7 ) / 0.3 ) ) );

}

// total length (cm) of a fish of `kg`, from its species' length-weight relation
export function fishLengthCm( id, kg ) {

	const [ a, b ] = FISH[ id ].lw;
	return Math.pow( Math.max( kg, 0.001 ) * 1000 / a, 1 / b );

}
