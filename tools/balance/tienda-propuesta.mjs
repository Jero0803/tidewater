// Tienda por técnicas calculada desde las bandas (propuesta, todavía no implementada en el juego). Uso:
//   node --no-warnings tools/balance/tienda-propuesta.mjs
//
// D33–D36: cada técnica es un aparejo completo (caña + carrete + sedal) que sube de nivel; la bodega y el bote son
// globales. Regla de bandas (D32): todo escala ×1.25 por mapa; cada mapa dura ~5 h.
//   precio de un aparejo en el mapa k = precio estándar del mapa k × factor de la técnica
//   precio estándar del mapa k = lo ganado en la banda × 40 % (equipo) × 70 % (aparejos) × 1/4
// Así los precios de cada técnica siempre suben de un mapa al siguiente. La sección 3 comprueba que comprar todo
// lo de un mapa quepa en lo que se gana en esa banda.

globalThis.location = { search: '?lang=es' };
let seed = 1;
Math.random = () => { seed = ( seed + 0x6D2B79F5 ) >>> 0; let t = seed; t = Math.imul( t ^ ( t >>> 15 ), t | 1 ); t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 ); return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296; };
const { FISH } = await import( '../../src/game/FishTable.js' );
const { rollWeight } = await import( '../../src/game/Bites.js' );
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );

// ---- bandas
const MAPS = [ 'Lago de montaña', 'Lago cálido', 'Río tropical', 'Ciénaga y manglar', 'Laguna costera', 'La isla' ];
const GROWTH = 1.25;
const LAKE_PER_HOUR = 600; // $/h medido en el lago (mapa1-propuesta.mjs, licencia intermedia, buenos spots)
const BAND_HOURS = 5;
const SHARE = { equipo: 0.40, bote: 0.10, licencias: 0.20, combustible: 0.05, margen: 0.25 };
const APAREJOS = 0.70, BODEGA = 0.30; // reparto del presupuesto de equipo
const perHour = ( k ) => LAKE_PER_HOUR * GROWTH ** k;
const band = ( k ) => perHour( k ) * BAND_HOURS;
const entry = ( k ) => 1 + 10 * k;
const standard = ( k ) => band( k ) * SHARE.equipo * APAREJOS / 4;

// ---- técnicas: mapa donde aparece, nivel de entrada + offset para desbloquear cada nivel, factor de precio y
// multiplicadores de las estadísticas del aparejo respecto a la base del mapa
const TECH = {
	flotador: { from: 0, at: 2, factor: 0.7, line: 0.8, cast: 1.0, start: true, note: 'carpa, pejerrey, peces pequeños' },
	spinning: { from: 0, at: 1, factor: 1.0, line: 1.0, cast: 1.15, note: 'trucha, barracuda, macabí' },
	fondo: { from: 0, at: 5, factor: 0.9, line: 1.1, cast: 1.2, note: 'capitán, bagres, peces de arrecife' },
	casting: { from: 1, at: 3, factor: 1.2, line: 1.3, cast: 1.1, note: 'lobina, pavón, payara, sábalo' },
	curricán: { from: 5, at: 4, factor: 1.5, line: 1.6, cast: 0, note: 'atún, dorado (arrastre desde el bote)' },
};
// base por nivel de aparejo (nivel 0 = el inicial del flotador; nivel n = n-ésimo mapa desde que existe la técnica)
const BASE_LINE = [ 7, 10, 13, 18, 26, 36, 50 ]; // kg
const BASE_CAST = [ 22, 25, 29, 33, 38, 43, 48 ]; // m
const BASE_REEL = [ 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3 ]; // m/s
const HOLD = [ 30, 45, 60, 80, 110, 140, 180 ]; // kg
const BOAT = {
	tanque: { unit: 'L', steps: { 2: 60, 3: 80, 4: 110, 5: 150 }, at: 3, w: 0.04 },
	motor: { unit: '× velocidad', steps: { 2: 1.1, 4: 1.2, 5: 1.3 }, at: 6, w: 0.06 },
	sonda: { unit: '', steps: { 2: 'sí' }, at: 4, w: 0.05 },
	luces: { unit: '', steps: { 3: 'sí' }, at: 4, w: 0.04 },
};

const nice = ( x ) => {

	const p = 10 ** Math.max( 0, Math.floor( Math.log10( x ) ) - 1 );
	return Math.round( x / p / 5 ) * 5 * p || Math.round( x );

};
const $ = ( x ) => `$${ Math.round( x ).toLocaleString( 'en-US' ) }`;
const r1 = ( x ) => Math.round( x * 10 ) / 10;

// nivel del aparejo de una técnica en el mapa k (índice en BASE_*): el flotador empieza en 0 y sube 1 por mapa;
// las demás empiezan en el nivel del mapa en que aparecen (para no nacer más débiles que el flotador)
const tier = ( t, k ) => k + 1;
const stats = ( t, i ) => {

	const T = TECH[ t ];
	return { line: r1( BASE_LINE[ i ] * T.line ), cast: T.cast ? Math.round( BASE_CAST[ i ] * T.cast ) : null, reel: BASE_REEL[ i ] };

};

console.log( '# Tienda por técnicas, calculada desde las bandas\n' );
console.log( '## 1. Técnicas\n' );
console.log( '| Técnica | Aparece en | Para | Factor de precio |\n|---|---|---|---|' );
for ( const [ t, T ] of Object.entries( TECH ) ) console.log( `| ${ t } | ${ MAPS[ T.from ] }${ T.start ? ' (nivel inicial gratis)' : '' } | ${ T.note } | ×${ T.factor } |` );

