// Simulador de equilibrio de Tidewater: mide la economía con el código real del juego (sin gráficos).
//
//   npm run balance                       todo, en español
//   npm run balance -- --n=8000           más partidas simuladas (más preciso, más lento)
//   npm run balance -- --seed=7           otra semilla de azar
//   npm run balance -- --solo=peces,dinero   solo algunas secciones
//   npm run balance -- --en               nombres de peces y mejoras en inglés
//
// Secciones: peces (probabilidad de sacar cada especie), zonas (qué pica dónde y cuándo),
// dinero ($/min por zona y equipo), nevera (minutos hasta llenarla), alcance (profundidad que
// alcanza cada caña desde el muelle y distancia del muelle a aguas profundas), progreso (cuánto
// cuesta todo y cuánto se tarda en pagarlo), fase1 (reglas de src/game/Progression.js: clases de tamaño, XP,
// licencias; dinero y XP por spot y licencia, y horas estimadas para cada nivel).
//
// Los resultados son reproducibles: Math.random se sustituye por un generador con semilla, así
// que dos ejecuciones con la misma semilla dan lo mismo y un cambio en los datos del juego se ve
// como diferencia en la salida. No cuenta el tiempo de caminar, navegar ni vender, ni los fallos
// al clavar: los valores absolutos son optimistas, las comparaciones entre zonas y equipos sí valen.

const args = Object.fromEntries( process.argv.slice( 2 ).map( ( a ) => {

	const [ k, v ] = a.replace( /^--/, '' ).split( '=' );
	return [ k, v ?? true ];

} ) );
const N = Math.max( 200, Number( args.n ) || 3000 );
const SEED = Number( args.seed ) || 1;
const ONLY = typeof args.solo === 'string' ? args.solo.split( ',' ) : null;
const show = ( s ) => ! ONLY || ONLY.includes( s );

// idioma de los nombres (src/i18n.js lee ?lang= de location)
globalThis.location = { search: args.en ? '?lang=en' : '?lang=es' };

// azar reproducible para todo el juego (Bites, CatchMinigame usan Math.random)
let seed = SEED >>> 0;
Math.random = () => {

	seed = ( seed + 0x6D2B79F5 ) >>> 0;
	let t = seed;
	t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
	t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
	return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;

};

const { FISH, FISH_IDS, fishValue } = await import( '../../src/game/FishTable.js' );
const { habitatAt, pickSpecies, rollWeight, biteDelay } = await import( '../../src/game/Bites.js' );
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );
// the audit sections (1–6) describe the original game, so they read its old tracks; the Phase 1 shop is SHOP
const { UPGRADES: SHOP, LEGACY_UPGRADES: UPGRADES, FUEL_PRICE, fuelBurn } = await import( '../../src/game/Gear.js' );
const P = await import( '../../src/game/Progression.js' );

const LINES = UPGRADES.line.levels, REELS = UPGRADES.reel.levels;

// zonas típicas: profundidad (m), distancia al borde del arrecife (m, < 0 dentro), distancia al muelle (m)
const SPOTS = {
	orilla: { depth: 1.5, reefDist: 80, pierDist: 40 },
	muelle: { depth: 3.5, reefDist: 60, pierDist: 3 },
	arrecife: { depth: 6, reefDist: - 4, pierDist: 60 },
	bahía: { depth: 10, reefDist: 40, pierDist: 40 },
	profundo: { depth: 35, reefDist: 200, pierDist: 200 },
};
const HOURS = { 'día 12:00': 12, 'alba 6:30': 6.5, 'ocaso 18:30': 18.5, 'noche 23:00': 23 };

// tiempos fuera de la pelea (s): lanzar, piquitos antes de la picada, tarjeta de captura
const CAST_S = 3, NIBBLE_S = 2.5, CARD_S = 4;

// Jugadores. robot: ve la tensión exacta 60 veces por segundo. humano: la ve 0.25 s tarde y con
// ±0.06 de error. Los dos recogen con histéresis: empiezan bajo un umbral y paran sobre otro.
const PLAYERS = {
	robot: () => {

		let reel = false;
		return ( g ) => ( reel = reel ? g.tension < 0.84 : g.tension < 0.62 );

	},
	humano: () => {

		let reel = false;
		const hist = [];
		return ( g ) => {

			hist.push( g.tension );
			const seen = ( hist.length > 15 ? hist[ hist.length - 16 ] : 0.3 ) + ( Math.random() - 0.5 ) * 0.12;
			return ( reel = reel ? seen < 0.8 : seen < 0.55 );

		};

	},
};

