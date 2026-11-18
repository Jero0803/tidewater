import { loc } from '../i18n.js';
// Tackle by pieces (docs/DISENO.md 7h, D63–D75): the catalogue, what each species likes, the stats of an assembled
// rod and how much a fish bites on it. Pure data and functions, importable in Node (tests, tools/balance).
//
//   rig = { rod, reel, line, hook, float, sinker, bait }   ids from the tables below (hook, float, sinker: numbers);
//                                                           bait is a bait or a lure id
//   rigStats( rig )            the numbers the game reads (cast, reel speed, drag cap, line strength, line capacity…)
//   rigProblems( rig )         what is missing or doesn't fit ([] = ready to fish)
//   biteMul( species, rig )    how much more / less that species bites on it (line × bait × hook)
//
// E1 only defines and tests all this; the game starts using it with the new fight (E2) and the new shop (E3).
// Saves will store piece ids: only add entries, never rename or remove one.

// Rod power: line range (kg), lure / sinker range (g), stiffness (0 soft .. 1 stiff: how much of a jolt reaches the
// hook). A rod breaks above 1.25 × the top of its line range.
export const POWERS = {
	UL: { name: loc( 'ultralight', 'ultraligera' ), line: [ 1, 3 ], lure: [ 1, 5 ], stiff: 0.2 },
	L: { name: loc( 'light', 'ligera' ), line: [ 2, 5 ], lure: [ 3, 12 ], stiff: 0.35 },
	ML: { name: loc( 'medium light', 'media-ligera' ), line: [ 3, 7 ], lure: [ 5, 20 ], stiff: 0.5 },
	M: { name: loc( 'medium', 'media' ), line: [ 5, 10 ], lure: [ 10, 40 ], stiff: 0.65 },
	MH: { name: loc( 'medium heavy', 'media-pesada' ), line: [ 7, 14 ], lure: [ 20, 80 ], stiff: 0.8 },
};
export const ROD_BREAK = 1.25;

// tech: float (bobber), spin (lures), bottom (sinker); castM: cast distance; cost $, level: minimum level
export const RODS = {
	floatUL: { name: loc( 'Telescopic float rod 3 m', 'Telescópica de flotador 3 m' ), tech: 'float', power: 'UL', castM: 18, cost: 25, level: 1 }, // the starter rod: given in a new game
	floatL: { name: loc( 'Telescopic float rod 4 m', 'Telescópica de flotador 4 m' ), tech: 'float', power: 'L', castM: 22, cost: 60, level: 2 },
	spinUL: { name: loc( 'Spinning rod 1.8 m', 'Spinning 1.8 m' ), tech: 'spin', power: 'UL', castM: 24, cost: 70, level: 2 },
	spinL: { name: loc( 'Spinning rod 2.1 m', 'Spinning 2.1 m' ), tech: 'spin', power: 'L', castM: 30, cost: 120, level: 3 },
	spinML: { name: loc( 'Spinning rod 2.4 m', 'Spinning 2.4 m' ), tech: 'spin', power: 'ML', castM: 34, cost: 150, level: 5 },
	bottomM: { name: loc( 'Bottom rod 3 m', 'Fondo 3 m' ), tech: 'bottom', power: 'M', castM: 40, cost: 130, level: 4 },
	bottomMH: { name: loc( 'Bottom rod 3.6 m', 'Fondo 3.6 m' ), tech: 'bottom', power: 'MH', castM: 45, cost: 220, level: 7 },
};