console.log( '\n## 2. Aparejos, bodega y bote por mapa\n' );
console.log( '| Mapa | Objeto | Sedal | Lance | Recogida | Nivel | Precio |\n|---|---|---|---|---|---|---|' );
const perMap = [];
for ( let k = 0; k < 6; k ++ ) {

	let total = 0;
	for ( const [ t, T ] of Object.entries( TECH ) ) {

		if ( k < T.from ) continue;
		const i = tier( t, k ), s = stats( t, i );
		const price = nice( standard( k ) * T.factor );
		total += price;
		console.log( `| ${ MAPS[ k ] } | Aparejo de ${ t } ${ i } | ${ s.line } kg | ${ s.cast ? s.cast + ' m' : '—' } | ${ s.reel } m/s | ${ entry( k ) + T.at } | ${ $( price ) } |` );

	}

	const hold = nice( band( k ) * SHARE.equipo * BODEGA );
	total += hold;
	console.log( `| ${ MAPS[ k ] } | Bodega ${ HOLD[ k + 1 ] } kg | | | | ${ entry( k ) + 3 } | ${ $( hold ) } |` );
	for ( const [ name, b ] of Object.entries( BOAT ) ) {

		if ( b.steps[ k ] === undefined ) continue;
		const price = nice( band( k ) * b.w );
		total += price;
		console.log( `| ${ MAPS[ k ] } | ${ name } ${ b.steps[ k ] } ${ b.unit } | | | | ${ entry( k ) + b.at } | ${ $( price ) } |` );

	}

	perMap.push( total );

}

console.log( '\n## 3. Comprobación de bandas: ¿cabe todo lo del mapa en lo que se gana en él?\n' );
console.log( '| Mapa | Ganado en la banda (~5 h) | Costo de todo su equipo | % de lo ganado | Licencias (20 %) | Queda libre |\n|---|---|---|---|---|---|' );
let grand = 0;
for ( let k = 0; k < 6; k ++ ) {

	grand += perMap[ k ];
	const b = band( k ), lic = b * SHARE.licencias, fuel = b * SHARE.combustible;
	console.log( `| ${ MAPS[ k ] } | ${ $( b ) } | ${ $( perMap[ k ] ) } | ${ Math.round( perMap[ k ] / b * 100 ) }% | ${ $( lic ) } | ${ $( b - perMap[ k ] - lic - fuel ) } |` );

}

console.log( `\nTodo el equipo hasta la isla: ${ $( grand ) }.` );

console.log( '\n## 4. Licencias por mapa (por día del juego; básica 5 %, intermedia 15 %, avanzada 25 % de un día)\n' );
console.log( '| Mapa | Básica | Intermedia (nivel) | Avanzada (nivel) |\n|---|---|---|---|' );
for ( let k = 0; k < 6; k ++ ) {

	const day = perHour( k ) * 24 / 60;
	console.log( `| ${ MAPS[ k ] } | ${ k === 0 ? 'regalada el primer día; luego ' : '' }${ $( nice( day * 0.05 ) ) } | ${ $( nice( day * 0.15 ) ) } (${ entry( k ) + 3 }) | ${ $( nice( day * 0.25 ) ) } (${ entry( k ) + 6 }) |` );

}

// ---- 5. ¿Cada aparejo saca a los peces grandes de su técnica? (con la pelea actual)
const LAKE = {
	carpa: { name: 'Carpa común', kg: [ 0.5, 12 ], fight: 0.55, stamina: 10 },
	truchaCafe: { name: 'Trucha café', kg: [ 0.5, 6 ], fight: 0.55, stamina: 8 },
};
for ( const [ id, f ] of Object.entries( LAKE ) ) FISH[ id ] = { ...f, price: 1, time: 'any', rarity: 1, habitat: {}, lw: [ 0.01, 3 ] };

function catchRate( id, lineKg, reelSpeed, n = 300 ) {

	let ok = 0;
	for ( let i = 0; i < n; i ++ ) {

		const g = new CatchMinigame( { species: id, kg: rollWeight( id ), lineKg, reelSpeed, distance: 15 } );
		const hist = []; let r = false, t = 0;
		while ( g.state === 'fighting' && t < 300 ) {

			hist.push( g.tension );
			const seen = ( hist.length > 15 ? hist[ hist.length - 16 ] : 0.3 ) + ( Math.random() - 0.5 ) * 0.12;
			r = r ? seen < 0.8 : seen < 0.55;
			g.update( 1 / 60, r ); t += 1 / 60;

		}

		if ( g.state === 'caught' ) ok ++;

	}

	return `${ Math.round( ok / n * 100 ) }%`;

}

console.log( '\n## 5. Peces grandes frente al aparejo de su técnica, por mapa (jugador humano, pelea actual)\n' );
const CHECK = [ [ 'carpa', 'flotador' ], [ 'truchaCafe', 'spinning' ], [ 'barracuda', 'spinning' ], [ 'tarpon', 'casting' ], [ 'tuna', 'curricán' ], [ 'mahi', 'curricán' ], [ 'redSnapper', 'fondo' ] ];
console.log( `| Pez | Técnica | ${ MAPS.join( ' | ' ) } |\n|---|---|${ MAPS.map( () => '---' ).join( '|' ) }|` );
for ( const [ id, t ] of CHECK ) {

	const cells = MAPS.map( ( _, k ) => k < TECH[ t ].from ? '—' : catchRate( id, stats( t, tier( t, k ) ).line, BASE_REEL[ tier( t, k ) ] ) );
	console.log( `| ${ FISH[ id ].name } | ${ t } | ${ cells.join( ' | ' ) } |` );

}