function fight( species, kg, line, reel, player, distance = 15 ) {

	const g = new CatchMinigame( { species, kg, lineKg: LINES[ line ].lineKg, reelSpeed: REELS[ reel ].reelSpeed, distance } );
	const decide = PLAYERS[ player ]();
	const dt = 1 / 60;
	let t = 0;
	while ( g.state === 'fighting' && t < 300 ) {

		g.update( dt, decide( g ) );
		t += dt;

	}

	return { state: g.state, t };

}

const pct = ( x ) => `${ Math.round( x * 100 ) }%`;
const money = ( x ) => `$${ Math.round( x ).toLocaleString( 'es' ) }`;
const pad = ( s, n ) => String( s ).padEnd( n );
const title = ( s ) => console.log( `\n## ${ s }\n` );

// tabla markdown alineada
function table( head, rows ) {

	const w = head.map( ( h, i ) => Math.max( String( h ).length, ...rows.map( ( r ) => String( r[ i ] ).length ) ) );
	const line = ( r ) => '| ' + r.map( ( c, i ) => pad( c, w[ i ] ) ).join( ' | ' ) + ' |';
	console.log( line( head ) );
	console.log( '|' + w.map( ( x ) => '-'.repeat( x + 2 ) ).join( '|' ) + '|' );
	for ( const r of rows ) console.log( line( r ) );

}

// un ciclo completo de pesca en una zona y hora: devuelve segundos, dinero, kg, cortes
function cycle( h, hour, line, reel, player ) {

	const sp = pickSpecies( h, hour );
	if ( ! sp ) return { t: 8, money: 0, kg: 0, snapped: false };
	const kg = rollWeight( sp );
	const r = fight( sp, kg, line, reel, player );
	const caught = r.state === 'caught';
	return {
		t: CAST_S + biteDelay( h, hour ) + NIBBLE_S + r.t + ( caught ? CARD_S : 0 ),
		money: caught ? fishValue( sp, kg ) : 0,
		kg: caught ? kg : 0,
		snapped: r.state === 'snapped',
	};

}

console.log( `# Equilibrio de Tidewater  (n=${ N }, semilla=${ SEED })` );

// ---------------------------------------------------------------- peces
if ( show( 'peces' ) ) {

	title( '1. Probabilidad de sacar cada pez (peso al azar como en el juego, carrete inicial) · humano / robot' );
	const n = Math.max( 200, Math.round( N / 8 ) );
	const rows = FISH_IDS.map( ( id ) => {

		const f = FISH[ id ];
		const cells = LINES.map( ( _, li ) => {

			let h = 0, r = 0;
			for ( let i = 0; i < n; i ++ ) {

				const kg = rollWeight( id );
				if ( fight( id, kg, li, 0, 'humano' ).state === 'caught' ) h ++;
				if ( fight( id, kg, li, 0, 'robot' ).state === 'caught' ) r ++;

			}

			return `${ pct( h / n ) } / ${ pct( r / n ) }`;

		} );
		return [ f.name, `${ f.kg[ 0 ] }–${ f.kg[ 1 ] }`, `$${ f.price }`, ...cells ];

	} );
	table( [ 'Especie', 'kg', '$/kg', ...LINES.map( ( l ) => `${ l.label } (${ l.cost ? '$' + l.cost : 'inicial' })` ) ], rows );

}

// ---------------------------------------------------------------- zonas
if ( show( 'zonas' ) ) {

	title( '2. Qué pica en cada zona y hora: espera media, valor y peso medio por pez, especies más comunes' );
	const rows = [];
	for ( const [ sname, spot ] of Object.entries( SPOTS ) ) {

		const h = habitatAt( spot );
		for ( const [ hname, hour ] of Object.entries( HOURS ) ) {

			const counts = {};
			let wait = 0, val = 0, kgs = 0, n = 0;
			for ( let i = 0; i < N; i ++ ) {

				const sp = pickSpecies( h, hour );
				if ( ! sp ) continue;
				const kg = rollWeight( sp );
				counts[ sp ] = ( counts[ sp ] || 0 ) + 1;
				wait += biteDelay( h, hour );
				val += fishValue( sp, kg );
				kgs += kg;
				n ++;

			}

			const top = Object.entries( counts ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 3 ).map( ( [ k, c ] ) => `${ FISH[ k ].name } ${ pct( c / n ) }` ).join( ', ' );
			rows.push( [ sname, hname, `${ ( wait / n ).toFixed( 1 ) } s`, `$${ ( val / n ).toFixed( 1 ) }`, `${ ( kgs / n ).toFixed( 2 ) } kg`, top ] );

		}

	}

	table( [ 'Zona', 'Hora', 'Espera', '$/pez', 'kg/pez', 'Más comunes' ], rows );

}

// ---------------------------------------------------------------- dinero
const GEAR = [
	[ 'inicial', 0, 0 ],
	[ '15 lb + carrete suave', 1, 1 ],
	[ '30 lb + convencional', 2, 2 ],
	[ '60 lb + convencional', 3, 2 ],
];

