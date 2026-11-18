// Mapa 1 · Lago de montaña (propuesta, todavía no implementada en el juego), medido contra la isla con las
// reglas de la Fase 1 (clases de tamaño, XP con 3 por kilo, licencias). Uso:
//   node --no-warnings tools/balance/mapa1-propuesta.mjs
// Los datos de especies son aproximados (marcados en docs/DISENO.md); se ajustan aquí y se vuelve a medir.

globalThis.location = { search: '?lang=es' };
let seed = 1;
Math.random = () => { seed = ( seed + 0x6D2B79F5 ) >>> 0; let t = seed; t = Math.imul( t ^ ( t >>> 15 ), t | 1 ); t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 ); return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296; };

const { FISH } = await import( '../../src/game/FishTable.js' );
const { activity, habitatAt, pickSpecies, rollWeight } = await import( '../../src/game/Bites.js' );
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );

// ---- especies del lago de montaña (se agregan a la tabla del juego solo dentro de esta simulación)
// lw: relación largo-peso W(g) = a·L(cm)^b (aproximada); kg: rango; price: $/kg; fight 0..1; stamina s; time
const LAKE = {
	guapucha: { name: 'Guapucha', lw: [ 0.01, 3.0 ], kg: [ 0.005, 0.02 ], price: 2, fight: 0.02, stamina: 1, time: 'day', lic: 1 },
	carachi: { name: 'Carachi', lw: [ 0.015, 3.0 ], kg: [ 0.02, 0.15 ], price: 3, fight: 0.05, stamina: 1.5, time: 'day', lic: 1 },
	pejerrey: { name: 'Pejerrey', lw: [ 0.006, 3.1 ], kg: [ 0.1, 1.2 ], price: 4, fight: 0.15, stamina: 2.5, time: 'day', lic: 1 },
	capitan: { name: 'Capitán de la sabana', lw: [ 0.006, 3.0 ], kg: [ 0.1, 0.8 ], price: 0, fight: 0.25, stamina: 4, time: 'night', lic: 0 }, // protegida: solo XP
	trucha: { name: 'Trucha arcoíris', lw: [ 0.0107, 3.04 ], kg: [ 0.2, 4 ], price: 6, fight: 0.45, stamina: 6, time: 'dawnDusk', lic: 2 },
	carpa: { name: 'Carpa común', lw: [ 0.0174, 3.1 ], kg: [ 0.5, 12 ], price: 2, fight: 0.55, stamina: 10, time: 'any', lic: 2 },
	truchaCafe: { name: 'Trucha café', lw: [ 0.0105, 3.0 ], kg: [ 0.5, 6 ], price: 8, fight: 0.55, stamina: 8, time: 'dawnDusk', lic: 3 },
};
for ( const [ id, f ] of Object.entries( LAKE ) ) FISH[ id ] = { ...f, rarity: 1, habitat: {} };

// spots del lago: peso de cada especie en cada spot, y tiempo de un viaje a vender (min)
const LAKE_SPOTS = {
	'orilla de juncos': { trip: 1, w: { guapucha: 1, carachi: 1, capitan: 0.4, pejerrey: 0.3 } },
	'muelle del pueblo': { trip: 0.5, w: { carachi: 0.6, pejerrey: 1, trucha: 0.35, guapucha: 0.4 } },
	'desembocadura': { trip: 1.5, w: { trucha: 1, pejerrey: 0.5, truchaCafe: 0.15, carachi: 0.3 } },
	'bahía de lodo': { trip: 1.5, w: { carpa: 1, capitan: 0.5, carachi: 0.5 } },
	'centro profundo': { trip: 3, w: { trucha: 0.8, truchaCafe: 0.45, carpa: 0.5, pejerrey: 0.4 } },
};

// ---- reglas de la Fase 1 (propuesta medida en fase1-propuesta.mjs)
const CLASSES = [ { up: 0.15, mult: 0, xp: 1 }, { up: 0.70, mult: 1, xp: 3 }, { up: 0.92, mult: 1.5, xp: 10 }, { up: 1.01, mult: 3, xp: 40 } ];
const KGXP = 3, NEW_XP = 20, DAY_MIN = 24;
const classOf = ( f, kg ) => CLASSES.find( ( c ) => ( kg - f.kg[ 0 ] ) / ( f.kg[ 1 ] - f.kg[ 0 ] ) < c.up );
const diff = ( f ) => 1 + 2 * f.fight;

function fight( id, kg, lineKg = 7, reelSpeed = 1.1 ) {

	const g = new CatchMinigame( { species: id, kg, lineKg, reelSpeed, distance: 15 } );
	const hist = []; let r = false, t = 0;
	while ( g.state === 'fighting' && t < 300 ) {

		hist.push( g.tension );
		const seen = ( hist.length > 15 ? hist[ hist.length - 16 ] : 0.3 ) + ( Math.random() - 0.5 ) * 0.12;
		r = r ? seen < 0.8 : seen < 0.55;
		g.update( 1 / 60, r ); t += 1 / 60;

	}

	return { ok: g.state === 'caught', t };

}

