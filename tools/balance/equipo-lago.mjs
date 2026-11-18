// Catálogo de equipo por piezas del lago (docs/DISENO.md 7h, D63–D76; el catálogo vive en src/game/Tackle.js). Uso:
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

// ---------------------------------------------------------------- catálogo (src/game/Tackle.js, E1)
const { POWERS, RODS, REELS, LINES, HOOKS, BAITS, LURES, PREFS, biteMul } = await import( '../../src/game/Tackle.js' );
const kitHookCost = ( h ) => HOOKS[ h ].cost;

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
const kitCost = ( k ) => RODS[ k.rod ].cost + REELS[ k.reel ].cost + LINES[ k.line ].cost + kitHookCost( k.hook ) + ( BAITS[ k.bait ]?.cost ?? LURES[ k.bait ].cost * 2 );
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
const { biteDelay, rollWeight, HOOKING } = await import( '../../src/game/Bites.js' );
const { fishValue } = await import( '../../src/game/FishTable.js' );
export const RHYTHM = { ...HOOKING, waitMul: arg( 'wait', HOOKING.waitMul ), early: 0.1, lateShare: 0.3, rebait: 2 };
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
