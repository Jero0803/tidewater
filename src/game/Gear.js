// Gear and upgrade data. The upgrade shop (a vendor by the boathouse) is not built yet; everything
// the game reads goes through gearStats( state.upgrades ), so buying a level is just
// state.upgrades[ key ]++ and the stats follow.
//
// Each track: levels[ 0 ] is what you start with; cost is the price of that level (0 for the first).
export const UPGRADES = {
	// rod and reel
	line: { name: 'Sedal', levels: [
		{ cost: 0, label: 'Monofilamento de 8 lb', lineKg: 7 },
		{ cost: 60, label: 'Monofilamento de 15 lb', lineKg: 13 },
		{ cost: 180, label: 'Trenzado de 30 lb', lineKg: 26 },
		{ cost: 450, label: 'Trenzado de 60 lb', lineKg: 50 },
	] },
	reel: { name: 'Carrete', levels: [
		{ cost: 0, label: 'Carrete de spinning viejo', reelSpeed: 1.1 },
		{ cost: 90, label: 'Carrete de spinning suave', reelSpeed: 1.6 },
		{ cost: 320, label: 'Carrete convencional', reelSpeed: 2.2 },
	] },
	rod: { name: 'Caña', levels: [
		{ cost: 0, label: 'Caña heredada', castM: 22 },
		{ cost: 75, label: 'Caña de grafito de 7 pies', castM: 32 },
		{ cost: 260, label: 'Caña de surfcasting de 9 pies', castM: 45 },
	] },
	// boat
	hold: { name: 'Bodega', levels: [
		{ cost: 0, label: 'Nevera', holdKg: 30 },
		{ cost: 120, label: 'Cajón de hielo', holdKg: 70 },
		{ cost: 400, label: 'Bodega aislada', holdKg: 160 },
	] },
	fuel: { name: 'Tanque de combustible', levels: [
		{ cost: 0, label: 'Tanque de 40 L', fuelL: 40 },
		{ cost: 150, label: 'Tanque de 80 L', fuelL: 80 },
		{ cost: 380, label: 'Tanque de 150 L', fuelL: 150 },
	] },
	engine: { name: 'Motor', levels: [
		{ cost: 0, label: 'Diésel cansado', speedMul: 1 },
		{ cost: 300, label: 'Diésel reconstruido', speedMul: 1.15 },
		{ cost: 700, label: 'Turbodiésel', speedMul: 1.3 },
	] },
	fishFinder: { name: 'Sonda de pesca', levels: [
		{ cost: 0, label: 'Ninguna', finder: false },
		{ cost: 250, label: 'Sonda de pesca (profundidad y peces en pantalla)', finder: true },
	] },
	lights: { name: 'Luces del bote', levels: [
		{ cost: 0, label: 'Solo luces de navegación', deckLights: false },
		{ cost: 140, label: 'Focos de cubierta para pescar de noche', deckLights: true },
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
