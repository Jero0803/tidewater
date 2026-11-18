// Catálogo de equipo por piezas del lago (docs/DISENO.md 7h, D63–D72; propuesta, todavía no implementada). Uso:
//   node --no-warnings tools/balance/equipo-lago.mjs
//
// Mide, con la pelea real de CatchMinigame y el modelo nuevo encima:
//   1. picada: recelo ante el sedal grueso × cebo preferido / aceptable / otro × anzuelo dentro o fuera de su rango
//   2. pelea: fuerza realista del pez (sedales de 1.5 a 12 kg), freno máximo del carrete, caña que amortigua o
//      desgarra el anzuelo según su potencia, caña que se rompe por encima de su límite
//   3. precios: lo que cuesta armar cada caña y el camino normal del lago contra el presupuesto de la banda (D37)

globalThis.location = { search: '?lang=es' };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { FISH } = await import( '../../src/game/FishTable.js' );
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );

let seed = 11;
const rng = () => ( ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647 );

// ---------------------------------------------------------------- catálogo
// Potencia: rango de sedal (kg), rango de cebo (g), rigidez (0 blanda .. 1 rígida: cuánto del tirón llega al anzuelo)
export const POWERS = {
	UL: { name: 'ultraligera', line: [ 1, 3 ], lure: [ 1, 5 ], stiff: 0.2 },
	L: { name: 'ligera', line: [ 2, 5 ], lure: [ 3, 12 ], stiff: 0.35 },
	ML: { name: 'media-ligera', line: [ 3, 7 ], lure: [ 5, 20 ], stiff: 0.5 },
	M: { name: 'media', line: [ 5, 10 ], lure: [ 10, 40 ], stiff: 0.65 },
	MH: { name: 'media-pesada', line: [ 7, 14 ], lure: [ 20, 80 ], stiff: 0.8 },
};

export const RODS = {
	floatUL: { name: 'Telescópica de flotador 3 m', tech: 'flotador', power: 'UL', castM: 18, cost: 0, level: 1 },
	floatL: { name: 'Telescópica de flotador 4 m', tech: 'flotador', power: 'L', castM: 22, cost: 60, level: 2 },
	spinUL: { name: 'Spinning 1.8 m', tech: 'spinning', power: 'UL', castM: 24, cost: 70, level: 2 },
	spinL: { name: 'Spinning 2.1 m', tech: 'spinning', power: 'L', castM: 30, cost: 120, level: 3 },
	spinML: { name: 'Spinning 2.4 m', tech: 'spinning', power: 'ML', castM: 34, cost: 150, level: 5 },
	bottomM: { name: 'Fondo 3 m', tech: 'fondo', power: 'M', castM: 40, cost: 130, level: 4 },
	bottomMH: { name: 'Fondo 3.6 m', tech: 'fondo', power: 'MH', castM: 45, cost: 220, level: 7 },
};

// recogida (m/s), freno máximo (kg), capacidad (m de sedal de 0.25 mm; con otro grosor escala con el área)
export const REELS = {
	r1000: { name: 'Carrete 1000', reel: 0.9, dragMax: 3, cap25: 120, cost: 0, level: 1 },
	r2000: { name: 'Carrete 2000', reel: 1.0, dragMax: 4, cap25: 150, cost: 50, level: 2 },
	r2500: { name: 'Carrete 2500', reel: 1.1, dragMax: 6, cap25: 180, cost: 90, level: 3 },
	r3000: { name: 'Carrete 3000', reel: 1.2, dragMax: 8, cap25: 200, cost: 110, level: 5 },
	r4000: { name: 'Carrete de fondo 4000', reel: 1.3, dragMax: 12, cap25: 250, cost: 150, level: 6 },
};

// bobinas de 150 m; vis = grosor aparente (el fluorocarbono se ve como uno más fino)
export const LINES = {
	m12: { name: 'Monofilamento 0.12 mm', kg: 1.5, d: 0.12, vis: 1, cost: 8, level: 1 },
	m16: { name: 'Monofilamento 0.16 mm', kg: 2.5, d: 0.16, vis: 1, cost: 0, level: 1 },
	m20: { name: 'Monofilamento 0.20 mm', kg: 3.5, d: 0.20, vis: 1, cost: 12, level: 2 },
	m25: { name: 'Monofilamento 0.25 mm', kg: 5, d: 0.25, vis: 1, cost: 15, level: 3 },
	m30: { name: 'Monofilamento 0.30 mm', kg: 7, d: 0.30, vis: 1, cost: 18, level: 4 },
	m35: { name: 'Monofilamento 0.35 mm', kg: 9, d: 0.35, vis: 1, cost: 22, level: 5 },
	m40: { name: 'Monofilamento 0.40 mm', kg: 12, d: 0.40, vis: 1, cost: 26, level: 6 },
	f18: { name: 'Fluorocarbono 0.18 mm', kg: 3, d: 0.18, vis: 0.65, cost: 30, level: 4 },
	f22: { name: 'Fluorocarbono 0.22 mm', kg: 4.5, d: 0.22, vis: 0.65, cost: 36, level: 5 },
};

