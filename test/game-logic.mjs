// Plain-node tests of the fishing game logic (no GPU): bites, the catch fight, inventory, save.
import { FISH, FISH_IDS, fishValue, fishLengthCm } from '../src/game/FishTable.js';
import { habitatAt, pickSpecies, rollWeight, biteDelay } from '../src/game/Bites.js';
import { CatchMinigame } from '../src/game/CatchMinigame.js';
import { GameState, xpFromLog } from '../src/game/GameState.js';
import { gearStats, defaultUpgrades, UPGRADES } from '../src/game/Gear.js';
import { SIZE_CLASSES, sizeClass, classValue, catchXp, difficulty, mapXpMultiplier, xpToNext, totalXpForLevel, levelFromXp,
	LICENSES, LICENSE_SECONDS, CLOCK_HOURS_PER_SECOND, dayPhase, licenseTierOf, activeLicenseTier, licenseSecondsLeft, withLicense, starterLicences, canKeep, releaseReason } from '../src/game/Progression.js';

let fails = 0;
const ok = ( c, msg ) => {

	if ( ! c ) { fails ++; console.log( 'FAIL', msg ); } else console.log( 'ok  ', msg );

};
let seed = 12345;
const rng = () => ( ( seed = ( seed * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );

// ---- habitats and species
const spots = {
	sand: { depth: 0, reefDist: 200, pierDist: 200 },
	shallows: { depth: 1.5, reefDist: 200, pierDist: 80 },
	pier: { depth: 4, reefDist: 150, pierDist: 1 },
	reef: { depth: 5, reefDist: - 10, pierDist: 150 },
	deep: { depth: 40, reefDist: 300, pierDist: 400 },
};
for ( const [ name, s ] of Object.entries( spots ) ) {

	const h = habitatAt( s );
	const counts = {};
	for ( let i = 0; i < 2000; i ++ ) {

		const id = pickSpecies( h, 12, rng );
		if ( id ) counts[ id ] = ( counts[ id ] || 0 ) + 1;

	}

	const top = Object.entries( counts ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 5 ).map( ( [ k, v ] ) => `${ k } ${ ( v / 20 ).toFixed( 0 ) }%` ).join( ', ' );
	console.log( `     ${ name }: delay ~${ biteDelay( h, 12, () => 0.5 ).toFixed( 1 ) } s; ${ top || 'nothing' }` );

}
ok( pickSpecies( habitatAt( spots.sand ), 12, rng ) === null, 'nothing bites on dry sand' );
ok( biteDelay( habitatAt( spots.sand ), 12, rng ) === Infinity, 'no bite delay on sand' );
{

	let deepOnly = 0;
	for ( let i = 0; i < 500; i ++ ) if ( [ 'tuna', 'mahi', 'redSnapper', 'grouper', 'barracuda' ].includes( pickSpecies( habitatAt( spots.deep ), 12, rng ) ) ) deepOnly ++;
	ok( deepOnly === 500, 'deep water gives offshore species only' );
	let reefFish = 0;
	for ( let i = 0; i < 500; i ++ ) if ( FISH[ pickSpecies( habitatAt( spots.reef ), 12, rng ) ].habitat.reef ) reefFish ++;
	ok( reefFish > 400, `the reef gives mostly reef fish (${ reefFish / 5 }%)` );

}
{

	let tarponNight = 0, tarponDay = 0;
	for ( let i = 0; i < 4000; i ++ ) {

		if ( pickSpecies( habitatAt( spots.pier ), 22, rng ) === 'tarpon' ) tarponNight ++;
		if ( pickSpecies( habitatAt( spots.pier ), 12, rng ) === 'tarpon' ) tarponDay ++;

	}

	ok( tarponNight > tarponDay * 2, `tarpon bite at night (${ tarponNight } vs ${ tarponDay } by day)` );

}
for ( const id of FISH_IDS ) {

	const w = rollWeight( id, rng );
	if ( w < FISH[ id ].kg[ 0 ] || w > FISH[ id ].kg[ 1 ] ) ok( false, `weight in range for ${ id }` );

}
ok( fishValue( 'redSnapper', 5 ) > fishValue( 'redSnapper', 2 ), 'bigger fish is worth more' );

// ---- the fight: three players
const policies = {
	careful: ( g ) => g.tension < 0.68 && g.surge < 0.6,
	mash: () => true,
	idle: () => false,
};
const fight = ( species, kg, policy, lineKg = 7, reelSpeed = 1.1 ) => {

	const g = new CatchMinigame( { species, kg, lineKg, reelSpeed, distance: 18, rng } );
	let st = 'fighting';
	for ( let i = 0; i < 60 * 180 && st === 'fighting'; i ++ ) st = g.update( 1 / 60, policy( g ) );
	return { st, t: g.time };

};
const table = {};
for ( const [ species, kg ] of [ [ 'grunt', 0.8 ], [ 'yellowtail', 1.2 ], [ 'jack', 6 ], [ 'redSnapper', 5 ], [ 'tuna', 6 ], [ 'tuna', 13 ], [ 'tarpon', 35 ] ] ) {

	for ( const p of Object.keys( policies ) ) {

		const r = fight( species, kg, policies[ p ] );
		table[ `${ species }/${ p }` ] = r;
		console.log( `     ${ species } ${ kg } kg, ${ p }: ${ r.st } after ${ r.t.toFixed( 1 ) } s` );

	}

}
ok( table[ 'grunt/careful' ].st === 'caught' && table[ 'yellowtail/careful' ].st === 'caught', 'careful reeling lands small fish' );
ok( table[ 'jack/careful' ].st === 'caught', 'careful reeling lands a 6 kg jack on the starter line' );
ok( table[ 'tuna/mash' ].st === 'snapped' && table[ 'tarpon/mash' ].st === 'snapped', 'holding reel on a big fish snaps the line' );
ok( table[ 'tuna/careful' ].st !== 'caught' && fight( 'tuna', 13, policies.careful, 26, 1.6 ).st === 'caught', 'a 13 kg tuna needs the 30 lb line' );
ok( [ 'escaped' ].includes( table[ 'grunt/idle' ].st ), 'never reeling loses the fish' );
ok( fight( 'tarpon', 35, policies.careful ).st !== 'caught', 'a 35 kg tarpon beats the starter line' );
ok( fight( 'tarpon', 35, policies.careful, 50, 2.2 ).st === 'caught', 'the top line and reel land it' );

// ---- inventory, wallet, save round trip
const mem = new Map();
const storage = { getItem: ( k ) => mem.get( k ) ?? null, setItem: ( k, v ) => mem.set( k, v ) };
const s = new GameState( storage );
s.licences = { 3: 1e9 }; // every licence: these tests are about the cooler, not licences
ok( s.stats.holdKg === 30, 'cooler holds 30 kg' );
const a = s.addFish( 'grunt', 0.84, 9.5 );
const b = s.addFish( 'yellowtail', 1.31, 10 );
ok( a && b && s.inventory.length === 2, 'fish go into the cooler' );
ok( s.addFish( 'tarpon', 40, 22 ) === null && s.log.tarpon.count === 1, 'a fish too big for the hold is logged but not kept' );
const value = s.holdValue;
const sale = s.sell( [ a.id ] );
ok( sale.count === 1 && s.money === a.value && s.inventory.length === 1, 'selling one fish pays for it' );
s.upgrades.hold = 1;
const s2 = new GameState( storage );
s.save();
ok( s2.load() && s2.money === s.money && s2.inventory.length === 1 && s2.log.grunt.bestKg === 0.84 && s2.stats.holdKg === 70, 'save / load round trip' );
ok( s2.addFish( 'grunt', 0.5 ).id > b.id, 'ids keep counting after a load' );
// ---- lengths and the catch card's record logic
{

	let sane = true;
	for ( const id of FISH_IDS ) {

		const f = FISH[ id ];
		const lo = fishLengthCm( id, f.kg[ 0 ] ), hi = fishLengthCm( id, f.kg[ 1 ] );
		if ( ! ( lo > 5 && hi < 200 && hi > lo && typeof f.sci === 'string' ) ) sane = false;

	}

	ok( sane, 'every species has a scientific name and a plausible, increasing length (5–200 cm)' );
	ok( Math.abs( fishLengthCm( 'mahi', 10 ) - 108 ) < 3 && Math.abs( fishLengthCm( 'grunt', 0.84 ) - 36 ) < 2, 'length-weight: a 10 kg mahi ~108 cm, a 0.84 kg grunt ~36 cm' );
	const m = new Map();
	const st = new GameState( { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) } );
	st.licences = { 3: 1e9 };
	const c1 = st.addFish( 'jack', 3.2 ), i1 = st.lastCatch;
	ok( c1 && i1.newSpecies && ! i1.record && c1.cm === i1.cm && i1.cm > 50, 'first of a species: new species, not a record, length stored' );
	st.addFish( 'jack', 2.1 );
	const i2 = st.lastCatch;
	ok( ! i2.newSpecies && ! i2.record && i2.prevBestKg === 3.2 && st.log.jack.bestKg === 3.2, 'a smaller one: no record, best unchanged' );
	st.addFish( 'jack', 4.05 );
	const i3 = st.lastCatch;
	ok( i3.record && i3.prevBestKg === 3.2 && i3.prevBestCm === i1.cm && st.log.jack.bestKg === 4.05 && st.log.jack.bestCm === i3.cm, 'a bigger one: new record, previous best reported, log updated' );
	st.addFish( 'tarpon', 40 );
	ok( st.lastCatch.kept === false && st.lastCatch.newSpecies, 'a fish that does not fit: logged, card says released' );
	// a save from before lengths: inventory and log get lengths on load
	const old = { v: 1, money: 5, inventory: [ { id: 1, species: 'grunt', kg: 0.84, value: 6, caughtAt: 9 } ], log: { grunt: { count: 1, bestKg: 0.84 } }, upgrades: {}, fuel: null, nextId: 2 };
	const st2 = new GameState( { getItem: () => JSON.stringify( old ), setItem: () => {} } );
	ok( st2.load() && st2.inventory[ 0 ].cm === 36 && st2.log.grunt.bestCm === 36, 'old saves load with lengths filled in' );

}
ok( new GameState( { getItem: () => { throw new Error( 'blocked' ); }, setItem: () => { throw new Error( 'blocked' ); } } ).load() === false, 'blocked storage does not throw' );
ok( s.spend( 1e9 ) === false, 'cannot spend more than you have' );
ok( Object.keys( defaultUpgrades() ).length === Object.keys( UPGRADES ).length && gearStats( defaultUpgrades() ).finder === false, 'gear stats' );
{

	const m = new Map();
	const st = new GameState( { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) } );
	st.money = 100;
	ok( st.buy( 'reel' ) && st.upgrades.reel === 1 && st.money === 10 && st.stats.reelSpeed === 1.6, 'buying the reel upgrade' );
	ok( st.buy( 'reel' ) === null && st.upgrades.reel === 1, 'cannot buy what you cannot afford' );
	ok( st.fuelL === 40 && st.burn( 30 ) === 10 && st.refuelCost() === 45, 'fuel burns and costs to refill' );
	st.money = 20;
	ok( st.refuel() === 13 && st.money === 0 && Math.abs( st.fuelL - 23 ) < 1e-6, 'refuel stops when the money runs out' );
	st.money = 1000;
	ok( st.buy( 'fuel' ) && st.fuelL === 80, 'a new tank comes full' );
	ok( st.buy( 'fishFinder' ) && st.stats.finder === true && st.buy( 'fishFinder' ) === null, 'fish finder: one level' );

}

