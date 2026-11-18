import { loc } from '../i18n.js';
// Gear and upgrade data (docs/DISENO.md D37, D39, D43, D44). Everything the game reads goes through
// gearStats( state.upgrades ), so buying a level is just state.upgrades[ key ]++ and the stats follow.
//
// Phase 1 shop: the float rig by grade (it replaces the separate line, reel and rod; grade = map number, all six
// bought with money while the island is the starting map, D43), the hold and the boat. The float rig uses the base
// stats of its grade (×1.0) until the other techniques arrive in Phase 2.
//
// Each track: levels[ 0 ] is what you start with; cost is the price of that level (0 for the first).
// Saves store the level index of each track: only add levels at the end, never reorder (see GameState).

const RIG_LINE = [ 7, 10, 13, 18, 26, 36, 50 ]; // kg
const RIG_CAST = [ 22, 25, 29, 33, 38, 43, 48 ]; // m
const RIG_REEL = [ 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3 ]; // m/s
const RIG_COST = [ 0, 150, 200, 250, 300, 350, 450 ];

const HOLD_KG = [ 30, 45, 60, 80, 110, 140, 180 ];
const HOLD_COST = [ 0, 350, 450, 550, 700, 900, 1000 ];

export const UPGRADES = {
	rig: { name: loc( 'Float rig', 'Aparejo de flotador' ), levels: RIG_LINE.map( ( lineKg, i ) => ( {
		cost: RIG_COST[ i ], grade: i,
		label: loc( `Grade ${ i } · ${ lineKg } kg line · ${ RIG_CAST[ i ] } m cast · ${ RIG_REEL[ i ] } m/s reel`, `Grado ${ i } · sedal ${ lineKg } kg · lance ${ RIG_CAST[ i ] } m · recogida ${ RIG_REEL[ i ] } m/s` ),
		lineKg, castM: RIG_CAST[ i ], reelSpeed: RIG_REEL[ i ],
	} ) ) },
	hold: { name: loc( 'Fish hold', 'Bodega' ), levels: HOLD_KG.map( ( holdKg, i ) => ( {
		cost: HOLD_COST[ i ],
		label: i === 0 ? loc( 'Cooler · 30 kg', 'Nevera · 30 kg' ) : loc( `${ holdKg } kg hold`, `Bodega de ${ holdKg } kg` ),
		holdKg,
	} ) ) },
	fuel: { name: loc( 'Fuel tank', 'Tanque de combustible' ), levels: [
		{ cost: 0, label: loc( '40 L tank', 'Tanque de 40 L' ), fuelL: 40 },
		{ cost: 200, label: loc( '60 L tank', 'Tanque de 60 L' ), fuelL: 60 },
		{ cost: 250, label: loc( '80 L tank', 'Tanque de 80 L' ), fuelL: 80 },
		{ cost: 300, label: loc( '110 L tank', 'Tanque de 110 L' ), fuelL: 110 },
		{ cost: 350, label: loc( '150 L tank', 'Tanque de 150 L' ), fuelL: 150 },
	] },
	engine: { name: loc( 'Engine', 'Motor' ), levels: [
		{ cost: 0, label: loc( 'Tired diesel', 'Diésel cansado' ), speedMul: 1 },
		{ cost: 300, label: loc( 'Tuned diesel · ×1.1 speed', 'Diésel afinado · velocidad ×1.1' ), speedMul: 1.1 },
		{ cost: 450, label: loc( 'Rebuilt diesel · ×1.2 speed', 'Diésel reconstruido · velocidad ×1.2' ), speedMul: 1.2 },
		{ cost: 550, label: loc( 'Turbo diesel · ×1.3 speed', 'Turbodiésel · velocidad ×1.3' ), speedMul: 1.3 },
	] },
	fishFinder: { name: loc( 'Fish finder', 'Sonda de pesca' ), levels: [
		{ cost: 0, label: loc( 'None', 'Ninguna' ), finder: false },
		{ cost: 250, label: loc( 'Fish finder (depth and fish on the HUD)', 'Sonda de pesca (profundidad y peces en pantalla)' ), finder: true },
	] },
	lights: { name: loc( 'Boat lights', 'Luces del bote' ), levels: [
		{ cost: 0, label: loc( 'Nav lights only', 'Solo luces de navegación' ), deckLights: false },
		{ cost: 250, label: loc( 'Deck floodlights for night fishing', 'Focos de cubierta para pescar de noche' ), deckLights: true },
	] },
};

