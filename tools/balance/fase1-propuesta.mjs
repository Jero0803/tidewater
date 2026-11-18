// Fase 1 (propuesta): clases de tamaño, XP y licencias, simuladas con el código real del juego.
// Propuesta, todavía no implementada en el juego. Uso: node --no-warnings tools/balance/fase1-propuesta.mjs
// Variable de entorno KGXP: XP por kilo (por defecto 3, lo propuesto).
globalThis.location = { search: '?lang=es' };
let seed = 1;
Math.random = () => { seed = ( seed + 0x6D2B79F5 ) >>> 0; let t = seed; t = Math.imul( t ^ ( t >>> 15 ), t | 1 ); t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 ); return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296; };
const imp = ( p ) => import( `../../src/game/${ p }` );
const { FISH, FISH_IDS } = await imp( 'FishTable.js' );
const { habitatAt, pickSpecies, rollWeight, biteDelay } = await imp( 'Bites.js' );
const { CatchMinigame } = await imp( 'CatchMinigame.js' );
const { UPGRADES } = await imp( 'Gear.js' );

// ---- propuesta
const CLASSES = [ // t = posición del peso dentro del rango de la especie (0..1)
	{ id: 'juvenil', upTo: 0.15, mult: 0, xp: 1 },
	{ id: 'común', upTo: 0.70, mult: 1, xp: 3 },
	{ id: 'trofeo', upTo: 0.92, mult: 1.5, xp: 10 },
	{ id: 'único', upTo: 1.01, mult: 3, xp: 40 },
];
const LIC = { básica: 1, intermedia: 2, avanzada: 3 };
const TIER = {};
for ( const id of [ 'silverside', 'mullet', 'needlefish', 'sergeant', 'grunt', 'chromis', 'tang' ] ) TIER[ id ] = 1;
for ( const id of [ 'yellowtail', 'wrasse', 'parrot', 'angel', 'jack', 'barracuda' ] ) TIER[ id ] = 2;
for ( const id of [ 'redSnapper', 'grouper', 'tuna', 'mahi', 'tarpon' ] ) TIER[ id ] = 3;
const NEW_SPECIES_XP = 20;
const diff = ( id ) => 1 + 2 * FISH[ id ].fight; // 1..3
const DAY_MIN = 24;

const classOf = ( id, kg ) => {

	const f = FISH[ id ];
	const t = ( kg - f.kg[ 0 ] ) / ( f.kg[ 1 ] - f.kg[ 0 ] );
	return CLASSES.find( ( c ) => t < c.upTo );

};
const value = ( id, kg, c ) => Math.round( FISH[ id ].price * kg * c.mult );
const xpOf = ( id, c, kg ) => Math.round( c.xp * diff( id ) + KGXP * kg );
const KGXP = Number( process.env.KGXP ?? 3 );

// spots y tiempo extra por viaje de venta (caminar/navegar ida y vuelta + vender), minutos
const SPOTS = {
	orilla: { h: { depth: 1.5, reefDist: 80, pierDist: 40 }, trip: 1 },
	muelle: { h: { depth: 3.5, reefDist: 60, pierDist: 3 }, trip: 1 },
	arrecife: { h: { depth: 6, reefDist: - 4, pierDist: 60 }, trip: 2.5 },
	bahía: { h: { depth: 10, reefDist: 40, pierDist: 40 }, trip: 2 },
	profundo: { h: { depth: 35, reefDist: 200, pierDist: 200 }, trip: 5 },
};

function fight( id, kg, line, reel ) {

	const g = new CatchMinigame( { species: id, kg, lineKg: UPGRADES.line.levels[ line ].lineKg, reelSpeed: UPGRADES.reel.levels[ reel ].reelSpeed, distance: 15 } );
	const hist = []; let r = false, t = 0;
	while ( g.state === 'fighting' && t < 300 ) {

		hist.push( g.tension );
		const seen = ( hist.length > 15 ? hist[ hist.length - 16 ] : 0.3 ) + ( Math.random() - 0.5 ) * 0.12;
		r = r ? seen < 0.8 : seen < 0.55;
		g.update( 1 / 60, r ); t += 1 / 60;

	}

	return { ok: g.state === 'caught', t };

}

