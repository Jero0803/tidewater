// Tienda calculada desde las bandas (propuesta, todavía no implementada en el juego). Uso:
//   node --no-warnings tools/balance/tienda-propuesta.mjs
//
// Regla: todo escala ×1.25 por mapa (como la XP, D32). Cada mapa dura ~5 h; lo que se gana en esa banda se
// reparte en un presupuesto: una parte va al equipo de ese mapa. El precio de cada nivel de equipo es una parte
// de ese presupuesto. Las anclas (lago e isla) vienen de mapa1-propuesta.mjs.

globalThis.location = { search: '?lang=es' };
let seed = 1;
Math.random = () => { seed = ( seed + 0x6D2B79F5 ) >>> 0; let t = seed; t = Math.imul( t ^ ( t >>> 15 ), t | 1 ); t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 ); return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296; };
const { FISH } = await import( '../../src/game/FishTable.js' );
const { rollWeight } = await import( '../../src/game/Bites.js' );
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );

// ---- bandas
const MAPS = [ 'Lago de montaña', 'Lago cálido', 'Río tropical', 'Ciénaga y manglar', 'Laguna costera', 'La isla' ];
const GROWTH = 1.25; // por mapa
const LAKE_PER_HOUR = 600; // $/h medido en el lago con licencia intermedia en buenos spots (anclas: lago ~$600–650, isla ~$1,100–3,450)
const BAND_HOURS = 5;
const SHARE = { equipo: 0.40, bote: 0.10, licencias: 0.20, combustible: 0.05, margen: 0.25 };
const perHour = ( k ) => LAKE_PER_HOUR * GROWTH ** k; // k = 0..5
const entry = ( k ) => 1 + 10 * k;

// ---- equipo: valor de cada nivel (índice 0 = lo que se tiene al empezar; nivel k+1 llega en el mapa k)
// reparto del presupuesto de equipo de cada mapa entre las mejoras que ese mapa trae
const TRACKS = {
	sedal: { unit: 'kg de resistencia', values: [ 7, 10, 13, 18, 26, 36, 50 ], at: 2, w: 0.25 },
	bodega: { unit: 'kg de capacidad', values: [ 30, 45, 60, 80, 110, 140, 180 ], at: 2, w: 0.35 },
	caña: { unit: 'm de lance', values: [ 22, 25, 29, 33, 38, 43, 48 ], at: 5, w: 0.2 },
	carrete: { unit: 'm/s de recogida', values: [ 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3 ], at: 5, w: 0.2 },
};
// bote: mejoras que llegan en mapas concretos (mapa → valor); w = parte de lo ganado en la banda (presupuesto aparte)
const BOAT = {
	tanque: { unit: 'L', start: 40, steps: { 2: 60, 3: 80, 4: 110, 5: 150 }, at: 3, w: 0.04 },
	motor: { unit: '× velocidad', start: 1, steps: { 2: 1.1, 4: 1.2, 5: 1.3 }, at: 6, w: 0.06 },
	sonda: { unit: '', start: 'no', steps: { 2: 'sí' }, at: 4, w: 0.05 },
	luces: { unit: '', start: 'no', steps: { 3: 'sí' }, at: 4, w: 0.04 },
};

const nice = ( x ) => {

	const p = 10 ** Math.max( 0, Math.floor( Math.log10( x ) ) - 1 );
	return Math.round( x / p / 5 ) * 5 * p || Math.round( x );

};
const $ = ( x ) => `$${ Math.round( x ).toLocaleString( 'en-US' ) }`;

console.log( '# Tienda calculada desde las bandas\n' );
console.log( '## 1. Presupuesto por mapa\n' );
console.log( '| Mapa | Niveles | $/h estimado | Ganado en la banda (~5 h) | Para equipo (40 %) | Para licencias (20 %) |\n|---|---|---|---|---|---|' );
for ( let k = 0; k < 6; k ++ ) {

	const band = perHour( k ) * BAND_HOURS;
	console.log( `| ${ MAPS[ k ] } | ${ entry( k ) }–${ entry( k ) + 9 } | ${ $( perHour( k ) ) } | ${ $( band ) } | ${ $( band * SHARE.equipo ) } | ${ $( band * SHARE.licencias ) } |` );

}

console.log( '\n## 2. Equipo: nivel, desbloqueo y precio\n' );
console.log( '| Mapa | Mejora | Valor | Se desbloquea en el nivel | Precio |\n|---|---|---|---|---|' );
let totalGear = 0;
for ( let k = 0; k < 6; k ++ ) {

	const band = perHour( k ) * BAND_HOURS;
	const items = [];
	for ( const [ name, t ] of Object.entries( TRACKS ) ) items.push( { name, value: `${ t.values[ k + 1 ] } ${ t.unit }`, at: entry( k ) + t.at, cost: band * SHARE.equipo * t.w } );
	for ( const [ name, b ] of Object.entries( BOAT ) ) if ( b.steps[ k ] !== undefined ) items.push( { name, value: `${ b.steps[ k ] } ${ b.unit }`.trim(), at: entry( k ) + b.at, cost: band * b.w } );
	for ( const i of items ) {

		const price = nice( i.cost );
		totalGear += price;
		console.log( `| ${ MAPS[ k ] } | ${ i.name } | ${ i.value } | ${ i.at } | ${ $( price ) } |` );

	}

}

console.log( `\nTotal de todo el equipo hasta la isla: ${ $( totalGear ) }.` );

console.log( '\n## 3. Licencias por mapa (por día del juego de 24 min)\n' );
console.log( 'Regla: básica 5 %, intermedia 15 %, avanzada 25 % de lo que se gana en un día en ese mapa.\n' );
console.log( '| Mapa | Básica | Intermedia (nivel) | Avanzada (nivel) |\n|---|---|---|---|' );
for ( let k = 0; k < 6; k ++ ) {

	const day = perHour( k ) * 24 / 60;
	console.log( `| ${ MAPS[ k ] } | ${ k === 0 ? 'regalada el primer día; luego ' : '' }${ $( nice( day * 0.05 ) ) } | ${ $( nice( day * 0.15 ) ) } (${ entry( k ) + 3 }) | ${ $( nice( day * 0.25 ) ) } (${ entry( k ) + 6 }) |` );

}

// ---- 4. ¿El sedal de cada mapa saca a sus peces más grandes? (lago e isla, que son los que existen)
const LAKE = {
	carpa: { name: 'Carpa común', kg: [ 0.5, 12 ], fight: 0.55, stamina: 10 },
	truchaCafe: { name: 'Trucha café', kg: [ 0.5, 6 ], fight: 0.55, stamina: 8 },
	trucha: { name: 'Trucha arcoíris', kg: [ 0.2, 4 ], fight: 0.45, stamina: 6 },
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

console.log( '\n## 4. Peces grandes frente a cada sedal (jugador humano)\n' );
const L = TRACKS.sedal.values, R = TRACKS.carrete.values;
console.log( `| Pez | ${ L.map( ( v ) => `${ v } kg` ).join( ' | ' ) } |\n|---|${ L.map( () => '---' ).join( '|' ) }|` );
for ( const id of [ 'trucha', 'carpa', 'truchaCafe', 'barracuda', 'tuna', 'mahi', 'tarpon' ] ) console.log( `| ${ FISH[ id ].name } | ${ L.map( ( v, i ) => catchRate( id, v, R[ i ] ) ).join( ' | ' ) } |` );