// sobres de 10 anzuelos; número de anzuelo: más alto = más pequeño (#14 diminuto, #1 grande)
export const HOOKS = { 14: 3, 12: 3, 10: 3, 8: 4, 6: 4, 4: 5, 2: 5, 1: 6 };
// boyas (g) y plomos (g), sobres de 5
export const FLOATS = { 1: 2, 3: 3, 6: 4 };
export const SINKERS = { 20: 2, 40: 3, 60: 4 };

// carnadas: paquete (unidades, $); se gasta una por picada (pez sacado o perdido)
export const BAITS = {
	larva: { name: 'Larvas', n: 30, cost: 4, level: 1, g: 1 },
	worm: { name: 'Lombrices', n: 20, cost: 5, level: 1, g: 2 },
	corn: { name: 'Maíz', n: 40, cost: 3, level: 2, g: 1 },
	bread: { name: 'Masa de pan', n: 25, cost: 3, level: 1, g: 1 },
	pellet: { name: 'Pellet de trucha', n: 30, cost: 6, level: 3, g: 1 },
};
// señuelos: por unidad; se pierden si se corta el sedal o se enredan
export const LURES = {
	spin1: { name: 'Cucharilla giratoria #1 (3 g)', g: 3, cost: 8, level: 2 },
	spin2: { name: 'Cucharilla giratoria #2 (6 g)', g: 6, cost: 10, level: 3 },
	spoon: { name: 'Cucharilla ondulante (8 g)', g: 8, cost: 10, level: 4 },
	minnow: { name: 'Pececito 5 cm (6 g)', g: 6, cost: 14, level: 5 },
	soft: { name: 'Plástico blando 7 cm + cabeza 5 g', g: 5, cost: 6, level: 4 },
};

// preferencias por especie: preferidos (×1), aceptables (×0.4), el resto ×0.05; anzuelo [grande, pequeño];
// sedal ideal (mm), recelo (0..1), boca (cuánto aguanta el anzuelo antes de desgarrarse), fuerza (sedal realista)
export const PREFS = {
	guapucha: { best: [ 'larva', 'bread' ], ok: [ 'worm' ], hook: [ 10, 14 ], lineD: 0.12, wary: 0.2, mouth: 1.2 },
	carachi: { best: [ 'larva', 'worm' ], ok: [ 'bread' ], hook: [ 8, 12 ], lineD: 0.14, wary: 0.3, mouth: 1.4 },
	pejerrey: { best: [ 'larva', 'spin1' ], ok: [ 'worm', 'spin2' ], hook: [ 6, 10 ], lineD: 0.16, wary: 0.5, mouth: 1.3 },
	capitan: { best: [ 'worm' ], ok: [ 'larva' ], hook: [ 4, 8 ], lineD: 0.25, wary: 0.3, mouth: 2.2 },
	rainbowTrout: { best: [ 'spin2', 'spin1', 'pellet' ], ok: [ 'worm', 'spoon', 'corn' ], hook: [ 4, 8 ], lineD: 0.20, wary: 0.8, mouth: 1.5 },
	carp: { best: [ 'corn', 'bread' ], ok: [ 'worm', 'pellet' ], hook: [ 1, 6 ], lineD: 0.30, wary: 0.4, mouth: 2.4 },
	brownTrout: { best: [ 'minnow', 'spoon' ], ok: [ 'worm', 'soft', 'spin2' ], hook: [ 2, 6 ], lineD: 0.22, wary: 0.85, mouth: 1.6 },
};

// ---------------------------------------------------------------- modelo
// fuerza del pez con sedales realistas (la de P1 está pensada para sedales de 7 a 50 kg)
export const fishForce = ( id, kg ) => Math.max( 0.05, kg * ( 0.25 + 0.6 * FISH[ id ].fight ) + 0.05 );