// reel: m/s; dragMax: kg; cap25: metres of 0.25 mm line it holds (other diameters scale with the cross-section)
export const REELS = {
	r1000: { name: loc( 'Reel 1000', 'Carrete 1000' ), reel: 0.9, dragMax: 3, cap25: 120, cost: 20, level: 1 }, // the starter reel: given in a new game
	r2000: { name: loc( 'Reel 2000', 'Carrete 2000' ), reel: 1.0, dragMax: 4, cap25: 150, cost: 50, level: 2 },
	r2500: { name: loc( 'Reel 2500', 'Carrete 2500' ), reel: 1.1, dragMax: 6, cap25: 180, cost: 90, level: 3 },
	r3000: { name: loc( 'Reel 3000', 'Carrete 3000' ), reel: 1.2, dragMax: 8, cap25: 200, cost: 110, level: 5 },
	r4000: { name: loc( 'Bottom reel 4000', 'Carrete de fondo 4000' ), reel: 1.3, dragMax: 12, cap25: 250, cost: 150, level: 6 },
};

// spools of 150 m; kg: breaking strength; d: diameter (mm); vis: how thick it looks to a fish (fluorocarbon less)
export const LINE_SPOOL_M = 150;
export const LINES = {
	m12: { name: loc( 'Mono 0.12 mm', 'Monofilamento 0.12 mm' ), kg: 1.5, d: 0.12, vis: 1, cost: 8, level: 1 },
	m16: { name: loc( 'Mono 0.16 mm', 'Monofilamento 0.16 mm' ), kg: 2.5, d: 0.16, vis: 1, cost: 10, level: 1 },
	m20: { name: loc( 'Mono 0.20 mm', 'Monofilamento 0.20 mm' ), kg: 3.5, d: 0.20, vis: 1, cost: 12, level: 2 },
	m25: { name: loc( 'Mono 0.25 mm', 'Monofilamento 0.25 mm' ), kg: 5, d: 0.25, vis: 1, cost: 15, level: 3 },
	m30: { name: loc( 'Mono 0.30 mm', 'Monofilamento 0.30 mm' ), kg: 7, d: 0.30, vis: 1, cost: 18, level: 4 },
	m35: { name: loc( 'Mono 0.35 mm', 'Monofilamento 0.35 mm' ), kg: 9, d: 0.35, vis: 1, cost: 22, level: 5 },
	m40: { name: loc( 'Mono 0.40 mm', 'Monofilamento 0.40 mm' ), kg: 12, d: 0.40, vis: 1, cost: 26, level: 6 },
	f18: { name: loc( 'Fluorocarbon 0.18 mm', 'Fluorocarbono 0.18 mm' ), kg: 3, d: 0.18, vis: 0.65, cost: 30, level: 4 },
	f22: { name: loc( 'Fluorocarbon 0.22 mm', 'Fluorocarbono 0.22 mm' ), kg: 4.5, d: 0.22, vis: 0.65, cost: 36, level: 5 },
};

// packs: hooks by size (bigger number = smaller hook), floats and sinkers by grams; they go with a lost line
export const HOOKS = {
	14: { n: 10, cost: 3 }, 12: { n: 10, cost: 3 }, 10: { n: 10, cost: 3 }, 8: { n: 10, cost: 4 },
	6: { n: 10, cost: 4 }, 4: { n: 10, cost: 5 }, 2: { n: 10, cost: 5 }, 1: { n: 10, cost: 6 },
};
export const FLOATS = { 1: { n: 5, cost: 2 }, 3: { n: 5, cost: 3 }, 6: { n: 5, cost: 4 } };
export const SINKERS = { 20: { n: 5, cost: 2 }, 40: { n: 5, cost: 3 }, 60: { n: 5, cost: 4 } };