// una sesión de `minutes` en un spot con una licencia y equipo; devuelve $ (neto de viajes) y XP por hora
function session( spotName, lic, line, reel, holdKg, minutes = 240, hour = 12 ) {

	const spot = SPOTS[ spotName ], h = habitatAt( spot.h );
	let t = 0, money = 0, xp = 0, kg = 0, kept = 0, released = 0;
	const seen = new Set();
	const end = minutes * 60;
	while ( t < end ) {

		const sp = pickSpecies( h, hour );
		const w = rollWeight( sp );
		const r = fight( sp, w, line, reel );
		t += 3 + biteDelay( h, hour ) + 2.5 + r.t;
		if ( ! r.ok ) continue;
		t += 4;
		const c = classOf( sp, w );
		xp += xpOf( sp, c, w ) + ( seen.has( sp ) ? 0 : NEW_SPECIES_XP );
		seen.add( sp );
		const keep = c.mult > 0 && TIER[ sp ] <= LIC[ lic ];
		if ( ! keep ) { released ++; continue; }
		if ( kg + w > holdKg ) { t += spot.trip * 60; kg = 0; } // viaje a vender
		kg += w; kept ++;
		money += value( sp, w, c );

	}

	const hrs = t / 3600;
	return { perHour: money / hrs, xpPerHour: xp / hrs, perDay: money / hrs * DAY_MIN / 60, keptPct: kept / ( kept + released ) };

}

const out = ( s = '' ) => console.log( s );
const pad = ( s, n ) => String( s ).padEnd( n );

// 1. frecuencia real de las clases con la distribución de pesos del juego
out( '## 1. Frecuencia de cada clase (todas las especies)' );
const cnt = {};
let n = 0;
for ( const id of FISH_IDS ) for ( let i = 0; i < 4000; i ++ ) { const c = classOf( id, rollWeight( id ) ); cnt[ c.id ] = ( cnt[ c.id ] || 0 ) + 1; n ++; }
for ( const c of CLASSES ) out( `${ pad( c.id, 8 ) } ${ ( cnt[ c.id ] / n * 100 ).toFixed( 1 ) }%  ×${ c.mult } precio  ${ c.xp } XP base` );

// 2. valor medio por pez antes y después (por especie, solo los que se venden)
out( '\n## 2. Valor medio de lo capturado por especie: actual → con clases (juveniles = $0)' );
const { fishValue } = await imp( 'FishTable.js' );
for ( const id of FISH_IDS ) {

	let a = 0, b = 0;
	for ( let i = 0; i < 4000; i ++ ) { const w = rollWeight( id ); a += fishValue( id, w ); b += value( id, w, classOf( id, w ) ); }
	out( `${ pad( FISH[ id ].name, 18 ) } $${ ( a / 4000 ).toFixed( 1 ) } → $${ ( b / 4000 ).toFixed( 1 ) }  (licencia ${ Object.keys( LIC )[ TIER[ id ] - 1 ] }, dificultad ×${ diff( id ).toFixed( 1 ) })` );

}

// 3. dinero y XP por hora según spot y licencia (equipo inicial, nevera 30 kg)
out( '\n## 3. Por spot y licencia (equipo inicial, nevera 30 kg, con viajes a vender): $/hora · $/día de juego (24 min) · XP/hora · % que te quedas' );
for ( const lic of Object.keys( LIC ) ) for ( const s of Object.keys( SPOTS ) ) {

	const r = session( s, lic, 0, 0, 30 );
	out( `${ pad( lic, 11 ) } ${ pad( s, 9 ) } $${ Math.round( r.perHour ).toString().padStart( 5 ) }/h · $${ Math.round( r.perDay ).toString().padStart( 4 ) }/día · ${ Math.round( r.xpPerHour ).toString().padStart( 5 ) } XP/h · ${ Math.round( r.keptPct * 100 ) }% guardas` );

}

// 4. con equipo medio (15 lb, carrete suave, cajón de hielo 70 kg)
out( '\n## 4. Igual con equipo medio (15 lb, carrete suave, cajón de hielo 70 kg)' );
for ( const [ lic, s ] of [ [ 'básica', 'muelle' ], [ 'intermedia', 'arrecife' ], [ 'intermedia', 'bahía' ], [ 'avanzada', 'bahía' ], [ 'avanzada', 'profundo' ] ] ) {

	const r = session( s, lic, 1, 1, 70 );
	out( `${ pad( lic, 11 ) } ${ pad( s, 9 ) } $${ Math.round( r.perHour ).toString().padStart( 5 ) }/h · $${ Math.round( r.perDay ).toString().padStart( 4 ) }/día · ${ Math.round( r.xpPerHour ).toString().padStart( 5 ) } XP/h` );

}
