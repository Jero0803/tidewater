import { loc } from '../i18n.js';
// Gear and upgrade data. The upgrade shop (a vendor by the boathouse) is not built yet; everything
// the game reads goes through gearStats( state.upgrades ), so buying a level is just
// state.upgrades[ key ]++ and the stats follow.
//
// Each track: levels[ 0 ] is what you start with; cost is the price of that level (0 for the first).
export const UPGRADES = {
	// rod and reel
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
	// boat
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
		{ cost: 250, label: loc( 'Fish finder (depth and fish on the HUD)', 'Sonda de pesca (profundidad y peces en pantalla)' ), finder: true },
	] },
	lights: { name: loc( 'Boat lights', 'Luces del bote' ), levels: [
		{ cost: 0, label: loc( 'Nav lights only', 'Solo luces de navegación' ), deckLights: false },
		{ cost: 140, label: loc( 'Deck floodlights for night fishing', 'Focos de cubierta para pescar de noche' ), deckLights: true },
	] },
};

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
export function gearStats( upgrades ) {

	const s = {};
	for ( const k in UPGRADES ) {

		const lv = UPGRADES[ k ].levels;
		const i = Math.max( 0, Math.min( lv.length - 1, upgrades[ k ] | 0 ) );
		for ( const [ key, v ] of Object.entries( lv[ i ] ) ) if ( key !== 'cost' && key !== 'label' ) s[ key ] = v;

	}

	return s;

}