function rate( spot, line, reel, player, hour = 12 ) {

	const h = habitatAt( spot );
	let t = 0, m = 0, kg = 0, snaps = 0;
	const n = Math.max( 200, Math.round( N / 10 ) );
	for ( let i = 0; i < n; i ++ ) {

		const c = cycle( h, hour, line, reel, player );
		t += c.t; m += c.money; kg += c.kg; snaps += c.snapped ? 1 : 0;

	}

	return { perMin: m / t * 60, kgPerMin: kg / t * 60, snaps: snaps / n };

}

if ( show( 'dinero' ) ) {

	title( '3. Dinero por minuto pescando al mediodía (jugador humano; sin caminar, navegar ni vender)' );
	const rows = GEAR.map( ( [ name, line, reel ] ) => [ name, ...Object.values( SPOTS ).map( ( spot ) => {

		const r = rate( spot, line, reel, 'humano' );
		return `${ money( r.perMin ) }${ r.snaps >= 0.005 ? ` (${ pct( r.snaps ) } cortes)` : '' }`;

	} ) ] );
	table( [ 'Equipo', ...Object.keys( SPOTS ) ], rows );

}

// ---------------------------------------------------------------- nevera
if ( show( 'nevera' ) ) {

	title( '4. Minutos de pesca hasta llenar la nevera o bodega (jugador humano, mediodía)' );
	const zones = [ 'muelle', 'arrecife', 'profundo' ];
	const rows = UPGRADES.hold.levels.map( ( hold ) => [ `${ hold.label } (${ hold.holdKg } kg)`, ...zones.map( ( z ) => {

		const h = habitatAt( SPOTS[ z ] );
		const [ line, reel ] = z === 'profundo' ? [ 2, 2 ] : [ 1, 1 ];
		let total = 0, value = 0;
		const runs = Math.max( 20, Math.round( N / 100 ) );
		for ( let r = 0; r < runs; r ++ ) {

			let kg = 0, t = 0;
			while ( t < 3600 ) {

				const c = cycle( h, 12, line, reel, 'humano' );
				if ( kg + c.kg > hold.holdKg ) break;
				t += c.t; kg += c.kg; value += c.money;

			}

			total += t;

		}

		return `${ ( total / runs / 60 ).toFixed( 1 ) } min · ${ money( value / runs ) }`;

	} ) ] );
	table( [ 'Nevera / bodega', ...zones ], rows );

}

// ---------------------------------------------------------------- alcance
if ( show( 'alcance' ) ) {

	title( '5. Alcance en el mapa real' );
	const { TerrainData } = await import( '../../src/world/TerrainData.js' );
	const { WORLD } = await import( '../../src/world/WorldLayout.js' );
	const terrain = new TerrainData();
	const depth = ( x, z ) => - terrain.heightAt( x, z );
	const head = { x: WORLD.pier.x, z: WORLD.pier.zEnd };
	const rows = UPGRADES.rod.levels.map( ( rod ) => {

		let best = 0;
		for ( let a = - Math.PI / 2; a <= Math.PI / 2; a += 0.02 ) best = Math.max( best, depth( head.x + Math.sin( a ) * rod.castM, head.z + Math.cos( a ) * rod.castM ) );
		return [ rod.label, `${ rod.castM } m`, `${ best.toFixed( 1 ) } m` ];

	} );
	table( [ 'Caña', 'Lance', 'Profundidad máx. desde la punta del muelle' ], rows );
	console.log();
	const dock = WORLD.boatDock.position;
	const rows2 = [ 4, 16, 20, 28 ].map( ( target ) => {

		for ( let s = 0; s < 2000; s += 5 ) for ( let a = - 1.4; a <= 1.4; a += 0.05 ) {

			if ( depth( dock.x + Math.sin( a ) * s, dock.z + Math.cos( a ) * s ) >= target ) return [ `${ target } m`, `${ s } m` ];

		}

		return [ `${ target } m`, '> 2000 m' ];

	} );
	table( [ 'Profundidad', 'Distancia en bote desde el amarre' ], rows2 );
	console.log( '\n(las aguas profundas empiezan a contar a 16 m y cuentan del todo desde 28 m; la bahía va de ~2 a ~25 m)' );

}