// baits: packs of n, one used per bite (landed or lost); g: weight on the hook
export const BAITS = {
	larva: { name: loc( 'Maggots', 'Larvas' ), n: 30, cost: 4, level: 1, g: 1 },
	worm: { name: loc( 'Worms', 'Lombrices' ), n: 20, cost: 5, level: 1, g: 2 },
	corn: { name: loc( 'Sweetcorn', 'Maíz' ), n: 40, cost: 3, level: 2, g: 1 },
	bread: { name: loc( 'Bread paste', 'Masa de pan' ), n: 25, cost: 3, level: 1, g: 1 },
	pellet: { name: loc( 'Trout pellets', 'Pellet de trucha' ), n: 30, cost: 6, level: 3, g: 1 },
	grasshopper: { name: loc( 'Grasshoppers', 'Saltamontes' ), n: 20, cost: 6, level: 2, g: 1 },
	eggs: { name: loc( 'Artificial trout eggs', 'Huevas de trucha artificiales' ), n: 30, cost: 7, level: 3, g: 1 },
	// D79: small fish as live bait (caught guapuchas and carachis go in the bucket, or bought)
	livebait: { name: loc( 'Live baitfish', 'Pez carnada vivo' ), n: 10, cost: 8, level: 4, g: 3 },
};
// lures: bought one by one, lost with a snapped line; they carry their own hook
export const LURES = {
	spin1: { name: loc( 'Spinner #1 (3 g)', 'Cucharilla giratoria #1 (3 g)' ), g: 3, cost: 8, level: 2 },
	spin2: { name: loc( 'Spinner #2 (6 g)', 'Cucharilla giratoria #2 (6 g)' ), g: 6, cost: 10, level: 3 },
	spoon: { name: loc( 'Spoon (8 g)', 'Cucharilla ondulante (8 g)' ), g: 8, cost: 10, level: 4 },
	minnow: { name: loc( 'Minnow 5 cm (6 g)', 'Pececito 5 cm (6 g)' ), g: 6, cost: 14, level: 5 },
	soft: { name: loc( 'Soft plastic 7 cm + 5 g jig head', 'Plástico blando 7 cm + cabeza 5 g' ), g: 5, cost: 6, level: 4 },
};

export const isLure = ( id ) => id in LURES;

// What each species likes (the lake first; species without an entry bite on anything as before):
//   best / ok   preferred baits and lures (×1) and acceptable ones (×0.4); anything else ×0.05
//   hook        [ biggest, smallest ] hook size that fits its mouth
//   lineD       the thickest line (mm) it doesn't notice; wary 0..1, how much a thicker one puts it off
//   mouth       how much the hook holds before tearing out (× weight^0.6, used by the fight from E2)
//   power       the rod powers that suit it (the shop's "for which fish")
export const PREFS = {
	guapucha: { best: [ 'larva', 'bread' ], ok: [ 'worm' ], hook: [ 10, 14 ], lineD: 0.12, wary: 0.2, mouth: 1.2, power: [ 'UL' ] },
	carachi: { best: [ 'larva', 'worm' ], ok: [ 'bread' ], hook: [ 8, 12 ], lineD: 0.14, wary: 0.3, mouth: 1.4, power: [ 'UL', 'L' ] },
	pejerrey: { best: [ 'larva', 'spin1' ], ok: [ 'worm', 'spin2' ], hook: [ 6, 10 ], lineD: 0.16, wary: 0.5, mouth: 1.3, power: [ 'UL', 'L' ] },
	capitan: { best: [ 'worm' ], ok: [ 'larva' ], hook: [ 4, 8 ], lineD: 0.25, wary: 0.3, mouth: 2.2, power: [ 'L', 'ML' ] },
	// reference: a trout lake of Fishing Planet (level 5): insects, eggs and small spinners first (2026-11-18)
	rainbowTrout: { best: [ 'spin1', 'spin2', 'eggs', 'grasshopper' ], ok: [ 'worm', 'larva', 'spoon', 'soft', 'pellet', 'corn', 'livebait' ], hook: [ 4, 8 ], lineD: 0.20, wary: 0.8, mouth: 1.5, power: [ 'L', 'ML' ] },
	carp: { best: [ 'corn', 'bread', 'pellet' ], ok: [ 'worm' ], hook: [ 1, 6 ], lineD: 0.30, wary: 0.4, mouth: 2.4, power: [ 'M', 'MH' ] },
	brownTrout: { best: [ 'minnow', 'spoon', 'livebait' ], ok: [ 'worm', 'soft', 'spin2', 'grasshopper' ], hook: [ 2, 6 ], lineD: 0.22, wary: 0.85, mouth: 1.6, power: [ 'ML', 'M' ] },
};