// una sesión: `pick` elige especie, `wait` da la espera; lic = licencia que tiene el jugador (1..3)
function session( pick, wait, trip, lic, holdKg = 30, minutes = 240 ) {

	let t = 0, money = 0, xp = 0, kg = 0, n = 0;
	const seen = new Set();
	while ( t < minutes * 60 ) {

		const id = pick(), f = FISH[ id ], w = rollWeight( id );
		const r = fight( id, w );
		t += 3 + wait() + 2.5 + r.t;
		if ( ! r.ok ) continue;
		t += 4; n ++;
		const c = classOf( f, w );
		xp += Math.round( c.xp * diff( f ) + KGXP * w ) + ( seen.has( id ) ? 0 : NEW_XP );
		seen.add( id );
		const tier = f.lic ?? ISLAND_TIER[ id ];
		if ( ! c.mult || ! tier || tier > lic || ! f.price ) continue;
		if ( kg + w > holdKg ) { t += trip * 60; kg = 0; }
		kg += w;
		money += Math.round( f.price * w * c.mult );

	}

	const h = t / 3600;
	return { xpH: xp / h, moneyH: money / h, perDay: money / h * DAY_MIN / 60, fishH: n / h };

}

const ISLAND_TIER = {};
for ( const id of [ 'silverside', 'mullet', 'needlefish', 'sergeant', 'grunt', 'chromis', 'tang' ] ) ISLAND_TIER[ id ] = 1;
for ( const id of [ 'yellowtail', 'wrasse', 'parrot', 'angel', 'jack', 'barracuda' ] ) ISLAND_TIER[ id ] = 2;
for ( const id of [ 'redSnapper', 'grouper', 'tuna', 'mahi', 'tarpon' ] ) ISLAND_TIER[ id ] = 3;

const lakePick = ( spot, hour = 12 ) => () => {

	const w = Object.entries( spot.w ).map( ( [ id, x ] ) => [ id, x * activity( FISH[ id ].time, hour ) ] );
	let r = Math.random() * w.reduce( ( s, [ , x ] ) => s + x, 0 );
	for ( const [ id, x ] of w ) if ( ( r -= x ) <= 0 ) return id;
	return w[ w.length - 1 ][ 0 ];

};
// espera media parecida a la isla (~5–7 s), un poco más en el centro profundo
const lakeWait = ( spot ) => () => 2 + - Math.log( 1 - Math.random() * 0.98 ) * ( spot.trip >= 3 ? 7 : 5 ) * 0.6;

const ISLAND = {
	orilla: { h: { depth: 1.5, reefDist: 80, pierDist: 40 }, trip: 1 },
	muelle: { h: { depth: 3.5, reefDist: 60, pierDist: 3 }, trip: 1 },
	arrecife: { h: { depth: 6, reefDist: - 4, pierDist: 60 }, trip: 2.5 },
	bahía: { h: { depth: 10, reefDist: 40, pierDist: 40 }, trip: 2 },
	profundo: { h: { depth: 35, reefDist: 200, pierDist: 200 }, trip: 5 },
};
const { biteDelay } = await import( '../../src/game/Bites.js' );
const islandPick = ( s ) => () => pickSpecies( habitatAt( s.h ), 12 );
const islandWait = ( s ) => () => biteDelay( habitatAt( s.h ), 12 );

const row = ( name, r ) => `| ${ name } | ${ Math.round( r.fishH ) } | ${ Math.round( r.xpH ) } | $${ Math.round( r.moneyH ) } | $${ Math.round( r.perDay ) } |`;
const head = '| Spot | Peces/h | XP/h | $/h | $/día (24 min) |\n|---|---|---|---|---|';

console.log( '# Mapa 1 (lago de montaña) frente a la isla · equipo inicial, nevera 30 kg, jugador humano\n' );
for ( const [ lic, name ] of [ [ 1, 'básica' ], [ 2, 'intermedia' ], [ 3, 'avanzada' ] ] ) {

	console.log( `\n## Licencia ${ name }\n\n### Lago de montaña\n${ head }` );
	for ( const [ sn, s ] of Object.entries( LAKE_SPOTS ) ) console.log( row( sn, session( lakePick( s ), lakeWait( s ), s.trip, lic ) ) );
	console.log( `\n### Isla\n${ head }` );
	for ( const [ sn, s ] of Object.entries( ISLAND ) ) console.log( row( sn, session( islandPick( s ), islandWait( s ), s.trip, lic ) ) );

}

// valor y XP medios por pez de cada especie del lago
console.log( '\n## Especies del lago: valor y XP medios por pez (clases incluidas)\n\n| Especie | Licencia | kg | $/pez | XP/pez | % se saca (8 lb) |\n|---|---|---|---|---|---|' );
for ( const [ id, f ] of Object.entries( LAKE ) ) {

	let v = 0, x = 0, ok = 0; const n = 400;
	for ( let i = 0; i < n; i ++ ) {

		const w = rollWeight( id ), c = classOf( f, w );
		v += Math.round( f.price * w * c.mult ); x += Math.round( c.xp * diff( f ) + KGXP * w );
		if ( fight( id, w ).ok ) ok ++;

	}

	console.log( `| ${ f.name } | ${ [ 'protegida', 'básica', 'intermedia', 'avanzada' ][ f.lic ] } | ${ f.kg[ 0 ] }–${ f.kg[ 1 ] } | $${ ( v / n ).toFixed( 1 ) } | ${ ( x / n ).toFixed( 1 ) } | ${ Math.round( ok / n * 100 ) }% |` );

}
