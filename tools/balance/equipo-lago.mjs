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
const { CatchMinigame, STAMINA } = await import( '../../src/game/CatchMinigame.js' );

let seed = 11;
const rng = () => ( ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647 );
const arg = ( k, d ) => Number( ( process.argv.find( ( a ) => a.startsWith( `--${ k }=` ) ) || '' ).split( '=' )[ 1 ] ) || d;

// ---------------------------------------------------------------- catálogo (src/game/Tackle.js, E1)
const { POWERS, RODS, REELS, LINES, HOOKS, BAITS, LURES, PREFS, biteMul, rigStats, fightTackle } = await import( '../../src/game/Tackle.js' );
const kitHookCost = ( h ) => HOOKS[ h ].cost;

// ---------------------------------------------------------------- modelo



export function fightKit( id, kg, kit, player ) {

	const st = rigStats( kit );
	const g = new CatchMinigame( { species: id, kg, lineKg: st.lineKg, reelSpeed: st.reelSpeed, distance: 18, lineCap: st.lineCap, tackle: fightTackle( id, kit ), rng } );
	let state = 'fighting';
	for ( let i = 0; i < 60 * 240 && state === 'fighting'; i ++ ) state = g.update( 1 / 60, player( g ) );
	return { st: state, cause: state === 'fighting' ? null : g.cause, t: g.time };

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

// ---------------------------------------------------------------- 5. ritmo y valores por hora (D74, D75, D78)
// Antes (P1): cada picada clavada era un pez; ~7 s de espera en un buen spot; clases de tamaño con dinero ×1.5 el
// trofeo y ×3 el único. Ahora: espera ×3.5, robo de carnada, clavar antes espanta, enganche 75 / 55 %, pelea de al
// menos un minuto, y el dinero casi por peso (trofeo ×1.1, único ×1.2; D78). El factor por especie es lo que hay que
// multiplicar el precio y la XP de cada pez para que la hora rinda lo mismo que antes (FISH[ id ].hourMul).
const { biteDelay, rollWeight, HOOKING } = await import( '../../src/game/Bites.js' );
const { sizeClass, SIZE_CLASSES, difficulty, XP_PER_KG } = await import( '../../src/game/Progression.js' );
export const RHYTHM = { ...HOOKING, waitMul: arg( 'wait', HOOKING.waitMul ), early: 0.1, lateShare: 0.3, rebait: 2 };
const CAST = 3, NIBBLES = 2.5, CARD = 4;
const goodSpot = { a: 1 };
const OLD_MULT = { juvenile: 0, common: 1, trophy: 1.5, unique: 3 };
const NEW_MULT = Object.fromEntries( SIZE_CLASSES.map( ( c ) => [ c.id, c.mult ] ) );
const basePrice = ( id ) => FISH[ id ].price; // hourMul is a separate multiplier (FishTable PER_HOUR), not in price
// antes: clases por porcentaje del rango (P1); ahora: las del juego (en kilos para el lago, D84)
const oldClass = ( id, kg ) => { const [ lo, hi ] = FISH[ id ].kg, t = ( kg - lo ) / Math.max( hi - lo, 1e-6 ); return SIZE_CLASSES.find( ( c ) => t < c.upTo ) || SIZE_CLASSES[ 3 ]; };
const money = ( id, kg, mult, cls = sizeClass ) => FISH[ id ].protected ? 0 : basePrice( id ) * kg * mult[ cls( id, kg ).id ];
const xpOf = ( id, kg, cls = sizeClass ) => cls( id, kg ).xp * difficulty( id ) + XP_PER_KG * kg; // sin xpMul ni especie nueva
const fightOld = ( id, kg ) => {

	const g = new CatchMinigame( { species: id, kg, lineKg: 7, reelSpeed: 1.1, distance: 18, rng } );
	let st = 'fighting';
	for ( let i = 0; i < 60 * 240 && st === 'fighting'; i ++ ) st = g.update( 1 / 60, PLAYERS.bueno( g ) );
	return { ok: st === 'caught', t: g.time };

};

console.log( '\n## 5. Ritmo y valores por hora: antes (P1) y ahora (espera ×' + RHYTHM.waitMul + ', robo ' + pct( RHYTHM.steal ) + ', enganche ' + pct( RHYTHM.hookFirst ) + ' / ' + pct( RHYTHM.hookLate ) + ', pelea D73, clases D78)\n' );
console.log( '| Pez (con su equipo) | Antes: peces/h | Antes: $/h | Antes: XP/h | Ahora: peces/h | Picadas que enganchan | Factor $ | Factor XP | hourMul en el juego |' );
console.log( '|---|---|---|---|---|---|---|---|---|' );
const H = 3600 * arg( 'horas', 12 );
const RIGHT5 = { guapucha: 'Flotador UL (inicial)', carachi: 'Flotador UL (inicial)', pejerrey: 'Flotador UL (inicial)', capitan: 'Flotador L lombriz', rainbowTrout: 'Spinning L trucha', carp: 'Fondo M carpa', brownTrout: 'Spinning ML trucha café' };
export const FACTORS = {};
for ( const [ id, kitName ] of Object.entries( RIGHT5 ) ) {

	const kit = KITS[ kitName ];
	let t = 0, n0 = 0, v0 = 0, x0 = 0;
	while ( t < H ) {

		t += CAST + biteDelay( goodSpot, 12, rng ) + NIBBLES;
		const kg = rollWeight( id, rng ), r = fightOld( id, kg );
		t += r.t;
		if ( r.ok ) { n0 ++; v0 += money( id, kg, OLD_MULT, oldClass ); x0 += xpOf( id, kg, oldClass ); t += CARD; }

	}

	let t1 = 0, n1 = 0, v1 = 0, x1 = 0, bites = 0, hooked = 0;
	const mul = biteMul( id, kit ).total;
	while ( t1 < H ) {

		t1 += CAST + biteDelay( goodSpot, 12, rng ) * RHYTHM.waitMul / mul + NIBBLES;
		bites ++;
		if ( rng() < RHYTHM.steal ) { t1 += RHYTHM.rebait; continue; } // se llevó la carnada en los toques
		if ( rng() < RHYTHM.early && rng() < RHYTHM.spook ) { t1 += RHYTHM.rebait; continue; } // clavó antes y lo espantó
		const pHook = rng() < RHYTHM.lateShare ? RHYTHM.hookLate : RHYTHM.hookFirst;
		if ( rng() >= pHook ) { t1 += RHYTHM.rebait; continue; } // falló al clavar
		hooked ++;
		const kg = rollWeight( id, rng ), r = fightKit( id, kg, kit, PLAYERS.bueno );
		t1 += r.t;
		if ( r.st === 'caught' ) { n1 ++; v1 += money( id, kg, NEW_MULT ); x1 += xpOf( id, kg ); t1 += CARD; }

	}

	const h0 = t / 3600, h1 = t1 / 3600;
	const fm = v1 > 0 ? ( v0 / h0 ) / ( v1 / h1 ) : null, fx = ( x0 / h0 ) / ( x1 / h1 );
	FACTORS[ id ] = { money: fm, xp: fx };
	console.log( `| ${ NAMES[ id ] } | ${ ( n0 / h0 ).toFixed( 0 ) } | $${ ( v0 / h0 ).toFixed( 0 ) } | ${ ( x0 / h0 ).toFixed( 0 ) } | ${ ( n1 / h1 ).toFixed( 0 ) } | ${ pct( hooked / bites ) } | ${ fm ? '×' + fm.toFixed( 1 ) : '—' } | ×${ fx.toFixed( 1 ) } | ×${ FISH[ id ].hourMul || 1 } |` );

}

// la isla no cambia de pelea ni de ritmo: solo pierde lo que D78 quita a trofeos y únicos; su hourMul lo devuelve
console.log( '\n**La isla:** mismo ritmo y pelea; factor para compensar las clases de D78 (valor medio por pez antes / ahora)\n' );
console.log( '| Especie | Factor | hourMul en el juego |' );
console.log( '|---|---|---|' );
const { catalogEntry } = await import( '../../src/maps/catalog.js' );
const islandSpecies = catalogEntry( 'island' ).species;
for ( const id of islandSpecies ) {

	let a = 0, b = 0;
	for ( let i = 0; i < 20000; i ++ ) { const kg = rollWeight( id, rng ); a += money( id, kg, OLD_MULT ); b += money( id, kg, NEW_MULT ); }
	console.log( `| ${ FISH[ id ].name } | ×${ ( a / b ).toFixed( 2 ) } | ×${ FISH[ id ].hourMul || 1 } |` );

}