// ---------------------------------------------------------------- progreso
if ( show( 'progreso' ) ) {

	title( '6. Progreso: cuánto cuesta todo y cuánto se tarda en pagarlo' );
	const rows = Object.values( UPGRADES ).map( ( u ) => [ u.name, u.levels.length - 1, money( u.levels.reduce( ( s, l ) => s + l.cost, 0 ) ) ] );
	const total = Object.values( UPGRADES ).reduce( ( s, u ) => s + u.levels.reduce( ( a, l ) => a + l.cost, 0 ), 0 );
	table( [ 'Mejora', 'Niveles a comprar', 'Costo total' ], rows );
	const full = UPGRADES.fuel.levels[ 0 ].fuelL;
	console.log( `\nTodo: ${ money( total ) }. Diésel a $${ FUEL_PRICE }/L; el tanque inicial (${ full } L) dura ${ ( full / fuelBurn( 1 ) / 60 ).toFixed( 0 ) } min a toda máquina y cuesta ${ money( full * FUEL_PRICE ) } llenarlo.` );
	for ( const [ z, line, reel, gear ] of [ [ 'muelle', 0, 0, 'equipo inicial' ], [ 'bahía', 1, 1, '15 lb + carrete suave' ], [ 'profundo', 1, 1, '15 lb + carrete suave' ] ] ) {

		const r = rate( SPOTS[ z ], line, reel, 'humano' );
		console.log( `- En ${ z } con ${ gear } (${ money( r.perMin ) }/min): ${ ( total / r.perMin ).toFixed( 0 ) } min de pesca para comprarlo todo (sin contar viajes ni ventas).` );

	}

	console.log( '\n**Tienda de la Fase 1** (aparejo de flotador por grados, bodega y bote; D37, D39, D43):\n' );
	const shopRows = Object.values( SHOP ).map( ( u ) => [ u.name, u.levels.length - 1, money( u.levels.reduce( ( s, l ) => s + l.cost, 0 ) ) ] );
	const shopTotal = Object.values( SHOP ).reduce( ( s, u ) => s + u.levels.reduce( ( a, l ) => a + l.cost, 0 ), 0 );
	table( [ 'Mejora', 'Grados a comprar', 'Costo total' ], shopRows );
	console.log( `\nTodo: ${ money( shopTotal ) } (la tienda original: ${ money( total ) }).` );

}

// ---------------------------------------------------------------- fase1
if ( show( 'fase1' ) ) {

	title( '7. Fase 1 (reglas de src/game/Progression.js): por spot y licencia, equipo inicial, nevera de 30 kg' );
	console.log( 'Con viajes a vender cuando se llena la nevera (orilla y muelle 1 min, bahía 2, arrecife 2.5, profundo 5).' );
	console.log( 'Los juveniles y los peces sin licencia se sueltan (dan XP). Todavía no está conectado al juego.\n' );
	const TRIP = { orilla: 1, muelle: 1, arrecife: 2.5, bahía: 2, profundo: 5 };
	const session = ( spotName, tier, minutes = 180 ) => {

		const h = habitatAt( SPOTS[ spotName ] );
		let t = 0, money = 0, xp = 0, kg = 0;
		const seen = new Set();
		while ( t < minutes * 60 ) {

			const sp = pickSpecies( h, 12 );
			const w = rollWeight( sp );
			const r = fight( sp, w, 0, 0, 'humano' );
			t += CAST_S + biteDelay( h, 12 ) + NIBBLE_S + r.t;
			if ( r.state !== 'caught' ) continue;
			t += CARD_S;
			xp += P.catchXp( sp, w, { newSpecies: ! seen.has( sp ) } );
			seen.add( sp );
			if ( ! P.canKeep( sp, w, tier ) ) continue;
			if ( kg + w > 30 ) { t += TRIP[ spotName ] * 60; kg = 0; }
			kg += w;
			money += P.classValue( sp, w );

		}

		const hrs = t / 3600;
		return { xpH: xp / hrs, perDay: money / hrs * P.DAY_SECONDS / 3600 };

	};
	const rows = [];
	const best = {};
	for ( const tier of [ 1, 2, 3 ] ) for ( const sn of Object.keys( SPOTS ) ) {

		const r = session( sn, tier );
		rows.push( [ [ '', 'básica', 'intermedia', 'avanzada' ][ tier ], sn, Math.round( r.xpH ), money( r.perDay ), money( r.perDay - P.LICENSES[ tier ].price ) ] );
		best[ tier ] = Math.max( best[ tier ] || 0, r.xpH );

	}

	table( [ 'Licencia', 'Spot', 'XP/h', `$/día de juego (${ P.DAY_SECONDS / 60 } min)`, 'Neto tras pagar la licencia' ], rows );
	const xph = ( best[ 1 ] + best[ 2 ] + best[ 3 ] ) / 3;
	console.log( `\nNiveles (curva ${ P.LEVEL_BASE_XP } × ${ P.LEVEL_GROWTH }^(N − 1)), a ~${ Math.round( xph ) } XP/h (media de los mejores spots):` );
	for ( const L of [ 4, 7, 10, 20 ] ) console.log( `- Nivel ${ L }: ${ P.totalXpForLevel( L ).toLocaleString( 'es' ) } XP · ~${ ( P.totalXpForLevel( L ) / xph ).toFixed( 1 ) } h` );

}
