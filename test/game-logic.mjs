// Plain-node tests of the fishing game logic (no GPU): bites, the catch fight, inventory, save.
import { FISH, FISH_IDS, fishValue, fishLengthCm } from '../src/game/FishTable.js';
import { habitatAt, pickSpecies, rollWeight, biteDelay, biteDelayFor, nibbleOutcome, strikeOutcome, lureHitOutcome, HOOKING, biteMulHere } from '../src/game/Bites.js';
import { starterTackle, tackleFromGrade, cleanTackle, count as tbCount, rigCastable, rigIssues, PACKS, packCost, packFullPrice, goodFor } from '../src/game/TackleBag.js';
import { licensePrice, withLicense as withLicenseDays } from '../src/game/Progression.js';
import { renderEquipment, rigChipText } from '../src/game/EquipPanel.js';
import { POWERS, RODS, REELS, LINES, HOOKS, BAITS, LURES, PREFS, STARTER_RIG, rigStats, rigProblems, rigReady, biteMul, hookTooSmall, fightTackle, gradeRig, GRADE_RIGS } from '../src/game/Tackle.js';
import { catalogEntry } from '../src/maps/catalog.js';
import { CatchMinigame } from '../src/game/CatchMinigame.js';
import { GameState, xpFromLog } from '../src/game/GameState.js';
import { ISLAND_SPOTS, spotOf, spotById } from '../src/game/Spots.js';
import { Profiles, MAX_PROFILES, INDEX_KEY } from '../src/game/Profiles.js';
import { MAPS, DEFAULT_MAP, activeMap, mapById, currentMapId } from '../src/maps/registry.js';
const LAKE_MAP = MAPS.lake || ( Array.isArray( MAPS ) ? MAPS.find( ( m ) => m.id === 'lake' ) : null );
import { travelOptions, travelBlock, travel, travelCost } from '../src/game/Travel.js';
import { WORLD } from '../src/world/WorldLayout.js';
import { gearStats, defaultUpgrades, UPGRADES, convertLegacyUpgrades } from '../src/game/Gear.js';
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

