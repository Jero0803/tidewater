// Fight simulator (docs/DISENO.md D62): plays CatchMinigame fights with scripted players and prints how they end.
//   node tools/balance/fight.mjs
// Players:
//   good   reels when the spool isn't slipping, pulls against dives, lets go of the pull in jumps, holds the rod
//          against runs, tightens / loosens the drag with the tension
//   lazy   holds the reel all the time, never pulls, never moves the rod, leaves the drag where it is
//   tight  like good but with the drag screwed down (10)
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { CatchMinigame } = await import( '../../src/game/CatchMinigame.js' );

let seed = 7;
const rng = () => ( ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647 );

const players = {
	good: ( g ) => {

		if ( g.tension > 0.8 && g.drag > 2 ) g.setDrag( g.drag - 1 );
		else if ( g.tension < 0.3 && ! g.slipping && g.drag < 7 ) g.setDrag( g.drag + 1 );
		return { reel: ! g.slipping || g.mode === 'come', fast: g.mode === 'come', pull: ( g.mode === 'dive' || g.mode === 'hold' ) && g.mode !== 'jump', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	},
	lazy: () => ( { reel: true } ),
	tight: ( g ) => {

		g.setDrag( 10 );
		return { reel: ! g.slipping || g.mode === 'come', fast: g.mode === 'come', pull: g.mode === 'dive', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	},
};

function fight( species, kg, player, lineKg = 7, reelSpeed = 1.1 ) {

	const g = new CatchMinigame( { species, kg, lineKg, reelSpeed, distance: 18, rng } );
	let st = 'fighting';
	for ( let i = 0; i < 60 * 240 && st === 'fighting'; i ++ ) st = g.update( 1 / 60, players[ player ]( g ) );
	return { st, cause: g.cause, t: g.time };

}

const cases = [
	[ 'guapucha', 0.015, 7 ], [ 'carachi', 0.1, 7 ], [ 'pejerrey', 0.8, 7 ], [ 'capitan', 0.6, 7 ],
	[ 'rainbowTrout', 1.5, 7 ], [ 'rainbowTrout', 3.5, 7 ], [ 'brownTrout', 4, 7 ], [ 'carp', 3, 7 ], [ 'carp', 10, 7 ], [ 'carp', 10, 13 ],
	[ 'jack', 6, 7 ], [ 'grouper', 15, 13 ], [ 'tuna', 13, 13 ], [ 'tuna', 13, 26 ], [ 'tarpon', 35, 7 ], [ 'tarpon', 35, 50 ],
];
const N = 40;
console.log( 'species kg line | ' + Object.keys( players ).map( ( p ) => p.padEnd( 30 ) ).join( ' | ' ) );
for ( const [ sp, kg, line ] of cases ) {

	const row = Object.keys( players ).map( ( p ) => {

		const out = {}; let t = 0;
		for ( let k = 0; k < N; k ++ ) {

			const r = fight( sp, kg, p, line, line >= 26 ? 1.9 : line >= 13 ? 1.5 : 1.1 );
			const key = r.st === 'caught' ? 'ok' : r.cause;
			out[ key ] = ( out[ key ] || 0 ) + 1;
			if ( r.st === 'caught' ) t += r.t;

		}

		const ok = out.ok || 0;
		return ( `${ Math.round( ok / N * 100 ) }% ${ ok ? Math.round( t / ok ) + 's' : '' } ` + Object.entries( out ).filter( ( [ k ] ) => k !== 'ok' ).map( ( [ k, v ] ) => k + ':' + v ).join( ' ' ) ).padEnd( 30 );

	} );
	console.log( `${ sp } ${ kg } ${ line } | ${ row.join( ' | ' ) }` );

}