export const BITE = { ok: 0.4, other: 0.05, lineMin: 0.25, lineSlope: 1.5, bigHook: 0.4, bigHookMiss: 0.5 };

// The free starter rod (D72): telescopic float rod, reel 1000, mono 0.16, hooks #12, 3 g floats, maggots.
export const STARTER_RIG = { rod: 'floatUL', reel: 'r1000', line: 'm16', hook: 12, float: 3, sinker: null, bait: 'larva' };
// what comes with it in the bag (packs)
export const STARTER_BAG = { larva: 1, worm: 1 };

export function rigStats( rig ) {

	const rod = RODS[ rig.rod ], reel = REELS[ rig.reel ], line = LINES[ rig.line ];
	if ( ! rod || ! reel || ! line ) return null;
	const pw = POWERS[ rod.power ];
	const lure = LURES[ rig.bait ];
	return {
		tech: rod.tech, power: rod.power, stiff: pw.stiff,
		castM: rod.castM, reelSpeed: reel.reel, dragMax: reel.dragMax,
		lineKg: line.kg, lineD: line.d, // what is on the reel: the spool (150 m) or what the reel holds of this diameter, whichever is less (as in
		// Fishing Planet: a small reel takes only part of a spool)
		lineCap: Math.round( Math.min( LINE_SPOOL_M, reel.cap25 * ( 0.25 / line.d ) ** 2 ) ),
		rodMax: pw.line[ 1 ] * ROD_BREAK,
		// what hangs on the line: the lure, or the float / sinker plus the bait
		castG: lure ? lure.g : ( rod.tech === 'bottom' ? ( rig.sinker || 0 ) : ( rig.float || 0 ) ) + ( BAITS[ rig.bait ]?.g || 0 ),
	};

}

// What keeps a rig from fishing, or makes it a bad idea. Codes (the UI words them):
//   'rod' 'reel' 'line' 'bait'       missing piece
//   'hook'                           a bait needs a hook (a lure carries its own)
//   'float' / 'sinker'               the float rod needs a float, the bottom rod a sinker
//   'lureTech'                       a lure on a float or bottom rod / a bait on a spinning rod
//   'lineHeavy' / 'lineLight'        line outside the rod's range (warning: heavy can break the rod)
//   'castHeavy' / 'castLight'        lure or sinker outside the rod's casting range (warning)
export const BLOCKING = new Set( [ 'rod', 'reel', 'line', 'bait', 'hook', 'float', 'sinker', 'lureTech' ] );
export function rigProblems( rig ) {

	const out = [];
	for ( const k of [ 'rod', 'reel', 'line', 'bait' ] ) if ( ! rig[ k ] ) out.push( k );
	const rod = RODS[ rig.rod ];
	if ( ! rod ) return out;
	const lure = isLure( rig.bait );
	if ( rig.bait && ! lure && ! rig.hook ) out.push( 'hook' );
	if ( rig.bait && ( lure !== ( rod.tech === 'spin' ) ) ) out.push( 'lureTech' );
	if ( rod.tech === 'float' && ! rig.float ) out.push( 'float' );
	if ( rod.tech === 'bottom' && ! rig.sinker ) out.push( 'sinker' );
	const pw = POWERS[ rod.power ], line = LINES[ rig.line ];
	if ( line && line.kg > pw.line[ 1 ] ) out.push( 'lineHeavy' );
	if ( line && line.kg < pw.line[ 0 ] ) out.push( 'lineLight' );
	const s = rigStats( rig );
	if ( s && rig.bait ) {

		if ( s.castG > pw.lure[ 1 ] ) out.push( 'castHeavy' );
		if ( s.castG < pw.lure[ 0 ] ) out.push( 'castLight' );

	}

	return out;

}