// ---- the fight (D62): drag, reel, fast reel, pull, the rod against the run, jumps, snags
const lineCapOf = ( lineKg ) => 120 + lineKg * 3;
const policies = {
	// reels when the spool isn't slipping, pulls on holds and dives, lets go in jumps, rod against the run, works the drag
	good: ( g ) => {

		if ( g.tension > 0.8 && g.drag > 2 ) g.setDrag( g.drag - 1 );
		else if ( g.tension < 0.3 && ! g.slipping && g.drag < 7 ) g.setDrag( g.drag + 1 );
		return { reel: ! g.slipping || g.mode === 'come', fast: g.mode === 'come', pull: g.mode === 'dive' || g.mode === 'hold', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	},
	lazy: () => ( { reel: true } ),
	tight: ( g ) => ( g.setDrag( 10 ), { reel: ! g.slipping, pull: g.mode === 'dive' } ),
	idle: () => ( {} ),
	alwaysPull: ( g ) => ( { reel: ! g.slipping, pull: true } ),
	pullButJumps: ( g ) => ( { reel: ! g.slipping, pull: g.mode !== 'jump' } ),
};
const fight = ( species, kg, policy, lineKg = 7, reelSpeed = 1.1 ) => {

	const g = new CatchMinigame( { species, kg, lineKg, reelSpeed, distance: 18, lineCap: lineCapOf( lineKg ), rng } );
	let st = 'fighting';
	for ( let i = 0; i < 60 * 240 && st === 'fighting'; i ++ ) st = g.update( 1 / 60, policy( g ) );
	return { st, cause: g.cause, t: g.time };

};
const runs = ( n, ...a ) => {

	const out = { caught: 0 };
	for ( let k = 0; k < n; k ++ ) {

		const r = fight( ...a );
		const key = r.st === 'caught' ? 'caught' : r.cause || 'timeout';
		out[ key ] = ( out[ key ] || 0 ) + 1;

	}

	return out;

};
for ( const [ sp, kg, pol, line ] of [ [ 'pejerrey', 0.8, 'good', 7 ], [ 'rainbowTrout', 3.5, 'good', 7 ], [ 'carp', 3, 'lazy', 7 ], [ 'carp', 10, 'tight', 7 ], [ 'carp', 10, 'good', 13 ], [ 'tarpon', 35, 'good', 7 ] ] ) console.log( `     ${ sp } ${ kg } kg, ${ line } kg line, ${ pol }:`, JSON.stringify( runs( 12, sp, kg, policies[ pol ], line ) ) );
ok( [ [ 'guapucha', 0.015 ], [ 'pejerrey', 0.8 ], [ 'grunt', 0.8 ], [ 'rainbowTrout', 1.5 ] ].every( ( [ s, k ] ) => runs( 8, s, k, policies.good ).caught === 8 ), 'small fish and a small trout are landed' );
ok( runs( 12, 'rainbowTrout', 3.5, policies.good ).caught >= 11, 'a 3.5 kg trout is landed on the starter line with a good fight' );
ok( runs( 20, 'carp', 3, policies.lazy ).snag > 0, 'never pulling lets a carp reach the weeds (snag)' );
ok( runs( 12, 'carp', 3, policies.good ).caught === 12, 'pulling on its dives lands the carp' );
ok( runs( 12, 'carp', 10, policies.tight ).line >= 10, 'a screwed-down drag on a big fish breaks the line' );
ok( runs( 12, 'carp', 10, policies.good, 13, 1.5 ).caught >= 11, 'a 10 kg carp on the 13 kg line with the drag worked' );
ok( runs( 12, 'tarpon', 35, policies.good ).caught === 0, 'a 35 kg tarpon beats the starter line' );
ok( runs( 12, 'tuna', 13, policies.good, 26, 1.9 ).caught >= 11, 'a 13 kg tuna on the 26 kg line' );
ok( runs( 12, 'grunt', 0.8, policies.idle ).caught === 0, 'never reeling never lands it' );
{

	const always = runs( 30, 'rainbowTrout', 2.5, policies.alwaysPull ), careful = runs( 30, 'rainbowTrout', 2.5, policies.pullButJumps );
	console.log( '     trout jumps: always pulling', JSON.stringify( always ), '| letting go in jumps', JSON.stringify( careful ) );
	ok( ( always.jump || 0 ) > 0 && ! careful.jump, 'a lifted rod in a jump throws the hook; letting go keeps it' );

}
{

	const g = new CatchMinigame( { species: 'carp', kg: 5, lineKg: 13, rng } );
	g.setDrag( 0 ); const lo = g.drag; g.setDrag( 99 ); const hi = g.drag;
	ok( lo === 1 && hi === 10 && Math.abs( g.dragKg - 13 * 0.95 ) < 1e-9, 'the drag has 10 positions up to 95 % of the line' );

}

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
ok( s2.load() && s2.money === s.money && s2.inventory.length === 1 && s2.log.grunt.bestKg === 0.84 && s2.stats.holdKg === 45, 'save / load round trip' );
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
	st.money = 200;
	ok( st.buy( 'rig' ) && st.upgrades.rig === 1 && st.money === 50 && st.stats.reelSpeed === 1.3 && st.stats.lineKg === 10 && st.stats.castM === 25, 'buying float rig grade 1' );
	ok( st.buy( 'rig' ) === null && st.upgrades.rig === 1, 'cannot buy what you cannot afford' );
	ok( st.fuelL === 40 && st.burn( 30 ) === 10 && st.refuelCost() === 45, 'fuel burns and costs to refill' );
	st.money = 20;
	ok( st.refuel() === 13 && st.money === 0 && Math.abs( st.fuelL - 23 ) < 1e-6, 'refuel stops when the money runs out' );
	st.money = 1000;
	ok( st.buy( 'fuel' ) && st.fuelL === 60, 'a new tank comes full' );
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
	for ( const id of FISH_IDS.filter( ( k ) => ! FISH[ k ].classesKg ) ) for ( let i = 0; i < 1500; i ++ ) { const c = sizeClass( id, rollWeight( id, rng ) ).id; cnt[ c ] = ( cnt[ c ] || 0 ) + 1; n ++; }
	const pct = ( c ) => cnt[ c ] / n * 100;
	ok( Math.abs( pct( 'juvenile' ) - 42 ) < 3 && Math.abs( pct( 'common' ) - 43 ) < 3 && Math.abs( pct( 'trophy' ) - 11 ) < 2 && Math.abs( pct( 'unique' ) - 4 ) < 1.5,
		`class frequencies ${ SIZE_CLASSES.map( ( c ) => `${ c.id } ${ pct( c.id ).toFixed( 1 ) }%` ).join( ', ' ) }` );
	// the lake species have their own kg per class (D84): fewer juveniles, trophies and uniques still rare
	const lk = {};
	let ln = 0;
	for ( const id of FISH_IDS.filter( ( k ) => FISH[ k ].classesKg ) ) for ( let i = 0; i < 1500; i ++ ) { const c = sizeClass( id, rollWeight( id, rng ) ).id; lk[ c ] = ( lk[ c ] || 0 ) + 1; ln ++; }
	const lp = ( c ) => lk[ c ] / ln * 100;
	ok( Math.abs( lp( 'juvenile' ) - 25 ) < 5 && Math.abs( lp( 'common' ) - 54 ) < 5 && Math.abs( lp( 'trophy' ) - 16 ) < 4 && lp( 'unique' ) < 7, `class: lake species by kg (D84): ${ [ 'juvenile', 'common', 'trophy', 'unique' ].map( ( c ) => `${ c } ${ lp( c ).toFixed( 1 ) }%` ).join( ', ' ) }` );
	ok( sizeClass( 'rainbowTrout', 1.016 ).id === 'common' && sizeClass( 'rainbowTrout', 0.26 ).id === 'juvenile' && sizeClass( 'rainbowTrout', 3.8 ).id === 'unique', 'class: a 1 kg rainbow trout is common, a 0.26 kg one juvenile (D84)' );

	// value: price × kg × class multiplier, juveniles worth nothing
	ok( classValue( 'grunt', 0.35 ) === 0, 'value: juveniles are worth $0' );
	const gp = 7 * FISH.grunt.hourMul;
	ok( classValue( 'grunt', 0.8 ) === Math.round( gp * 0.8 ) && classValue( 'grunt', 1.0 ) === Math.round( gp * 1.0 * 1.1 ) && classValue( 'grunt', 1.2 ) === Math.round( gp * 1.2 * 1.2 ), 'value: price × hourMul (D75); common ×1, trophy ×1.1, unique ×1.2 (D78)' );

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
	ok( lv.buyLicense( 2 ) && lv.money === 1000 - LICENSES[ 2 ].price && lv.licenseTier === 2, 'v2: buying the intermediate licence' );
	lv.money = LICENSES[ 1 ].price;
	ok( lv.licenseBlock( 1 ) === null && lv.licenseBlock( 3 ) === 'level', 'v2: blocks by level before money' );
	lv.addXp( totalXpForLevel( 7 ) );
	lv.money = LICENSES[ 3 ].price - 1;
	ok( lv.licenseBlock( 3 ) === 'money' && ! lv.buyLicense( 3 ), 'v2: cannot buy a licence without the money' );

	// round trip
	const sto = store();
	const a = new GameState( sto );
	a.money = 321; a.addXp( 1234 ); a.addPlayed( 0.75 ); a.addFish( 'grunt', 0.8 ); a.money = 500; ok( a.buyLicense( 1 ), 'v2: buying the basic licence again' );
	a.save();
	const b = new GameState( sto );
	ok( b.load() && b.money === a.money && b.xp === a.xp && b.xp > 1234 && b.playedSeconds === 0.75 && b.inventory.length === 1 && b.log.grunt.count === 1
		&& b.licences[ 1 ] === a.licences[ 1 ], 'v2: save / load round trip keeps XP, played time, log and licences' );
	ok( JSON.parse( sto.m.get( 'tidewater.save.v3' ) ).maps.island.log.grunt.count === 1 && ! sto.m.has( 'tidewater.save.v1' ), 'v3: written under its own key, log stored per map' );

	// played time is saved every few seconds, not every frame
	const ps = store(), p = new GameState( ps );
	p.save();
	for ( let i = 0; i < 60; i ++ ) p.addPlayed( 1 / 60 );
	const saved1 = JSON.parse( ps.m.get( 'tidewater.save.v3' ) ).playedSeconds;
	for ( let i = 0; i < 600; i ++ ) p.addPlayed( 1 / 60 );
	ok( saved1 === 0 && JSON.parse( ps.m.get( 'tidewater.save.v3' ) ).playedSeconds >= 10, 'v2: played time is saved every 10 s of play' );

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
	ok( c.load() && c.money === 640 + 90 && c.inventory.length === 1 && c.inventory[ 0 ].cm === 36 && c.upgrades.rig === 1 && c.stats.holdKg === 80
		&& c.fuel === 12 && c.log.grunt.count === 12 && c.log.tuna.bestKg === 9.5, 'v1 -> v3: money, cooler, fuel and log kept; gear converted (30 lb line -> rig 1 + $90, 70 kg -> 80 kg)' );
	ok( c.xp === expectXp && c.xp > 0 && c.level >= 1, `v1 -> v2: starting XP from the log (${ c.xp } XP, level ${ c.level })` );
	ok( xpFromLog( { tuna: { count: 1, bestKg: 9.5 } } ) === catchXp( 'tuna', 9.5, { newSpecies: true } ), 'v1 -> v2: the best fish counts with its real weight and the new species bonus' );
	ok( c.licenseTier === 1 && c.playedSeconds === 0 && c.addFish( 'grunt', 0.5 ).id >= 9, 'v1 -> v2: basic licence, played time from zero, ids keep counting' );
	ok( cs.m.has( 'tidewater.save.v3' ) && cs.m.get( 'tidewater.save.v1' ) === JSON.stringify( v1 ), 'v1 -> v3: written as v3, the old save is left untouched' );
	const again = new GameState( cs );
	ok( again.load() && again.xp === c.xp && again.log.grunt.count === 13 && again.money === c.money, 'v1 -> v3: the next load reads v3, not the old save (no second refund)' );

	// bad data
	const bad = store();
	bad.m.set( 'tidewater.save.v3', JSON.stringify( { v: 3, money: 'x', xp: - 5, playedSeconds: null, maps: { island: { log: null, licences: { 1: 'a', 9: 5, 2: 300 } } } } ) );
	const bd = new GameState( bad );
	ok( bd.load() && bd.money === 0 && bd.xp === 0 && bd.playedSeconds === 0 && Object.keys( bd.licences ).join() === '2' && bd.licenseTier === 2, 'v2: bad values are cleaned on load' );
	ok( new GameState( { getItem: () => '{"v":4}', setItem: () => {} } ).load() === false, 'v3: an unknown version is not loaded' );
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

	ok( Math.abs( CLOCK_HOURS_PER_SECOND * LICENSE_SECONDS - 24 ) < 1e-9 && Math.abs( CLOCK_HOURS_PER_SECOND * 300 - 1 ) < 1e-9, 'clock: one game hour every 5 real minutes, a day = a licence (D47)' );
	ok( dayPhase( 6.5 ) === 'dawn' && dayPhase( 12 ) === 'day' && dayPhase( 18.5 ) === 'dusk' && dayPhase( 23 ) === 'night' && dayPhase( 2 ) === 'night' && dayPhase( 26 ) === 'night', 'clock: parts of the day' );
	const m = new Map(), sto = { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) };
	const a = new GameState( sto );
	ok( a.hour === null, 'clock: a new game has no saved hour (the world default is used)' );
	a.hour = 21.25; a.save();
	const b = new GameState( sto );
	ok( b.load() && b.hour === 21.25, 'clock: the hour is saved and loaded' );
	m.set( 'tidewater.save.v3', JSON.stringify( { ...JSON.parse( m.get( 'tidewater.save.v3' ) ), hour: 25.5 } ) );
	const c = new GameState( sto );
	ok( c.load() && c.hour === 1.5, 'clock: a saved hour is wrapped to 0..24' );

}
// ---- named spots (delivery 5: D9, D40): the dominant water type under the bobber
{

	const at = ( depth, reefDist = 200, pierDist = 200 ) => spotOf( habitatAt( { depth, reefDist, pierDist } ) );
	ok( ISLAND_SPOTS.length === 5 && ISLAND_SPOTS.every( ( s ) => s.name && Number.isFinite( s.label.x ) ), 'spots: five, named, with a place on the map' );
	ok( at( 0.1 ) === null, 'spots: none on the sand' );
	ok( at( 1.5, 200, 80 ).id === 'shallows' && at( 4, 150, 1 ).id === 'pier' && at( 5, - 10, 150 ).id === 'reef', 'spots: beach, pier and reef' );
	ok( at( 10 ).id === 'bay' && at( 40 ).id === 'deep' && spotById( 'deep' ) === at( 60 ), 'spots: mid-bay and open sea' );

}
// ---- Phase 1 shop (delivery 6: D37, D39, D43, D44)
{

	const total = Object.values( UPGRADES ).reduce( ( s, u ) => s + u.levels.reduce( ( a, l ) => a + l.cost, 0 ), 0 );
	ok( total === 8550 && UPGRADES.rig.levels.length === 7 && UPGRADES.hold.levels.length === 7, 'shop: six rig and hold grades, $8,550 in all' );
	const g0 = gearStats( defaultUpgrades() ), g6 = gearStats( { ...defaultUpgrades(), rig: 6 } );
	ok( g0.lineKg === 7 && g0.castM === 22 && g0.reelSpeed === 1.1 && g0.holdKg === 30, 'shop: grade 0 is the old starting gear' );
	ok( g6.lineKg === 50 && g6.castM === 48 && g6.reelSpeed === 2.3, 'shop: grade 6 matches or beats the old best gear' );
	let up = true;
	for ( const u of Object.values( UPGRADES ) ) for ( let i = 1; i < u.levels.length; i ++ ) if ( ! ( u.levels[ i ].cost > 0 ) ) up = false;
	ok( up, 'shop: every level above the first costs money' );
	// conversion of the old tracks (D44)
	const none = convertLegacyUpgrades( {} );
	ok( none.refund === 0 && Object.values( none.upgrades ).every( ( v ) => v === 0 ), 'convert: no upgrades -> starting gear, nothing back' );
	const all = convertLegacyUpgrades( { line: 3, reel: 2, rod: 2, hold: 2, fuel: 2, engine: 2, fishFinder: 1, lights: 1 } );
	ok( all.spent === 1435 && all.upgrades.rig === 5 && all.refund === 185, 'convert: all old rod gear ($1,435) -> rig grade 5 + $185 back' );
	ok( all.upgrades.hold === 6 && all.upgrades.fuel === 4 && all.upgrades.engine === 3 && all.upgrades.fishFinder === 1 && all.upgrades.lights === 1, 'convert: 160 kg -> 180 kg hold, 150 L tank, ×1.3 engine, finder and lights kept' );
	const mid = convertLegacyUpgrades( { reel: 1, hold: 1, fuel: 1, engine: 1 } );
	ok( mid.upgrades.rig === 0 && mid.refund === 90 && mid.upgrades.hold === 3 && mid.upgrades.fuel === 2 && mid.upgrades.engine === 2, 'convert: under the first grade it all comes back; 70 kg -> 80 kg, 80 L -> 80 L, ×1.15 -> ×1.2' );
	// a v2 save converts once, with the refund
	const m = new Map(), sto = { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) };
	m.set( 'tidewater.save.v2', JSON.stringify( { v: 2, money: 100, xp: 50, playedSeconds: 30, upgrades: { line: 1, rod: 1 }, inventory: [], map: 'island', maps: { island: { log: {}, licences: { 1: 999 } } } } ) );
	const st = new GameState( sto );
	ok( st.load() && st.upgrades.rig === 0 && st.money === 235 && st.gearConverted.refund === 135 && st.xp === 50 && st.licences[ 1 ] === 999, 'convert: a v2 save keeps XP and licences; $135 of line and rod comes back' );
	m.set( 'tidewater.save.v2', JSON.stringify( { v: 2, money: 0, upgrades: { line: 2, rod: 1 }, maps: {} } ) );
	const st2 = new GameState( sto );
	ok( st2.load() && st2.money === 235 && ! st2.gearConverted, 'convert: once written as v3, the old save is not read again' );

}
// ---- save profiles
{

	const m = new Map(), sto = { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ), removeItem: ( k ) => m.delete( k ) };
	m.set( 'tidewater.save.v3', JSON.stringify( { v: 3, money: 77, maps: {} } ) ); // a game from before profiles
	const P = new Profiles( sto );
	ok( P.list.length === 1 && P.active.id === 'p1' && P.saveKey( 'p1' ) === 'tidewater.save.v3' && P.legacy( 'p1' ), 'profiles: the existing game becomes the first profile, same save' );
	const g1 = new GameState( sto, { key: P.saveKey( 'p1' ), legacy: true } );
	ok( g1.load() && g1.money === 77, 'profiles: the first profile loads the old game' );
	const b = P.create( '  Mi   lago  ' );
	ok( b.id === 'p2' && b.name === 'Mi lago' && P.saveKey( 'p2' ) === 'tidewater.save.v3.p2' && ! P.legacy( 'p2' ), 'profiles: a new one gets its own key and a cleaned name' );
	const g2 = new GameState( sto, { key: P.saveKey( 'p2' ), legacy: false } );
	ok( ! g2.load() && g2.money === 0, 'profiles: a new profile starts empty (does not read the old saves)' );
	g2.onSaved = ( s ) => P.touch( 'p2', { level: s.level, money: s.money, played: s.playedSeconds } );
	g2.money = 500; g2.save();
	ok( P.list[ 1 ].summary.money === 500 && P.list[ 1 ].lastPlayed > 0 && m.has( 'tidewater.save.v3.p2' ), 'profiles: saving updates the menu summary' );
	ok( P.create( '' ).name && P.create( 'x' ) && P.create( 'y' ) && P.list.length === MAX_PROFILES && P.create( 'z' ) === null && P.full, 'profiles: five at most' );
	ok( P.setActive( 'p2' ) && new Profiles( sto ).active.id === 'p2', 'profiles: the active one is remembered' );
	const after = P.remove( 'p2' );
	ok( ! m.has( 'tidewater.save.v3.p2' ) && after.id === 'p1' && P.list.length === MAX_PROFILES - 1, 'profiles: deleting removes the save and picks another game' );
	for ( const p of [ ...P.list ] ) P.remove( p.id );
	ok( P.list.length === 1 && P.active.id === 'p6' && ! m.has( 'tidewater.save.v3' ), 'profiles: deleting them all leaves one new game (ids never reused)' );
	m.set( INDEX_KEY, '{broken' );
	ok( new Profiles( sto ).list.length === 1, 'profiles: a broken index starts over with one game' );

}
// ---- map registry (L1, docs/DISENO.md 7d)
{

	const m = activeMap();
	ok( DEFAULT_MAP === 'lake' && currentMapId() === 'island' && m === MAPS.island && mapById( 'nope' ) === null, 'maps: new games start on the lake; in Node the island is active (tests and tools measure it)' );
	ok( WORLD === m.layout && WORLD.pier.x === 55 && WORLD.reef.radius === 58, 'maps: the world layout is the one of the active map' );
	ok( m.species.length === 18 && m.species.every( ( id ) => FISH[ id ] ), 'maps: the island lists its 18 species' );
	ok( LICENSES === m.licenses && LICENSES[ 2 ].price === 500 && ISLAND_SPOTS === m.spots, 'maps: licences and spots come from the map' );
	let onlyMap = true;
	for ( let i = 0; i < 400; i ++ ) if ( ! m.species.includes( pickSpecies( habitatAt( { depth: 8, reefDist: 20, pierDist: 30 } ), 12, rng ) ) ) onlyMap = false;
	ok( onlyMap, 'maps: only the species of the map bite' );
	ok( new GameState( { getItem: () => null, setItem: () => {} } ).mapId === 'island', 'maps: a new game is on the active map' );

}
// ---- the lake (L3): registered, its own terrain, a test visit does not move the game
{

	ok( MAPS.lake && MAPS.lake.features.surf === false && MAPS.lake.features.whale === false && MAPS.lake.water.swell === 0, 'lake: registered, calm water, no surf or whale' );
	ok( MAPS.lake.layout.pier === MAPS.island.layout.pier && MAPS.lake.vendors === MAPS.island.vendors, 'lake: the village, pier and traders stand where they do on the island' );
	const { LakeTerrainData } = await import( '../src/world/LakeTerrainData.js' );
	const T = new LakeTerrainData();
	const at = ( x, z ) => T.heightAt( x, z );
	ok( Math.abs( at( 0, - 42 ) ) < 0.6 && at( 55, 40 ) < - 3.5 && at( 55, 40 ) > - 5.5 && at( 40, - 118 ) > 1, 'lake terrain: the beach at the water line, ~4 m under the pier head, the village on dry land' );
	ok( at( 60, 560 ) < - 25 && at( - 170, 540 ) > 5 && at( 310, 650 ) > 5 && at( 560, 150 ) > - 4 && at( 560, 150 ) < 0, 'lake terrain: a deep centre, two islands, a shallow muddy bay' );
	ok( at( 0, - 960 ) > 150 && at( 0, 990 ) > 150 && at( 990, 300 ) > 150 && at( - 990, 600 ) > 150, 'lake terrain: mountains all along the edge (the sea beyond is hidden)' );
	ok( T.coastDistance( 55, 40 ).d > 0 && T.coastDistance( 40, - 118 ).d < 0 && T.pathDistance( 0, 0 ) === Infinity, 'lake terrain: shore distance and no footpaths' );
	const st = new GameState( { getItem: () => null, setItem: () => {} } );
	st.mapId = 'lake'; st.homeMap = 'island';
	ok( st.toJSON().map === 'island', 'lake: a test visit (?map=lake) keeps the game on its own map' );

}
// ---- the lake's fish and water (L4)
{

	const L = MAPS.lake;
	ok( L.species.length === 7 && L.species.every( ( id ) => FISH[ id ] && FISH[ id ].model ) && L.species.every( ( id ) => ! MAPS.island.species.includes( id ) ), 'lake: 7 species of its own, each with a model' );
	const tier = ( id ) => FISH[ id ].license;
	ok( [ 'guapucha', 'carachi', 'pejerrey' ].every( ( id ) => tier( id ) === 1 ) && tier( 'rainbowTrout' ) === 2 && tier( 'carp' ) === 2 && tier( 'brownTrout' ) === 3 && FISH.capitan.protected, 'lake: licences as approved (D30), the capitán protected' );
	ok( L.spots.length === 5 && L.spots.map( ( s ) => s.id ).join() === 'reeds,pier,river,mud,deep', 'lake: its 5 spots' );
	const top = ( h ) => Object.entries( h ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] )[ 0 ][ 0 ];
	const hab = ( x, z, depth, pierDist = 300 ) => L.habitat( { x, z, depth, pierDist, reefDist: 5000 } );
	ok( top( hab( - 330, 70, 2 ) ) === 'reeds' && top( hab( 55, 38, 4.4, 1 ) ) === 'pier' && top( hab( - 760, 262, 2 ) ) === 'river' && top( hab( 560, 150, 2.5 ) ) === 'mud' && top( hab( 60, 520, 36 ) ) === 'deep', 'lake: each place is its spot' );
	ok( Object.values( hab( 200, 200, 5.5 ) ).reduce( ( a, b ) => a + b, 0 ) > 0.05 && Object.values( hab( 0, 0, 0.1 ) ).every( ( v ) => v === 0 ), 'lake: fish everywhere in the water, nothing on the sand' );
	let lw = true;
	for ( const id of L.species ) {

		const f = FISH[ id ], lo = fishLengthCm( id, f.kg[ 0 ] ), hi = fishLengthCm( id, f.kg[ 1 ] );
		if ( ! ( lo > 4 && hi < 120 && hi > lo ) ) lw = false;

	}

	ok( lw, 'lake: plausible lengths (a 4 kg rainbow trout is ' + Math.round( fishLengthCm( 'rainbowTrout', 4 ) ) + ' cm)' );

}
// ---- travel by boat (L2: D20, D57)
{

	const m = new Map(), sto = { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) };
	const st = new GameState( sto );
	st.mapId = 'lake';
	ok( travelCost( MAPS, 'lake' ) === 0 && travelCost( MAPS, 'island' ) === 175, 'travel: costs a day of the basic licence of the destination (the lake basic is free, D82)' );
	ok( travelBlock( st, 'lake', MAPS ) === 'here' && travelBlock( st, 'river', MAPS ) === 'planned' && travelBlock( st, 'island', MAPS ) === 'level', 'travel: here, planned maps, and the island locked below level 10' );
	st.addXp( totalXpForLevel( 10 ) );
	st.money = 100;
	ok( travelBlock( st, 'island', MAPS ) === 'money', 'travel: needs the money' );
	st.money = 400;
	st.licences = { 3: 1e9 };
	st.addFish( 'rainbowTrout', 1.5 );
	ok( travelBlock( st, 'island', MAPS ) === 'cooler' && ! travel( st, 'island', MAPS ), 'travel: the cooler has to be empty' );
	st.sell();
	const money = st.money;
	ok( travel( st, 'island', MAPS ) && st.mapId === 'island' && st.money === money - 175 && JSON.parse( m.get( 'tidewater.save.v3' ) ).map === 'island', 'travel: pays and moves the game (saved)' );
	ok( st.licenseTier === 1 && st.maps.lake.log.rainbowTrout.count === 1 && ! st.log.rainbowTrout, 'travel: a first visit gets the free basic licence; logs stay with each map' );
	ok( travelBlock( st, 'lake', MAPS ) === null && travelOptions( st, MAPS ).length === 6, 'travel: back to an unlocked map any time; all six maps listed' );
	st.homeMap = 'lake';
	travel( st, 'lake', MAPS );
	ok( st.homeMap === null && st.toJSON().map === 'lake', 'travel: a real trip ends a test visit (?map=)' );

}
// ---- tackle by pieces (E1: D63–D66, D72, D74; src/game/Tackle.js and the hooking rules in Bites.js)
{

	const lake = catalogEntry( 'lake' ).species;
	const all = { ...BAITS, ...LURES };
	ok( Object.values( RODS ).every( ( r ) => POWERS[ r.power ] && [ 'float', 'spin', 'bottom' ].includes( r.tech ) && r.cost >= 0 && r.level >= 1 ), 'tackle: every rod has a known power, technique, price and level' );
	ok( Object.values( POWERS ).every( ( p, i, a ) => p.line[ 0 ] < p.line[ 1 ] && p.lure[ 0 ] < p.lure[ 1 ] && ( i === 0 || p.stiff > a[ i - 1 ].stiff ) ), 'tackle: power ranges are ordered and stiffness grows with power' );
	ok( Object.values( LINES ).every( ( l ) => l.kg > 0 && l.d > 0 && l.vis > 0 && l.vis <= 1 ), 'tackle: lines have strength, diameter and visibility' );
	ok( lake.every( ( id ) => PREFS[ id ] ), 'tackle: every lake species has its preferences' );
	ok( Object.values( PREFS ).every( ( p ) => [ ...p.best, ...p.ok ].every( ( b ) => all[ b ] ) && p.hook[ 0 ] < p.hook[ 1 ] && HOOKS[ p.hook[ 0 ] ] && HOOKS[ p.hook[ 1 ] ] ), 'tackle: preferences name real baits / lures and hook sizes that exist' );

	// the starter rod (D72)
	const s = rigStats( STARTER_RIG );
	ok( rigReady( STARTER_RIG ) && rigProblems( STARTER_RIG ).length === 0, 'tackle: the starter rod is ready, nothing out of range' );
	ok( s.tech === 'float' && s.lineKg === 2.5 && s.castM === 18 && s.dragMax === 3 && s.lineCap === 150 && rigStats( { rod: 'bottomMH', reel: 'r4000', line: 'm40' } ).lineCap === Math.round( 250 * ( 0.25 / 0.4 ) ** 2 ), 'tackle: starter stats (float, 2.5 kg line, 18 m cast, 3 kg drag); on the reel: the 150 m spool or what the reel holds' );
	ok( RODS[ STARTER_RIG.rod ].cost <= 25 && REELS[ STARTER_RIG.reel ].cost <= 20, 'tackle: starter rod and reel are the cheapest (given in a new game)' );

	// what doesn't fit
	const has = ( rig, p ) => rigProblems( rig ).includes( p );
	ok( has( { ...STARTER_RIG, hook: null }, 'hook' ) && ! rigReady( { ...STARTER_RIG, hook: null } ), 'tackle: a bait needs a hook' );
	ok( has( { ...STARTER_RIG, bait: 'spin2' }, 'lureTech' ) && has( { rod: 'spinL', reel: 'r2500', line: 'm20', hook: 6, bait: 'worm' }, 'lureTech' ), 'tackle: lures go on spinning rods, baits on float / bottom rods' );
	ok( has( { rod: 'bottomM', reel: 'r4000', line: 'm30', hook: 4, bait: 'corn' }, 'sinker' ) && has( { ...STARTER_RIG, float: null }, 'float' ), 'tackle: bottom rods need a sinker, float rods a float' );
	const heavy = { ...STARTER_RIG, line: 'm40' };
	ok( has( heavy, 'lineHeavy' ) && rigReady( heavy ), 'tackle: line too heavy for the rod is a warning, not a block' );
	ok( rigReady( { rod: 'spinL', reel: 'r2500', line: 'f18', bait: 'spin2' } ), 'tackle: a lure carries its own hook' );
	ok( has( { rod: 'spinUL', reel: 'r1000', line: 'm16', bait: 'spoon' }, 'castHeavy' ), 'tackle: a lure too heavy for the rod is flagged' );

	// how much each species bites on a rig (D64)
	const trout = { rod: 'spinL', reel: 'r2500', line: 'f18', bait: 'spin2' };
	const carpRig = { rod: 'bottomM', reel: 'r4000', line: 'm30', hook: 4, sinker: 40, bait: 'corn' };
	const near = ( a, b ) => Math.abs( a - b ) < 0.01;
	ok( biteMul( 'rainbowTrout', trout ).total === 1 && biteMul( 'carp', carpRig ).total === 1, 'tackle: each fish bites fully on its own rig' );
	ok( near( biteMul( 'rainbowTrout', carpRig ).total, 0.16 ), 'tackle: a trout on the carp rig bites ×0.16 (thick line ×0.4, corn only acceptable ×0.4)' );
	ok( near( biteMul( 'guapucha', STARTER_RIG ).total, 0.9 ) && biteMul( 'pejerrey', STARTER_RIG ).total === 1, 'tackle: the starter rod suits the small lake fish' );
	ok( near( biteMul( 'guapucha', { ...STARTER_RIG, hook: 4 } ).total, 0.9 * 0.2 ), 'tackle: a hook too big for its mouth: ×0.4 bites, half of them missed' );
	ok( biteMul( 'brownTrout', STARTER_RIG ).bait === 0.05, 'tackle: a bait it does not eat: ×0.05' );
	ok( biteMul( 'rainbowTrout', { ...trout, line: 'm25' } ).line < biteMul( 'rainbowTrout', trout ).line && biteMul( 'rainbowTrout', { ...trout, line: 'f22' } ).line === 1, 'tackle: thicker mono puts a trout off; fluorocarbon of the same strength does not' );
	ok( biteMul( 'tuna', carpRig ).total === 1, 'tackle: species without preferences bite as before' );
	ok( hookTooSmall( 'carp', STARTER_RIG ) && ! hookTooSmall( 'guapucha', STARTER_RIG ), 'tackle: a hook too small for the fish is detected (it comes out more in the fight)' );

	// not every bite hooks (D74)
	const rate = ( f, n = 4000 ) => { let k = 0; for ( let i = 0; i < n; i ++ ) if ( f() ) k ++; return k / n; };
	ok( Math.abs( rate( () => strikeOutcome( 'take', 0.2, rng ) === 'hooked' ) - HOOKING.hookFirst ) < 0.03 && Math.abs( rate( () => strikeOutcome( 'take', 0.8, rng ) === 'hooked' ) - HOOKING.hookLate ) < 0.03, 'hooking: striking early in the window hooks ~75 %, late ~55 %' );
	ok( Math.abs( rate( () => strikeOutcome( 'nibble', 0, rng ) === 'spooked' ) - HOOKING.spook ) < 0.03 && strikeOutcome( 'wait', 0, rng ) === 'early', 'hooking: striking on a nibble spooks the fish ~60 %' );
	ok( Math.abs( rate( () => nibbleOutcome( {}, rng ) === 'steal' ) - HOOKING.steal ) < 0.03 && rate( () => nibbleOutcome( { lure: true }, rng ) === 'steal' ) === 0, 'hooking: nibbles steal the bait ~15 %, never a lure' );
	ok( rate( () => nibbleOutcome( { bigHook: true }, rng ) === 'steal' ) > HOOKING.steal * 1.3, 'hooking: more bait stolen with a hook too big' );
	ok( Math.abs( rate( () => lureHitOutcome( null, rng ) === 'hooked' ) - HOOKING.spinSelf ) < 0.03 && Math.abs( rate( () => lureHitOutcome( 0.3, rng ) === 'hooked' ) - HOOKING.hookFirst ) < 0.03, 'hooking: a lure hit hooks itself ~30 % if not struck' );
	let a = 99; const r1 = () => ( ( a = ( a * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );
	let b = 99; const r2 = () => ( ( b = ( b * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );
	const hab = { shallows: 1 };
	ok( Math.abs( biteDelayFor( hab, 12, 0.5, r1 ) - biteDelay( hab, 12, r2 ) * HOOKING.waitMul / 0.5 ) < 1e-9, 'hooking: the wait is ×3.5 and divided by the rig\'s bite multiplier' );

}
// ---- the fight with tackle by pieces (E2: D63, D64, D71, D73, D75, D78)
{

	let sd = 4242;
	const r = () => ( ( sd = ( sd * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );
	const good = ( g ) => {

		if ( g.tension > 0.8 && g.drag > 2 ) g.setDrag( g.drag - 1 );
		else if ( g.tension < 0.3 && ! g.slipping && g.drag < 7 ) g.setDrag( g.drag + 1 );
		return { reel: ! g.slipping || g.mode === 'come', fast: g.mode === 'come', pull: g.mode === 'dive' || g.mode === 'hold', side: g.mode === 'run' ? - g.runDir * 0.8 : 0 };

	};
	const fightWith = ( species, kg, rig, player = good ) => {

		const st = rigStats( rig );
		const g = new CatchMinigame( { species, kg, lineKg: st.lineKg, reelSpeed: st.reelSpeed, distance: 18, lineCap: st.lineCap, tackle: fightTackle( species, rig ), rng: r } );
		let s = 'fighting';
		for ( let i = 0; i < 60 * 300 && s === 'fighting'; i ++ ) s = g.update( 1 / 60, player( g ) );
		return g;

	};
	const trout = { rod: 'spinL', reel: 'r2500', line: 'f18', bait: 'spin2' };
	const carpMH = { rod: 'bottomMH', reel: 'r4000', line: 'm40', hook: 2, sinker: 60, bait: 'corn' };

	// D73, D85: the fight grows with the fish (a juvenile under a minute, a typical trout over a minute, a big one minutes)
	const times = [ 0.3, 1, 2 ].map( ( kg ) => fightWith( 'rainbowTrout', kg, trout ) );
	ok( times.every( ( g ) => g.state === 'caught' ) && times[ 1 ].time >= 70 && times[ 2 ].time > times[ 1 ].time && times[ 1 ].time > times[ 0 ].time, `fight: a trout on its rod is landed, longer the bigger it is (${ times.map( ( g ) => Math.round( g.time ) + ' s' ).join( ', ' ) })` );
	const tiny = fightWith( 'guapucha', 0.008, STARTER_RIG );
	ok( tiny.state === 'caught' && tiny.time >= 25 && tiny.time < 60, `fight: a guapucha on the starter rod is quick and does not tear out (${ Math.round( tiny.time ) } s)` );

	// the reel's drag can't pass its maximum
	const g = new CatchMinigame( { species: 'carp', kg: 5, lineKg: 20, reelSpeed: 1.3, tackle: fightTackle( 'carp', carpMH ), rng: r } );
	g.setDrag( 10 );
	const capped = g.dragKg;
	g.setDrag( 3 );
	ok( capped === REELS.r4000.dragMax && Math.abs( g.dragKg - 20 * 0.095 * 3 ) < 1e-9, 'fight: the drag never passes the reel\'s maximum (12 kg on a 20 kg line)' );
	g.setDrag( 10 );
	g.update( 1 / 60, { reel: true } );
	ok( g.loads && g.loads.line > 0 && g.loads.rod > 0 && g.loads.reel > 0 && Math.abs( g.loads.line - g.tensionKg / 20 ) < 1e-9, 'fight: three loads (line, rod, reel) for the bars' );

	// D64: a stiff rod with a hard fight tears the hook out of a trout; its own rod doesn't
	let torn = 0;
	for ( let i = 0; i < 20; i ++ ) if ( fightWith( 'brownTrout', 4, carpMH ).cause === 'tear' ) torn ++;
	let tornOwn = 0;
	for ( let i = 0; i < 20; i ++ ) if ( fightWith( 'brownTrout', 4, { rod: 'spinML', reel: 'r3000', line: 'f22', bait: 'minnow' } ).cause === 'tear' ) tornOwn ++;
	ok( torn >= 8 && tornOwn === 0, `fight: the carp rod tears the hook out of a 4 kg brown trout (${ torn }/20), its own rod never (${ tornOwn }/20)` );

	// the rod breaks above its limit: a heavy line on a light rod with the drag screwed down
	const brk = { rod: 'floatUL', reel: 'r4000', line: 'm40', hook: 1, float: 6, bait: 'corn' };
	let broke = 0;
	for ( let i = 0; i < 10; i ++ ) if ( fightWith( 'carp', 10, brk, ( gg ) => { gg.setDrag( 10 ); return { reel: true, pull: true }; } ).cause === 'rod' ) broke ++;
	ok( broke >= 5, `fight: a light rod breaks under a big carp on a heavy line with the drag locked (${ broke }/10)` );

	// without tackle the fight is still the P1 one (the island)
	const old = new CatchMinigame( { species: 'grunt', kg: 1, lineKg: 7, rng: r } );
	ok( ! old.tackle && old.staminaMax < 60 && old.loads.line === 0, 'fight: without tackle it is the P1 fight' );

	// D75 / D78: values per hour
	ok( FISH.rainbowTrout.hourMul > 4 && FISH.rainbowTrout.xpMul > 3 && FISH.grunt.hourMul > 1.2 && FISH.grunt.xpMul === 1, 'values: lake species earn more per fish (new rhythm); island species only get back the flatter classes' );
	ok( SIZE_CLASSES.find( ( c ) => c.id === 'unique' ).mult === 1.2 && SIZE_CLASSES.find( ( c ) => c.id === 'trophy' ).mult === 1.1, 'values: trophy ×1.1, unique ×1.2 (D78: the class pays mostly in XP)' );
	ok( catchXp( 'carp', 3 ) === Math.round( ( sizeClass( 'carp', 3 ).xp * difficulty( 'carp' ) + 3 * 3 ) * FISH.carp.xpMul ), 'values: XP × the species\' xpMul' );
	ok( activeMap().id !== 'lake' || activeMap().tackle === true, 'maps: the lake fishes with tackle by pieces' );
	ok( gradeRig( 0 ) === STARTER_RIG && GRADE_RIGS.every( ( g2 ) => rigStats( g2 ) ) && rigStats( gradeRig( 6 ) ).lineKg > rigStats( gradeRig( 0 ) ).lineKg, 'tackle: every float rig grade stands for a rod of the catalogue until the new shop' );

}
// ---- tackle bag, assembled rods, licences by days, live bait (E3a: D64, D65, D66, D68, D69, D79, D80, D82)
{

	const mem = () => { const m = new Map(); return { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) }; };

	// the starter tackle and the conversion of older saves
	const t0 = starterTackle();
	ok( t0.rigs.length === 3 && t0.active === 0 && t0.rigs[ 0 ].rod === 'floatUL' && rigCastable( t0 ), 'bag: a new game has the starter rod assembled in slot 1, ready to cast' );
	ok( tbCount( t0.bag, 'bait', 'larva' ) === 30 && tbCount( t0.bag, 'bait', 'worm' ) === 20 && tbCount( t0.bag, 'hook', 12 ) === 10 && tbCount( t0.bag, 'float', 3 ) === 5, 'bag: starter consumables (30 maggots, 20 worms, 10 hooks #12, 5 floats of 3 g)' );
	ok( GRADE_RIGS.every( ( _, g ) => rigCastable( tackleFromGrade( g ) ) ), 'bag: every old float rig grade converts to a castable rod' );
	const old = new GameState( mem() );
	ok( old.fromJSON( { v: 3, money: 10, xp: 0, upgrades: { rig: 3 }, maps: {}, map: 'lake' } ) && old.tackle.rigs[ 0 ].rod === GRADE_RIGS[ 3 ].rod && rigCastable( old.tackle ), 'save: a version 3 save without tackle gets the rod of its grade' );
	const round = new GameState( mem() );
	round.fromJSON( JSON.parse( JSON.stringify( old.toJSON() ) ) );
	ok( JSON.stringify( round.tackle ) === JSON.stringify( old.tackle ), 'save: the tackle survives a save round trip' );
	ok( cleanTackle( { bag: { rod: { nope: 1, floatUL: 1 }, bait: { larva: - 3 } }, rigs: [ { rod: 'floatUL' }, { rod: 'floatUL' } ] } ).rigs[ 1 ].rod === null, 'save: unknown pieces dropped; two rigs can\'t share one rod' );

	// equip, spend, buy, sell
	const st = new GameState( mem() );
	st.money = 2000;
	st.xp = totalXpForLevel( 8 );
	const lv1 = new GameState( mem() );
	lv1.money = 2000;
	ok( ! lv1.buyPiece( 'rod', 'bottomMH' ) && lv1.pieceBlock( 'rod', 'bottomMH' ) === 'level' && lv1.money === 2000, 'buy: a piece above your level cannot be bought' );
	ok( st.buyPiece( 'rod', 'spinL' ) && tbCount( st.tackle.bag, 'rod', 'spinL' ) === 1 && st.money === 2000 - RODS.spinL.cost, 'buy: a rod goes in the bag and costs its price' );
	ok( st.buyPiece( 'bait', 'corn' ) && tbCount( st.tackle.bag, 'bait', 'corn' ) === BAITS.corn.n, 'buy: a pack of bait adds its units' );
	ok( st.equipPiece( 'rod', 'spinL', 1 ) && st.tackle.rigs[ 1 ].rod === 'spinL' && ! st.equipPiece( 'rod', 'spinL', 2 ), 'equip: one rod can only be on one rig' );
	ok( ! st.sellPiece( 'rod', 'spinL' ), 'sell: a rod on a rig can\'t be sold' );
	st.buyPiece( 'rod', 'spinL' );
	const m0 = st.money;
	ok( st.sellPiece( 'rod', 'spinL' ) && st.money === m0 + Math.floor( RODS.spinL.cost / 2 ), 'sell: a spare rod fetches half its price (D68)' );
	const larva0 = tbCount( st.tackle.bag, 'bait', 'larva' );
	st.spendTackle( 'bite' );
	ok( tbCount( st.tackle.bag, 'bait', 'larva' ) === larva0 - 1, 'spend: a bite costs one bait' );
	const h0 = tbCount( st.tackle.bag, 'hook', 12 ), f0 = tbCount( st.tackle.bag, 'float', 3 );
	st.spendTackle( 'snap' );
	ok( tbCount( st.tackle.bag, 'hook', 12 ) === h0 - 1 && tbCount( st.tackle.bag, 'float', 3 ) === f0 - 1 && tbCount( st.tackle.bag, 'bait', 'larva' ) === larva0 - 2, 'spend: a snapped line costs hook, float and bait' );
	st.spendTackle( 'rod' );
	ok( st.tackle.rigs[ 0 ].rod === null && tbCount( st.tackle.bag, 'rod', 'floatUL' ) === 0 && ! rigCastable( st.tackle ), 'spend: a broken rod is gone and the rig can\'t be cast' );
	ok( rigIssues( st.tackle ).includes( 'rod' ), 'spend: the rig says what it misses' );

	// a lure is spent only with the line, and needs no hook
	const sp = new GameState( mem() );
	sp.money = 500; sp.xp = totalXpForLevel( 5 );
	sp.buyPiece( 'rod', 'spinL', { equip: true } );
	sp.buyPiece( 'lure', 'spin2', { equip: true } );
	ok( rigCastable( sp.tackle ) && sp.rig.bait === 'spin2' && sp.rig.float === null && sp.rig.hook === null, 'equip: a spinning rod with a lure (no float, no hook) is ready' );
	sp.spendTackle( 'bite' );
	ok( tbCount( sp.tackle.bag, 'lure', 'spin2' ) === 1, 'spend: a bite does not cost a lure' );
	sp.spendTackle( 'snap' );
	ok( tbCount( sp.tackle.bag, 'lure', 'spin2' ) === 0 && rigIssues( sp.tackle ).includes( 'noBait' ), 'spend: a snapped line loses the lure' );

	// packs by species (D69)
	const pk = new GameState( mem() );
	pk.money = 2000; pk.xp = totalXpForLevel( 6 );
	const full = packFullPrice( PACKS.carp );
	ok( packCost( PACKS.carp ) === Math.round( full * 0.85 ), 'packs: 15 % off the pieces' );
	ok( pk.buyPack( 'carp' ) && pk.money === 2000 - packCost( PACKS.carp ) && pk.rig.rod === 'bottomM' && pk.rig.bait === 'corn' && rigCastable( pk.tackle ), 'packs: the carp pack is bought and assembled, ready to cast' );
	ok( biteMul( 'carp', pk.rig ).total === 1, 'packs: the carp bites fully on the carp pack' );
	ok( Object.values( PACKS ).every( ( p ) => p.species.every( ( s ) => biteMul( s, p.rig ).total === 1 ) ), 'packs: every pack is the right rig for its species' );

	// what pieces are good for (the shop filter)
	ok( goodFor( 'rod', 'spinL', [ 'rainbowTrout', 'carp' ] ).join() === 'rainbowTrout' && goodFor( 'bait', 'corn', [ 'rainbowTrout', 'carp' ] ).join() === 'carp', 'shop: what each piece is good for' );

	// live bait (D79)
	const lb = new GameState( mem() );
	lb.licences = { 1: 1e9, 2: 1e9, 3: 1e9 };
	lb.addFish( 'carachi', 0.12 );
	const id = lb.inventory[ 0 ]?.id;
	ok( id != null && lb.toBucket( id ) && lb.inventory.length === 0 && tbCount( lb.tackle.bag, 'bait', 'livebait' ) === 1, 'live bait: a carachi goes from the cooler to the bait bucket' );
	ok( PREFS.brownTrout.best.includes( 'livebait' ) && PREFS.rainbowTrout.ok.includes( 'livebait' ), 'live bait: preferred by the brown trout, accepted by the rainbow' );

	// licences by days (D80) and the free basic of the starting map (D82)
	ok( licensePrice( { price: 100 }, 1 ) === 100 && licensePrice( { price: 100 }, 3 ) === 280 && licensePrice( { price: 100 }, 7 ) === 630 && licensePrice( { price: 100, free: true }, 7 ) === 0, 'licences: 1, 3 and 7 days at ×1, ×2.8, ×6.3' );
	ok( withLicenseDays( {}, 2, 100, 3 )[ 2 ] === 100 + 3 * LICENSE_SECONDS, 'licences: buying 3 days adds three game days' );
	ok( LAKE_MAP.licenses[ 1 ].free === true && LAKE_MAP.licenses[ 1 ].price === 0 && catalogEntry( 'lake' ).freeBasic, 'licences: the lake basic is free for good' );

	// the bite by bait (D64): a carp rig makes the carp come up more often than a trout
	const hab = { mud: 1, deep: 0.5, river: 0.3, pier: 0.3, reeds: 0.3 };
	const lakeIds = catalogEntry( 'lake' ).species;
	if ( lakeIds.includes( activeMap().species[ 0 ] ) ) {

		let sd2 = 9; const r2 = () => ( ( sd2 = ( sd2 * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );
		const carpRig = PACKS.carp.rig, cnt = { carp: 0, rainbowTrout: 0 };
		for ( let i = 0; i < 3000; i ++ ) { const s2 = pickSpecies( hab, 12, r2, ( s ) => biteMul( s, carpRig ).total ); if ( s2 in cnt ) cnt[ s2 ] ++; }
		ok( cnt.carp > cnt.rainbowTrout * 4, `bite: with the carp rig, carp bite far more than trout (${ cnt.carp } vs ${ cnt.rainbowTrout })` );

	}

	const habAny = {};
	for ( const sid of activeMap().species ) for ( const k in FISH[ sid ].habitat ) habAny[ k ] = 1;
	ok( Math.abs( biteMulHere( habAny, 12, () => 1 ) - 1 ) < 1e-9 && Math.abs( biteMulHere( habAny, 12, () => 0.5 ) - 0.5 ) < 1e-9, 'bite: the wait multiplier is the rig\'s average over what lives here' );

}
// ---- the three rods and the gear tab (E4: D65)
{

	const mem = () => { const m = new Map(); return { getItem: ( k ) => m.get( k ) ?? null, setItem: ( k, v ) => m.set( k, v ) }; };
	const st = new GameState( mem() );
	st.money = 2000; st.xp = totalXpForLevel( 8 );
	st.buyPack( 'trout' );
	ok( st.tackle.rigs[ 0 ].rod === 'spinL' && tbCount( st.tackle.bag, 'rod', 'floatUL' ) === 1, 'rods: a pack goes on the active rod; the starter rod goes back to the bag' );
	ok( st.setActiveRig( 1 ) && st.tackle.active === 1 && ! st.setActiveRig( 1 ), 'rods: switching the active rod (1, 2, 3)' );
	ok( st.equipPiece( 'rod', 'floatUL' ) && st.equipPiece( 'reel', 'r1000' ) && st.equipPiece( 'line', 'm16' ) && ! st.equipPiece( 'line', 'f18' ), 'rods: the starter rod, reel and line go on rod 2; the spool on rod 1 is not free' );
	ok( st.equipPiece( 'hook', 12 ) && st.equipPiece( 'float', 3 ) && st.equipPiece( 'bait', 'worm' ) && rigCastable( st.tackle, 1 ), 'rods: rod 2 assembled from the bag and ready' );
	ok( rigChipText( st ).includes( '<b>2</b>' ) && rigChipText( st ).includes( 'Lombrices' ) || rigChipText( st ).includes( 'Worms' ), 'rods: the HUD chip shows the active rod and its bait' );
	const html = renderEquipment( st );
	ok( ( html.match( /class="eq-rig[ "]/g ) || [] ).length === 3 && html.includes( 'data-slot="2"' ), 'rods: the gear tab shows three rods with their slots' );
	ok( ! renderEquipment( st ).match( /data-slot="2" data-key="rod">[^]*?value="rod:spinL"/ ), 'rods: a rod on another rig is not offered for rod 3' );
	const round = new GameState( mem() );
	round.fromJSON( JSON.parse( JSON.stringify( st.toJSON() ) ) );
	ok( round.tackle.active === 1 && round.tackle.rigs[ 1 ].bait === 'worm', 'rods: the active rod and the three rigs are saved' );

}
console.log( `value check ${ value }` );
console.log( fails ? `${ fails } FAILED` : 'all passed' );
process.exit( fails ? 1 : 0 );
