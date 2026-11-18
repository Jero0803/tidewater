import { FISH } from './FishTable.js';

// Phase 1 progression rules (docs/DISENO.md, D8–D44): size classes, XP and levels, licences. Pure functions on
// plain data, no DOM and no state of their own, so they run in Node (tests, tools/balance) as well as in the game.

// ---- size classes (D: clases de tamaño). t = where the weight sits in the species' range, 0 (lightest) .. 1.
// mult scales the price per kg (juveniles are released, never sold); xp is the base XP of the class.
export const SIZE_CLASSES = [
	{ id: 'juvenile', upTo: 0.15, mult: 0, xp: 1 },
	{ id: 'common', upTo: 0.70, mult: 1, xp: 3 },
	{ id: 'trophy', upTo: 0.92, mult: 1.5, xp: 10 },
	{ id: 'unique', upTo: Infinity, mult: 3, xp: 40 },
];

export function sizeClass( species, kg ) {

	const [ lo, hi ] = FISH[ species ].kg;
	const t = Math.min( 1, Math.max( 0, ( kg - lo ) / Math.max( hi - lo, 1e-6 ) ) );
	return SIZE_CLASSES.find( ( c ) => t < c.upTo ) || SIZE_CLASSES[ SIZE_CLASSES.length - 1 ];

}

// $ a fish fetches at the buyer under the size-class rules (0 for juveniles and protected species)
export function classValue( species, kg ) {

	if ( isProtected( species ) ) return 0;
	return Math.round( FISH[ species ].price * kg * sizeClass( species, kg ).mult );

}

// ---- experience (D32): ( class XP × difficulty + 3 per kg + 20 for a new species ) × the map's multiplier.
// The map multiplier is 1.25 per map along the chain; the island is the first map until the lower maps exist (D25).
export const XP_PER_KG = 3;
export const NEW_SPECIES_XP = 20;
export const MAP_XP_GROWTH = 1.25;

export const difficulty = ( species ) => 1 + 2 * FISH[ species ].fight;
export const mapXpMultiplier = ( mapIndex = 0 ) => MAP_XP_GROWTH ** mapIndex;

export function catchXp( species, kg, { newSpecies = false, mapIndex = 0 } = {} ) {

	const c = sizeClass( species, kg );
	const raw = c.xp * difficulty( species ) + XP_PER_KG * kg + ( newSpecies ? NEW_SPECIES_XP : 0 );
	return Math.round( raw * mapXpMultiplier( mapIndex ) );

}

// ---- levels (D32): going from level N to N + 1 takes 600 × 1.03^(N − 1) XP. No level cap (D8).
export const LEVEL_BASE_XP = 600;
export const LEVEL_GROWTH = 1.03;

export const xpToNext = ( level ) => Math.round( LEVEL_BASE_XP * LEVEL_GROWTH ** ( level - 1 ) );

export function totalXpForLevel( level ) {

	let xp = 0;
	for ( let n = 1; n < level; n ++ ) xp += xpToNext( n );
	return xp;

}

// level reached with `xp` total experience, the XP already earned into it and what the next level needs
export function levelFromXp( xp ) {

	let level = 1, rest = Math.max( 0, Math.floor( xp ) ), need = xpToNext( 1 );
	while ( rest >= need ) {

		rest -= need;
		level ++;
		need = xpToNext( level );

	}

	return { level, into: rest, need };

}

// ---- licences (D10–D14, D18–D21, D37, D41, D43, D47). Tier 1 basic, 2 intermediate, 3 advanced; cumulative (a
// tier covers the ones below it). Each lasts one game day of played time: 120 real minutes (D47), counted in played
// seconds so pausing the clock (T) does not stop it.
export const DAY_SECONDS = 120 * 60;
export const LICENSE_SECONDS = DAY_SECONDS;
// the game clock (D16, D47): one game day in DAY_SECONDS of play, so one game hour every 5 real minutes
export const CLOCK_HOURS_PER_SECOND = 24 / DAY_SECONDS;

// part of the day for the clock in the HUD (matches where Bites.activity peaks: dawn ~6:30, dusk ~18:30)
export function dayPhase( hour ) {

	const h = ( ( hour % 24 ) + 24 ) % 24;
	if ( h >= 5 && h < 8 ) return 'dawn';
	if ( h >= 8 && h < 17 ) return 'day';
	if ( h >= 17 && h < 20 ) return 'dusk';
	return 'night';

}

// prices and minimum levels while the island is the starting map (D37 island prices for a 24-minute day, scaled ×5
// with the 120-minute day, D47; D43 levels 4 and 7)
export const LICENSES = [
	null,
	{ tier: 1, id: 'basic', price: 175, minLevel: 1 },
	{ tier: 2, id: 'intermediate', price: 500, minLevel: 4 },
	{ tier: 3, id: 'advanced', price: 1000, minLevel: 7 },
];
// the HUD and a toast warn when the active licence has this much left
export const LICENSE_WARN_SECONDS = 5 * 60;

export const licenseTierOf = ( species ) => FISH[ species ].license ?? 1;
export const isProtected = ( species ) => !! FISH[ species ].protected;

// licences: { [tier]: expiresAt } in played seconds. The highest tier still running is the one that counts.
export function activeLicenseTier( licences, playedSeconds ) {

	let best = 0;
	for ( const [ tier, until ] of Object.entries( licences || {} ) ) if ( until > playedSeconds && Number( tier ) > best ) best = Number( tier );
	return best;

}

// seconds left on the licence that is active now (0 when none)
export function licenseSecondsLeft( licences, playedSeconds ) {

	const tier = activeLicenseTier( licences, playedSeconds );
	return tier ? licences[ tier ] - playedSeconds : 0;

}

// buy (or extend) a tier: a new licence starts now, buying again while it runs adds another day.
// Returns the new licences object (the input is not changed).
export function withLicense( licences, tier, playedSeconds ) {

	const until = Math.max( playedSeconds, licences?.[ tier ] ?? 0 ) + LICENSE_SECONDS;
	return { ...licences, [ tier ]: until };

}

// a new game starts with the basic licence for its first day (D18)
export const starterLicences = () => ( { 1: LICENSE_SECONDS } );

// can this catch go in the cooler? Juveniles and protected species are always released (they still give XP, D13,
// D31); the rest need an active licence of their tier or higher.
export function canKeep( species, kg, activeTier ) {

	if ( isProtected( species ) ) return false;
	if ( sizeClass( species, kg ).mult === 0 ) return false;
	return licenseTierOf( species ) <= activeTier;

}

// why a catch has to be released ('juvenile' | 'protected' | 'license'), or null when it can be kept
export function releaseReason( species, kg, activeTier ) {

	if ( isProtected( species ) ) return 'protected';
	if ( sizeClass( species, kg ).mult === 0 ) return 'juvenile';
	if ( licenseTierOf( species ) > activeTier ) return 'license';
	return null;

}