export const rigReady = ( rig ) => ! rigProblems( rig ).some( ( p ) => BLOCKING.has( p ) );

// How much a species bites on this rig relative to the right one (D64): line × bait × hook.
//   line   ×1 up to the thickest line it doesn't notice; thicker drops with its wariness (never below ×0.25)
//   bait   preferred ×1, acceptable ×0.4, anything else ×0.05
//   hook   bigger than its mouth: ×0.4, and half of those bites miss on the strike (×0.5)
// Species without preferences: ×1 (they bite as before).
export function biteMul( species, rig ) {

	const p = PREFS[ species ], line = LINES[ rig.line ];
	if ( ! p || ! line ) return { line: 1, bait: 1, hook: 1, total: 1 };
	const d = line.d * line.vis;
	const lineMul = d <= p.lineD + 1e-9 ? 1 : Math.max( BITE.lineMin, 1 - p.wary * ( d / p.lineD - 1 ) * BITE.lineSlope );
	const baitMul = p.best.includes( rig.bait ) ? 1 : p.ok.includes( rig.bait ) ? BITE.ok : BITE.other;
	// a lure's own hook always fits the fish it is meant for
	const hookMul = ! isLure( rig.bait ) && rig.hook && rig.hook < p.hook[ 0 ] ? BITE.bigHook * BITE.bigHookMiss : 1;
	return { line: lineMul, bait: baitMul, hook: hookMul, total: lineMul * baitMul * hookMul };

}

// What the fight needs from the rig for this fish (CatchMinigame `tackle`, E2)
export function fightTackle( species, rig ) {

	const s = rigStats( rig );
	if ( ! s ) return null;
	const pw = POWERS[ s.power ];
	return { stiff: s.stiff, rodMax: s.rodMax, rodMin: pw.line[ 0 ], dragMax: s.dragMax, mouth: PREFS[ species ]?.mouth ?? 2, smallHook: hookTooSmall( species, rig ) };

}

// The float rig grades of the Phase 1 shop as rods of the catalogue (the lake): the starter rod, then stronger rods,
// reels and lines. Saves from before tackle by pieces get the rod of their grade (TackleBag.tackleFromGrade).
export const GRADE_RIGS = [
	STARTER_RIG,
	{ rod: 'floatL', reel: 'r2000', line: 'm20', hook: 8, float: 3, sinker: null, bait: 'larva' },
	{ rod: 'floatL', reel: 'r2500', line: 'm25', hook: 6, float: 6, sinker: null, bait: 'larva' },
	{ rod: 'spinML', reel: 'r3000', line: 'm30', hook: null, float: null, sinker: null, bait: 'spin2' },
	{ rod: 'bottomM', reel: 'r4000', line: 'm35', hook: 4, float: null, sinker: 20, bait: 'larva' },
	{ rod: 'bottomMH', reel: 'r4000', line: 'm40', hook: 2, float: null, sinker: 60, bait: 'larva' },
	{ rod: 'bottomMH', reel: 'r4000', line: 'm40', hook: 1, float: null, sinker: 60, bait: 'larva' },
];
export const gradeRig = ( grade ) => GRADE_RIGS[ Math.max( 0, Math.min( GRADE_RIGS.length - 1, grade | 0 ) ) ];

// a smaller hook than the fish's mouth: bites fine, comes out more in the fight (E2)
export const hookTooSmall = ( species, rig ) => !! ( PREFS[ species ] && ! isLure( rig.bait ) && rig.hook > PREFS[ species ].hook[ 1 ] );

// The price of a piece by its kind and id ($)
export function pieceCost( kind, id ) {

	const t = { rod: RODS, reel: REELS, line: LINES, hook: HOOKS, float: FLOATS, sinker: SINKERS, bait: BAITS, lure: LURES }[ kind ];
	return t && t[ id ] ? t[ id ].cost : null;

}