// aguante del pez (segundos de presión plena para cansarlo): P1 daba 3.5 × aguante × tamaño^0.35 y la pelea duraba
// 11–25 s con el equipo correcto; la meta es que sacar un pez lleve al menos 1 minuto (D73)
const arg = ( k, d ) => Number( ( process.argv.find( ( a ) => a.startsWith( `--${ k }=` ) ) || '' ).split( '=' )[ 1 ] ) || d;
export const STAMINA = { min: arg( 'smin', 180 ), k: arg( 'sk', 4 ), size: 0.35 };
export const staminaOf = ( id, kg ) => {

	const f = FISH[ id ];
	return STAMINA.min + STAMINA.k * f.stamina * Math.pow( Math.max( kg / f.kg[ 1 ], 0.05 ), STAMINA.size );

};

export function biteMul( id, kit ) {

	const p = PREFS[ id ], line = LINES[ kit.line ];
	const d = line.d * line.vis;
	const lineMul = d <= p.lineD ? 1 : Math.max( 0.25, 1 - p.wary * ( d / p.lineD - 1 ) * 1.5 );
	const baitMul = p.best.includes( kit.bait ) ? 1 : p.ok.includes( kit.bait ) ? 0.4 : 0.05;
	const [ big, small ] = p.hook, h = kit.hook;
	// más grande que su rango: pica menos y la mitad se escapa al clavar; más pequeño: pica normal
	const hookMul = h < big ? 0.4 * 0.5 : 1;
	return { lineMul, baitMul, hookMul, total: lineMul * baitMul * hookMul };

}

export function fightKit( id, kg, kit, player ) {

	const rod = RODS[ kit.rod ], pw = POWERS[ rod.power ], reel = REELS[ kit.reel ], line = LINES[ kit.line ];
	const lineCap = reel.cap25 * ( 0.25 / line.d ) ** 2;
	const g = new CatchMinigame( { species: id, kg, lineKg: line.kg, reelSpeed: reel.reel, distance: 18, lineCap, rng } );
	g.force = fishForce( id, kg );
	g.staminaMax = staminaOf( id, kg );
	const baseSetDrag = g.setDrag.bind( g );
	g.setDrag = ( n ) => { baseSetDrag( n ); g.dragKg = Math.min( g.dragKg, reel.dragMax ); };
	g.setDrag( g.drag );
	const p = PREFS[ id ];
	const hold = p.mouth * Math.pow( kg, 0.6 ) + 0.15; // kg que aguanta el anzuelo clavado
	const rodMax = pw.line[ 1 ] * 1.25;
	const small = kit.hook > p.hook[ 1 ]; // anzuelo más pequeño que su rango: se suelta más
	let st = 'fighting', tearT = 0, rodT = 0, cause = null;
	for ( let i = 0; i < 60 * 240 && st === 'fighting'; i ++ ) {

		const input = player( g );
		st = g.update( 1 / 60, input );
		if ( st !== 'fighting' ) { cause = g.cause; break; }
		// lo que llega al anzuelo: la caña blanda se dobla y se come parte del tirón; levantada, menos
		// (modelo de E2: el anzuelo no ve la carga fija de recoger de P1, que crece con el sedal, sino el tirón del
		// pez, la resistencia del agua al arrastrarlo y lo que agrega levantar la caña, que crece con su potencia)
		const water = input.reel ? 0.25 * Math.pow( kg, 0.7 ) * ( input.fast ? 1.6 : 1 ) : 0;
		// levantar la caña solo carga el anzuelo en la medida en que el pez se resiste (un pez diminuto sube sin más)
		const lift = input.pull ? Math.min( 0.3 * pw.line[ 0 ], g.pull() ) : 0;
		const onHook = Math.min( g.tensionKg, g.pull() + water + lift );
		const hookLoad = onHook * ( 0.55 + 0.9 * pw.stiff ) * ( g.mode === 'jump' ? 1.5 : 1 );
		tearT = hookLoad > hold * ( small ? 0.7 : 1 ) ? tearT + 1 / 60 : Math.max( 0, tearT - 1 / 30 );
		if ( tearT > 0.2 ) { st = 'escaped'; cause = 'tear'; break; }
		rodT = g.tensionKg > rodMax ? rodT + 1 / 60 : 0;
		if ( rodT > 0.15 ) { st = 'snapped'; cause = 'rod'; break; }

	}

	return { st, cause, t: g.time };

}