// The original game's tracks (save version 2 and older). Used to convert old saves (convertLegacyUpgrades) and by
// the audit sections of tools/balance, which describe the game as it was.
export const LEGACY_UPGRADES = {
	line: { name: loc( 'Fishing line', 'Sedal' ), levels: [
		{ cost: 0, label: loc( '8 lb mono', 'Monofilamento de 8 lb' ), lineKg: 7 },
		{ cost: 60, label: loc( '15 lb mono', 'Monofilamento de 15 lb' ), lineKg: 13 },
		{ cost: 180, label: loc( '30 lb braid', 'Trenzado de 30 lb' ), lineKg: 26 },
		{ cost: 450, label: loc( '60 lb braid', 'Trenzado de 60 lb' ), lineKg: 50 },
	] },
	reel: { name: loc( 'Reel', 'Carrete' ), levels: [
		{ cost: 0, label: loc( 'Old spinning reel', 'Carrete de spinning viejo' ), reelSpeed: 1.1 },
		{ cost: 90, label: loc( 'Smooth spinning reel', 'Carrete de spinning suave' ), reelSpeed: 1.6 },
		{ cost: 320, label: loc( 'Conventional reel', 'Carrete convencional' ), reelSpeed: 2.2 },
	] },
	rod: { name: loc( 'Rod', 'Caña' ), levels: [
		{ cost: 0, label: loc( 'Hand-me-down rod', 'Caña heredada' ), castM: 22 },
		{ cost: 75, label: loc( '7 ft graphite rod', 'Caña de grafito de 7 pies' ), castM: 32 },
		{ cost: 260, label: loc( '9 ft surf rod', 'Caña de surfcasting de 9 pies' ), castM: 45 },
	] },
	hold: { name: loc( 'Fish hold', 'Bodega' ), levels: [
		{ cost: 0, label: loc( 'Cooler', 'Nevera' ), holdKg: 30 },
		{ cost: 120, label: loc( 'Ice chest', 'Cajón de hielo' ), holdKg: 70 },
		{ cost: 400, label: loc( 'Insulated fish hold', 'Bodega aislada' ), holdKg: 160 },
	] },
	fuel: { name: loc( 'Fuel tank', 'Tanque de combustible' ), levels: [
		{ cost: 0, label: loc( '40 L tank', 'Tanque de 40 L' ), fuelL: 40 },
		{ cost: 150, label: loc( '80 L tank', 'Tanque de 80 L' ), fuelL: 80 },
		{ cost: 380, label: loc( '150 L tank', 'Tanque de 150 L' ), fuelL: 150 },
	] },
	engine: { name: loc( 'Engine', 'Motor' ), levels: [
		{ cost: 0, label: loc( 'Tired diesel', 'Diésel cansado' ), speedMul: 1 },
		{ cost: 300, label: loc( 'Rebuilt diesel', 'Diésel reconstruido' ), speedMul: 1.15 },
		{ cost: 700, label: loc( 'Turbo diesel', 'Turbodiésel' ), speedMul: 1.3 },
	] },
	fishFinder: { name: loc( 'Fish finder', 'Sonda de pesca' ), levels: [
		{ cost: 0, label: loc( 'None', 'Ninguna' ), finder: false },
		{ cost: 250, label: loc( 'Fish finder', 'Sonda de pesca' ), finder: true },
	] },
	lights: { name: loc( 'Boat lights', 'Luces del bote' ), levels: [
		{ cost: 0, label: loc( 'Nav lights only', 'Solo luces de navegación' ), deckLights: false },
		{ cost: 140, label: loc( 'Deck floodlights', 'Focos de cubierta' ), deckLights: true },
	] },
};

const clampLevel = ( track, i ) => Math.max( 0, Math.min( track.levels.length - 1, i | 0 ) );
const spentOn = ( track, i ) => track.levels.slice( 1, clampLevel( track, i ) + 1 ).reduce( ( s, l ) => s + l.cost, 0 );

// Old upgrades -> the Phase 1 shop (D44, nobody loses anything). Line, reel and rod: what was spent on them buys the
// highest float rig grade it reaches, and the rest comes back as money. Hold, tank and engine: the first grade at
// least as big / fast as before. Fish finder and lights carry over. Returns { upgrades, refund, rigFrom }.
export function convertLegacyUpgrades( old = {} ) {

	const L = LEGACY_UPGRADES, U = UPGRADES;
	const spent = spentOn( L.line, old.line ) + spentOn( L.reel, old.reel ) + spentOn( L.rod, old.rod );
	let rig = 0;
	while ( rig + 1 < U.rig.levels.length && spentOn( U.rig, rig + 1 ) <= spent ) rig ++;
	const atLeast = ( track, key, value ) => {

		const i = track.levels.findIndex( ( l ) => l[ key ] >= value - 1e-9 );
		return i < 0 ? track.levels.length - 1 : i;

	};

	const upgrades = defaultUpgrades();
	upgrades.rig = rig;
	upgrades.hold = atLeast( U.hold, 'holdKg', L.hold.levels[ clampLevel( L.hold, old.hold ) ].holdKg );
	upgrades.fuel = atLeast( U.fuel, 'fuelL', L.fuel.levels[ clampLevel( L.fuel, old.fuel ) ].fuelL );
	upgrades.engine = atLeast( U.engine, 'speedMul', L.engine.levels[ clampLevel( L.engine, old.engine ) ].speedMul );
	upgrades.fishFinder = clampLevel( U.fishFinder, old.fishFinder );
	upgrades.lights = clampLevel( U.lights, old.lights );
	return { upgrades, refund: spent - spentOn( U.rig, rig ), spent };

}

export const FUEL_PRICE = 1.5; // $ per litre of diesel at the chandlery
// litres per second at the helm: idle plus a lot more at full rpm (40 L lasts ~25 min flat out)
export function fuelBurn( rpm ) {

	return 0.0025 + 0.024 * rpm * rpm;

}

// next level of a track, or null when maxed
export function nextLevel( upgrades, key ) {

	const lv = UPGRADES[ key ].levels;
	const i = ( upgrades[ key ] | 0 ) + 1;
	return i < lv.length ? { index: i, ...lv[ i ] } : null;

}

export function defaultUpgrades() {

	const u = {};
	for ( const k in UPGRADES ) u[ k ] = 0;
	return u;

}

// merged stats of the current levels
const NOT_STATS = new Set( [ 'cost', 'label', 'grade' ] );
export function gearStats( upgrades ) {

	const s = {};
	for ( const k in UPGRADES ) {

		const lv = UPGRADES[ k ].levels;
		const i = Math.max( 0, Math.min( lv.length - 1, upgrades[ k ] | 0 ) );
		for ( const [ key, v ] of Object.entries( lv[ i ] ) ) if ( ! NOT_STATS.has( key ) ) s[ key ] = v;

	}

	return s;

}