// ---- Phase 1 progression rules (src/game/Progression.js, docs/DISENO.md)
{

	// size classes by position in the species' weight range (grunt: 0.3–1.2 kg)
	ok( sizeClass( 'grunt', 0.3 ).id === 'juvenile' && sizeClass( 'grunt', 0.43 ).id === 'juvenile', 'class: the lightest 15 % are juveniles' );
	ok( sizeClass( 'grunt', 0.5 ).id === 'common' && sizeClass( 'grunt', 0.92 ).id === 'common', 'class: up to 70 % are common' );
	ok( sizeClass( 'grunt', 1.0 ).id === 'trophy' && sizeClass( 'grunt', 1.12 ).id === 'trophy', 'class: up to 92 % are trophies' );
	ok( sizeClass( 'grunt', 1.15 ).id === 'unique' && sizeClass( 'grunt', 5 ).id === 'unique', 'class: the last 8 % (and beyond) are unique' );
	ok( sizeClass( 'grunt', 0.01 ).id === 'juvenile', 'class: below the range is still a juvenile' );
	// class frequencies with the game's own weight distribution: ~42 / 43 / 11 / 4 %
	const cnt = {};
	let n = 0;
	for ( const id of FISH_IDS ) for ( let i = 0; i < 1500; i ++ ) { const c = sizeClass( id, rollWeight( id, rng ) ).id; cnt[ c ] = ( cnt[ c ] || 0 ) + 1; n ++; }
	const pct = ( c ) => cnt[ c ] / n * 100;
	ok( Math.abs( pct( 'juvenile' ) - 42 ) < 3 && Math.abs( pct( 'common' ) - 43 ) < 3 && Math.abs( pct( 'trophy' ) - 11 ) < 2 && Math.abs( pct( 'unique' ) - 4 ) < 1.5,
		`class frequencies ${ SIZE_CLASSES.map( ( c ) => `${ c.id } ${ pct( c.id ).toFixed( 1 ) }%` ).join( ', ' ) }` );

	// value: price × kg × class multiplier, juveniles worth nothing
	ok( classValue( 'grunt', 0.35 ) === 0, 'value: juveniles are worth $0' );
	ok( classValue( 'grunt', 0.8 ) === Math.round( 7 * 0.8 ) && classValue( 'grunt', 1.0 ) === Math.round( 7 * 1.0 * 1.5 ) && classValue( 'grunt', 1.2 ) === Math.round( 7 * 1.2 * 3 ), 'value: common ×1, trophy ×1.5, unique ×3' );

	// XP: ( class XP × difficulty + 3/kg + 20 if new ) × map multiplier
	ok( Math.abs( difficulty( 'grunt' ) - 1.5 ) < 1e-9 && Math.abs( difficulty( 'tarpon' ) - 3 ) < 1e-9, 'XP: difficulty 1 + 2 × fight' );
	ok( catchXp( 'grunt', 0.8 ) === Math.round( 3 * 1.5 + 3 * 0.8 ), 'XP: a common grunt' );
	ok( catchXp( 'grunt', 0.8, { newSpecies: true } ) === Math.round( 3 * 1.5 + 3 * 0.8 + 20 ), 'XP: +20 for a new species' );
	ok( catchXp( 'grunt', 0.35 ) >= 1, 'XP: juveniles still give XP' );
	ok( Math.abs( mapXpMultiplier( 5 ) - 3.0517578125 ) < 1e-9 && catchXp( 'grunt', 0.8, { mapIndex: 1 } ) === Math.round( ( 3 * 1.5 + 3 * 0.8 ) * 1.25 ), 'XP: ×1.25 per map along the chain' );

	// levels: 600 × 1.03^(N − 1) to go from N to N + 1
	ok( xpToNext( 1 ) === 600 && xpToNext( 2 ) === 618 && xpToNext( 10 ) === Math.round( 600 * 1.03 ** 9 ), 'levels: XP to the next level' );
	ok( Math.abs( totalXpForLevel( 10 ) - 6095 ) < 15 && Math.abs( totalXpForLevel( 60 ) - 94400 ) < 300, `levels: level 10 at ${ totalXpForLevel( 10 ) } XP, level 60 at ${ totalXpForLevel( 60 ) } XP` );
	ok( levelFromXp( 0 ).level === 1 && levelFromXp( 599 ).level === 1 && levelFromXp( 600 ).level === 2 && levelFromXp( 600 ).into === 0, 'levels: thresholds' );
	let roundTrip = true;
	for ( const L of [ 1, 2, 7, 23, 60, 100 ] ) if ( levelFromXp( totalXpForLevel( L ) ).level !== L || levelFromXp( totalXpForLevel( L ) - 1 ).level !== Math.max( 1, L - 1 ) ) roundTrip = false;
	ok( roundTrip, 'levels: total XP and level agree (no cap)' );

	// licences: tiers per species, cumulative, one game day of played time, extendable
	ok( FISH_IDS.every( ( id ) => [ 1, 2, 3 ].includes( licenseTierOf( id ) ) ), 'licences: every island species has a tier' );
	ok( licenseTierOf( 'grunt' ) === 1 && licenseTierOf( 'yellowtail' ) === 2 && licenseTierOf( 'tuna' ) === 3 && licenseTierOf( 'tarpon' ) === 3, 'licences: tiers follow D14' );
	ok( LICENSES[ 2 ].minLevel === 4 && LICENSES[ 3 ].minLevel === 7 && LICENSES[ 1 ].price < LICENSES[ 2 ].price && LICENSES[ 2 ].price < LICENSES[ 3 ].price, 'licences: levels 4 and 7, rising prices' );
	const start = starterLicences();
	ok( activeLicenseTier( start, 0 ) === 1 && activeLicenseTier( start, LICENSE_SECONDS - 1 ) === 1 && activeLicenseTier( start, LICENSE_SECONDS ) === 0, 'licences: the free basic one lasts one game day (24 min played)' );
	let lic = withLicense( start, 3, 100 );
	ok( activeLicenseTier( lic, 200 ) === 3 && licenseSecondsLeft( lic, 200 ) === 100 + LICENSE_SECONDS - 200, 'licences: the highest running tier counts' );
	lic = withLicense( lic, 3, 500 );
	ok( lic[ 3 ] === 100 + 2 * LICENSE_SECONDS, 'licences: buying again while it runs adds another day' );
	ok( withLicense( { 2: 50 }, 2, 1000 )[ 2 ] === 1000 + LICENSE_SECONDS, 'licences: an expired one starts again from now' );

	// keeping a catch
	ok( canKeep( 'grunt', 0.8, 1 ) && ! canKeep( 'yellowtail', 1.0, 1 ) && canKeep( 'yellowtail', 1.0, 2 ) && canKeep( 'grunt', 0.8, 3 ), 'keep: needs the tier or higher (cumulative)' );
	ok( ! canKeep( 'grunt', 0.35, 3 ) && releaseReason( 'grunt', 0.35, 3 ) === 'juvenile', 'keep: juveniles always go back' );
	ok( releaseReason( 'tuna', 8, 2 ) === 'license' && releaseReason( 'tuna', 8, 3 ) === null, 'keep: release reason' );
	FISH.grunt.protected = true;
	ok( ! canKeep( 'grunt', 0.8, 3 ) && releaseReason( 'grunt', 0.8, 3 ) === 'protected' && classValue( 'grunt', 0.8 ) === 0, 'keep: protected species are catch and release only' );
	delete FISH.grunt.protected;

}
// ---- save version 2 (D20, D44): XP, licences, played time; global vs per-map data; conversion of version 1
{

	const store = () => {

		const m = new Map();
		return { m, getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) };

	};

	// a new game
	const st = new GameState( store() );
	ok( st.xp === 0 && st.level === 1 && st.playedSeconds === 0 && st.mapId === 'island', 'v2: a new game starts at level 1 on the island' );
	ok( st.licenseTier === 1 && st.licenseSecondsLeft === LICENSE_SECONDS, 'v2: a new game has the free basic licence for one day' );

	// XP and level ups
	ok( st.addXp( 599 ) === 0 && st.level === 1 && st.addXp( 1 ) === 1 && st.level === 2, 'v2: XP adds up and reports level ups' );
	ok( st.addXp( totalXpForLevel( 7 ) - st.xp ) === 5 && st.level === 7, 'v2: several levels at once' );

	// played time and licence expiry
	st.addPlayed( 0.5 ); st.addPlayed( - 3 ); st.addPlayed( NaN ); st.addPlayed( 30 );
	ok( Math.abs( st.playedSeconds - 1.5 ) < 1e-9, 'v2: played time adds frame times, ignores bad ones and caps stalls at 1 s' );
	for ( let i = 0; i < LICENSE_SECONDS; i ++ ) st.addPlayed( 1 );
	ok( st.licenseTier === 0 && st.licenseSecondsLeft === 0, 'v2: the basic licence runs out after a day of play' );

	// buying licences: level and money checks
	const lv = new GameState( store() );
	lv.money = 1000;
	ok( lv.licenseBlock( 2 ) === 'level' && ! lv.buyLicense( 2 ) && lv.money === 1000, 'v2: the intermediate licence needs level 4' );
	lv.addXp( totalXpForLevel( 4 ) );
	ok( lv.buyLicense( 2 ) && lv.money === 900 && lv.licenseTier === 2, 'v2: buying the intermediate licence' );
	lv.money = 50;
	ok( lv.licenseBlock( 1 ) === null && lv.licenseBlock( 3 ) === 'level', 'v2: blocks by level before money' );
	lv.addXp( totalXpForLevel( 7 ) );
	ok( lv.licenseBlock( 3 ) === 'money' && ! lv.buyLicense( 3 ), 'v2: cannot buy a licence without the money' );

	// round trip
	const sto = store();
	const a = new GameState( sto );
	a.money = 321; a.addXp( 1234 ); a.addPlayed( 0.75 ); a.addFish( 'grunt', 0.8 ); a.money = 500; a.buyLicense( 1 );
	a.save();
	const b = new GameState( sto );
	ok( b.load() && b.money === a.money && b.xp === a.xp && b.xp > 1234 && b.playedSeconds === 0.75 && b.inventory.length === 1 && b.log.grunt.count === 1
		&& b.licences[ 1 ] === a.licences[ 1 ], 'v2: save / load round trip keeps XP, played time, log and licences' );
	ok( JSON.parse( sto.m.get( 'tidewater.save.v2' ) ).maps.island.log.grunt.count === 1 && ! sto.m.has( 'tidewater.save.v1' ), 'v2: written under its own key, log stored per map' );

	// played time is saved every few seconds, not every frame
	const ps = store(), p = new GameState( ps );
	p.save();
	for ( let i = 0; i < 60; i ++ ) p.addPlayed( 1 / 60 );
	const saved1 = JSON.parse( ps.m.get( 'tidewater.save.v2' ) ).playedSeconds;
	for ( let i = 0; i < 600; i ++ ) p.addPlayed( 1 / 60 );
	ok( saved1 === 0 && JSON.parse( ps.m.get( 'tidewater.save.v2' ) ).playedSeconds >= 10, 'v2: played time is saved every 10 s of play' );

	// per-map data: log and licences belong to each map; money, XP, gear travel
	const mp = new GameState( store() );
	mp.money = 77; mp.addXp( 900 ); mp.addFish( 'jack', 3 );
	const mpXp = mp.xp;
	mp.mapId = 'lake';
	ok( Object.keys( mp.log ).length === 0 && mp.licenseTier === 1 && mp.money === 77 && mp.xp === mpXp, 'v2: a new map has its own empty log and basic licence; money and XP travel' );
	mp.mapId = 'island';
	ok( mp.log.jack.count === 1, 'v2: back on the first map, its log is still there' );

	// conversion of a version 1 save (D44): nothing is lost, starting XP from the log
	const v1 = { v: 1, money: 640, inventory: [ { id: 4, species: 'grunt', kg: 0.84, value: 6, caughtAt: 9 } ],
		log: { grunt: { count: 12, bestKg: 1.1 }, tuna: { count: 2, bestKg: 9.5, bestCm: 85 }, nope: { count: 3, bestKg: 1 } },
		upgrades: { line: 2, hold: 1 }, fuel: 12, nextId: 9 };
	const cs = store();
	cs.m.set( 'tidewater.save.v1', JSON.stringify( v1 ) );
	const c = new GameState( cs );
	const expectXp = xpFromLog( { grunt: v1.log.grunt, tuna: v1.log.tuna } );
	ok( c.load() && c.money === 640 && c.inventory.length === 1 && c.inventory[ 0 ].cm === 36 && c.upgrades.line === 2 && c.upgrades.hold === 1
		&& c.fuel === 12 && c.log.grunt.count === 12 && c.log.tuna.bestKg === 9.5, 'v1 -> v2: money, cooler, gear, fuel and log are kept' );
	ok( c.xp === expectXp && c.xp > 0 && c.level >= 1, `v1 -> v2: starting XP from the log (${ c.xp } XP, level ${ c.level })` );
	ok( xpFromLog( { tuna: { count: 1, bestKg: 9.5 } } ) === catchXp( 'tuna', 9.5, { newSpecies: true } ), 'v1 -> v2: the best fish counts with its real weight and the new species bonus' );
	ok( c.licenseTier === 1 && c.playedSeconds === 0 && c.addFish( 'grunt', 0.5 ).id >= 9, 'v1 -> v2: basic licence, played time from zero, ids keep counting' );
	ok( cs.m.has( 'tidewater.save.v2' ) && cs.m.get( 'tidewater.save.v1' ) === JSON.stringify( v1 ), 'v1 -> v2: written as v2, the old save is left untouched' );
	const again = new GameState( cs );
	ok( again.load() && again.xp === c.xp && again.log.grunt.count === 13, 'v1 -> v2: the next load reads v2, not the old save' );

	// bad data
	const bad = store();
	bad.m.set( 'tidewater.save.v2', JSON.stringify( { v: 2, money: 'x', xp: - 5, playedSeconds: null, maps: { island: { log: null, licences: { 1: 'a', 9: 5, 2: 300 } } } } ) );
	const bd = new GameState( bad );
	ok( bd.load() && bd.money === 0 && bd.xp === 0 && bd.playedSeconds === 0 && Object.keys( bd.licences ).join() === '2' && bd.licenseTier === 2, 'v2: bad values are cleaned on load' );
	ok( new GameState( { getItem: () => '{"v":3}', setItem: () => {} } ).load() === false, 'v2: an unknown version is not loaded' );
	const rs = new GameState( store() );
	rs.addXp( 5000 ); rs.mapId = 'lake'; rs.reset();
	ok( rs.xp === 0 && rs.mapId === 'island' && Object.keys( rs.maps ).join() === 'island' && rs.licenseTier === 1, 'v2: reset starts over' );

}
// ---- catches under the Phase 1 rules (delivery 3): class value, XP, release reasons
{

	const m = new Map();
	const st = new GameState( { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) } );
	const e1 = st.addFish( 'grunt', 0.8 ), c1 = st.lastCatch;
	ok( e1 && c1.kept && c1.reason === null && c1.cls === 'common' && e1.cls === 'common' && c1.value === classValue( 'grunt', 0.8 ) && e1.value === c1.value,
		'catch: a common grunt with the basic licence goes in the cooler at its class value' );
	ok( c1.xp === catchXp( 'grunt', 0.8, { newSpecies: true } ) && st.xp === c1.xp, 'catch: XP with the new species bonus' );
	st.addFish( 'grunt', 0.8 );
	ok( st.lastCatch.xp === catchXp( 'grunt', 0.8 ), 'catch: no bonus the second time' );
	const n = st.inventory.length;
	ok( st.addFish( 'grunt', 0.35 ) === null && st.lastCatch.reason === 'juvenile' && st.lastCatch.xp > 0 && st.inventory.length === n, 'catch: a juvenile goes back but gives XP' );
	ok( st.addFish( 'yellowtail', 1.2 ) === null && st.lastCatch.reason === 'license' && st.lastCatch.tier === 2 && st.log.yellowtail.count === 1, 'catch: without its licence it goes back, is logged and gives XP (D13)' );
	st.licences = { 2: 1e9 };
	ok( st.addFish( 'yellowtail', 1.2 ) && st.lastCatch.kept, 'catch: with the intermediate licence it is kept' );
	FISH.grunt.protected = true;
	ok( st.addFish( 'grunt', 0.9 ) === null && st.lastCatch.reason === 'protected', 'catch: protected species always go back' );
	delete FISH.grunt.protected;
	st.licences = { 3: 1e9 };
	ok( st.addFish( 'tarpon', 40 ) === null && st.lastCatch.reason === 'full', 'catch: a full cooler is the last reason' );
	const lv = new GameState( { getItem: () => null, setItem: () => {} } );
	lv.xp = 599;
	lv.addFish( 'grunt', 0.8 );
	ok( lv.lastCatch.levelUp === 1 && lv.lastCatch.level === 2, 'catch: reports a level up' );

}
// ---- game clock (delivery 4: D16, D22, D42)
{

	ok( Math.abs( CLOCK_HOURS_PER_SECOND * LICENSE_SECONDS - 24 ) < 1e-9 && Math.abs( CLOCK_HOURS_PER_SECOND * 60 - 1 ) < 1e-9, 'clock: one game hour per real minute, a day = a licence' );
	ok( dayPhase( 6.5 ) === 'dawn' && dayPhase( 12 ) === 'day' && dayPhase( 18.5 ) === 'dusk' && dayPhase( 23 ) === 'night' && dayPhase( 2 ) === 'night' && dayPhase( 26 ) === 'night', 'clock: parts of the day' );
	const m = new Map(), sto = { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) };
	const a = new GameState( sto );
	ok( a.hour === null, 'clock: a new game has no saved hour (the world default is used)' );
	a.hour = 21.25; a.save();
	const b = new GameState( sto );
	ok( b.load() && b.hour === 21.25, 'clock: the hour is saved and loaded' );
	m.set( 'tidewater.save.v2', JSON.stringify( { ...JSON.parse( m.get( 'tidewater.save.v2' ) ), hour: 25.5 } ) );
	const c = new GameState( sto );
	ok( c.load() && c.hour === 1.5, 'clock: a saved hour is wrapped to 0..24' );

}
console.log( `value check ${ value }` );
console.log( fails ? `${ fails } FAILED` : 'all passed' );
process.exit( fails ? 1 : 0 );