// jugadores: "bueno" (el de fight.mjs) y "suave" (freno bajo, nunca levanta la caña: lo que haría alguien con
// equipo pesado que sabe que el pez es chico)
const PLAYERS = {
	bueno: ( g ) => {

		if ( g.tension > 0.8 && g.drag > 2 ) g.setDrag( g.drag - 1 );
		else if ( g.tension < 0.3 && ! g.slipping && g.drag < 7 ) g.setDrag( g.drag + 1 );
		return { reel: ! g.slipping || g.mode === 'come', fast: g.mode === 'come', pull: g.mode === 'dive' || g.mode === 'hold', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	},
	suave: ( g ) => {

		if ( g.drag !== 3 ) g.setDrag( 3 );
		return { reel: ! g.slipping || g.mode === 'come', fast: false, pull: g.mode === 'dive', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	},
};

// ---------------------------------------------------------------- equipos armados
const KITS = {
	'Flotador UL (inicial)': { rod: 'floatUL', reel: 'r1000', line: 'm16', hook: 12, bait: 'larva' },
	'Flotador L lombriz': { rod: 'floatL', reel: 'r2000', line: 'm20', hook: 6, bait: 'worm' },
	'Spinning L trucha': { rod: 'spinL', reel: 'r2500', line: 'f18', hook: 6, bait: 'spin2' },
	'Spinning ML trucha café': { rod: 'spinML', reel: 'r3000', line: 'f22', hook: 4, bait: 'minnow' },
	'Fondo M carpa': { rod: 'bottomM', reel: 'r4000', line: 'm30', hook: 4, bait: 'corn' },
	'Fondo MH carpa grande': { rod: 'bottomMH', reel: 'r4000', line: 'm40', hook: 2, bait: 'corn' },
	'Fondo MH con cucharilla': { rod: 'bottomMH', reel: 'r4000', line: 'm40', hook: 4, bait: 'spin2' },
};

const CASES = [
	[ 'guapucha', 0.015 ], [ 'pejerrey', 0.8 ], [ 'capitan', 0.6 ],
	[ 'rainbowTrout', 1.5 ], [ 'rainbowTrout', 3.5 ], [ 'brownTrout', 4 ], [ 'carp', 3 ], [ 'carp', 10 ],
];

const N = 60;
const pct = ( x ) => `${ Math.round( x * 100 ) } %`;
const NAMES = { guapucha: 'Guapucha', carachi: 'Carachi', pejerrey: 'Pejerrey', capitan: 'Capitán', rainbowTrout: 'Trucha arcoíris', carp: 'Carpa', brownTrout: 'Trucha café' };
const CAUSES = { null: 'tiempo', line: 'sedal', spooled: 'sin hilo', snag: 'enredo', slack: 'flojo', jump: 'salto', tear: 'desgarre', rod: 'caña rota' };

console.log( '\n## 1. Picada: multiplicador de cada equipo con cada especie (sedal × cebo × anzuelo)\n' );
console.log( '| Equipo | ' + Object.keys( PREFS ).map( ( k ) => NAMES[ k ] ).join( ' | ' ) + ' |' );
console.log( '|---' + '|---'.repeat( Object.keys( PREFS ).length ) + '|' );
for ( const [ name, kit ] of Object.entries( KITS ) ) console.log( `| ${ name } | ` + Object.keys( PREFS ).map( ( id ) => biteMul( id, kit ).total.toFixed( 2 ) ).join( ' | ' ) + ' |' );

console.log( '\n## 2. Pelea: % sacados, tiempo medio y causas de pérdida (jugador bueno / suave)\n' );
console.log( '| Pez | kg | ' + Object.keys( KITS ).join( ' | ' ) + ' |' );
console.log( '|---|---' + '|---'.repeat( Object.keys( KITS ).length ) + '|' );
for ( const [ id, kg ] of CASES ) {

	const cells = Object.values( KITS ).map( ( kit ) => Object.keys( PLAYERS ).map( ( pl ) => {

		let ok = 0, t = 0; const c = {};
		for ( let n = 0; n < N; n ++ ) {

			const r = fightKit( id, kg, kit, PLAYERS[ pl ] );
			if ( r.st === 'caught' ) { ok ++; t += r.t; } else c[ r.cause ] = ( c[ r.cause ] || 0 ) + 1;

		}

		const top = Object.entries( c ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] )[ 0 ];
		return `${ pct( ok / N ) }${ ok ? ' ' + Math.round( t / ok ) + ' s' : '' }${ top ? ' (' + CAUSES[ top[ 0 ] ] + ')' : '' }`;

	} ).join( ' / ' ) );
	console.log( `| ${ NAMES[ id ] } | ${ kg } | ${ cells.join( ' | ' ) } |` );

}

console.log( '\n## 3. Precios\n' );
const kitCost = ( k ) => RODS[ k.rod ].cost + REELS[ k.reel ].cost + LINES[ k.line ].cost + HOOKS[ k.hook ] + ( BAITS[ k.bait ]?.cost ?? LURES[ k.bait ].cost * 2 );
console.log( '| Equipo | Costo de armarlo | Nivel |' );
console.log( '|---|---|---|' );
for ( const [ name, kit ] of Object.entries( KITS ) ) {

	const lv = Math.max( RODS[ kit.rod ].level, REELS[ kit.reel ].level, LINES[ kit.line ].level, BAITS[ kit.bait ]?.level ?? LURES[ kit.bait ].level );
	console.log( `| ${ name } | $${ kitCost( kit ) } | ${ lv } |` );

}

const camino = [ 'Spinning L trucha', 'Fondo M carpa', 'Spinning ML trucha café' ];
const caminoCost = camino.reduce( ( s, k ) => s + kitCost( KITS[ k ] ), 0 );
const sum = ( o ) => Object.values( o ).reduce( ( s, x ) => s + x.cost, 0 );
const todo = sum( RODS ) + sum( REELS ) + sum( LINES );
const BAND = 3000, HOLD = 350;
console.log( `\nCamino normal (${ camino.join( ', ' ) }): $${ caminoCost } + bodega $${ HOLD } = $${ caminoCost + HOLD } (${ pct( ( caminoCost + HOLD ) / BAND ) } de la banda de $${ BAND }; D37 daba $900, 30 %).` );
console.log( `Todas las cañas, carretes y sedales: $${ todo } + bodega = $${ todo + HOLD } (${ pct( ( todo + HOLD ) / BAND ) }).` );
// cebo por hora: ~25 picadas por hora, una carnada por picada
const perBite = ( b ) => BAITS[ b ].cost / BAITS[ b ].n;
console.log( `Carnada por hora (~25 picadas): larvas $${ ( 25 * perBite( 'larva' ) ).toFixed( 2 ) }, maíz $${ ( 25 * perBite( 'corn' ) ).toFixed( 2 ) }, pellet $${ ( 25 * perBite( 'pellet' ) ).toFixed( 2 ) }.` );

console.log( '\n## 4. Duración de la pelea con el equipo correcto (jugador bueno / suave; mínimo, típico y máximo de cada especie)\n' );
const RIGHT = { guapucha: 'Flotador UL (inicial)', carachi: 'Flotador UL (inicial)', pejerrey: 'Flotador UL (inicial)', capitan: 'Flotador L lombriz', rainbowTrout: 'Spinning L trucha', brownTrout: 'Spinning ML trucha café', carp: 'Fondo M carpa' };
console.log( `Aguante: ${ STAMINA.min } s + ${ STAMINA.k } × aguante de la especie × tamaño^${ STAMINA.size }\n` );
console.log( '| Pez | Equipo | Pequeño | Típico | Grande |' );
console.log( '|---|---|---|---|---|' );
for ( const [ id, kit ] of Object.entries( RIGHT ) ) {

	const [ a, b ] = FISH[ id ].kg;
	const sizes = [ a, a + ( b - a ) * 0.22, b ];
	const cells = sizes.map( ( kg ) => Object.keys( PLAYERS ).map( ( pl ) => {

		let ok = 0, t = 0;
		for ( let n = 0; n < N; n ++ ) { const r = fightKit( id, kg, KITS[ kit ], PLAYERS[ pl ] ); if ( r.st === 'caught' ) { ok ++; t += r.t; } }
		return `${ pct( ok / N ) } ${ ok ? Math.round( t / ok ) + ' s' : '' }`;

	} ).join( ' / ' ) + ` (${ +sizes[ 0 ].toFixed( 3 ) === +kg.toFixed( 3 ) ? '' : '' }${ +kg.toPrecision( 2 ) } kg)` );
	console.log( `| ${ NAMES[ id ] } | ${ kit } | ${ cells.join( ' | ' ) } |` );

}

// ---------------------------------------------------------------- 5. ritmo: no toda picada engancha (D74)
// Antes (P1): cada picada terminaba en pez si se clavaba con la boya hundida; ~7 s de espera en un buen spot.
// Ahora: espera más larga (y dividida por la picada del equipo), robo de carnada en los toques, clavar antes de
// tiempo espanta, clavar a tiempo engancha con una probabilidad.
const { biteDelay, rollWeight } = await import( '../../src/game/Bites.js' );
const { fishValue } = await import( '../../src/game/FishTable.js' );
export const RHYTHM = { waitMul: arg( 'wait', 3.5 ), steal: 0.15, early: 0.1, spook: 0.6, hookFirst: 0.75, hookLate: 0.55, lateShare: 0.3, rebait: 2 };
const CAST = 3, NIBBLES = 2.5, CARD = 4;
const goodSpot = { a: 1 };
const fightOld = ( id, kg ) => {

	const g = new CatchMinigame( { species: id, kg, lineKg: 7, reelSpeed: 1.1, distance: 18, rng } );
	let st = 'fighting';
	for ( let i = 0; i < 60 * 240 && st === 'fighting'; i ++ ) st = g.update( 1 / 60, PLAYERS.bueno( g ) );
	return { ok: st === 'caught', t: g.time };

};

console.log( '\n## 5. Ritmo: peces por hora antes (P1, todo engancha) y ahora (espera ×' + RHYTHM.waitMul + ', robo ' + pct( RHYTHM.steal ) + ', enganche ' + pct( RHYTHM.hookFirst ) + ' / ' + pct( RHYTHM.hookLate ) + ')\n' );
console.log( '| Pez (con su equipo) | Antes: peces/h | Antes: $/h | Ahora: peces/h | Ahora: $/h | Picadas que enganchan | Espera media | Factor para conservar $/h |' );
console.log( '|---|---|---|---|---|---|---|---|' );
const H = 3600 * 4; // horas simuladas por especie
for ( const id of [ 'pejerrey', 'rainbowTrout', 'carp', 'brownTrout' ] ) {

	const kit = KITS[ { pejerrey: 'Flotador UL (inicial)', rainbowTrout: 'Spinning L trucha', carp: 'Fondo M carpa', brownTrout: 'Spinning ML trucha café' }[ id ] ];
	let t = 0, n0 = 0, v0 = 0;
	while ( t < H ) {

		t += CAST + biteDelay( goodSpot, 12, rng ) + NIBBLES;
		const kg = rollWeight( id, rng ), r = fightOld( id, kg );
		t += r.t;
		if ( r.ok ) { n0 ++; v0 += fishValue( id, kg ); t += CARD; }

	}

	let t1 = 0, n1 = 0, v1 = 0, bites = 0, hooked = 0, waited = 0;
	const mul = biteMul( id, kit ).total;
	while ( t1 < H ) {

		const w = biteDelay( goodSpot, 12, rng ) * RHYTHM.waitMul / mul;
		waited += w;
		t1 += CAST + w + NIBBLES;
		bites ++;
		if ( rng() < RHYTHM.steal ) { t1 += RHYTHM.rebait; continue; } // se llevó la carnada en los toques
		if ( rng() < RHYTHM.early && rng() < RHYTHM.spook ) { t1 += RHYTHM.rebait; continue; } // clavó antes y lo espantó
		const pHook = rng() < RHYTHM.lateShare ? RHYTHM.hookLate : RHYTHM.hookFirst;
		if ( rng() >= pHook ) { t1 += RHYTHM.rebait; continue; } // falló al clavar
		hooked ++;
		const kg = rollWeight( id, rng ), r = fightKit( id, kg, kit, PLAYERS.bueno );
		t1 += r.t;
		if ( r.st === 'caught' ) { n1 ++; v1 += fishValue( id, kg ); t1 += CARD; }

	}

	const f0 = n0 / ( t / 3600 ), f1 = n1 / ( t1 / 3600 ), m0 = v0 / ( t / 3600 ), m1 = v1 / ( t1 / 3600 );
	console.log( `| ${ NAMES[ id ] } | ${ f0.toFixed( 0 ) } | $${ m0.toFixed( 0 ) } | ${ f1.toFixed( 0 ) } | $${ m1.toFixed( 0 ) } | ${ pct( hooked / bites ) } | ${ Math.round( waited / bites ) } s | ×${ ( m0 / m1 ).toFixed( 1 ) } |` );

}
