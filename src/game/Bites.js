import { FISH } from './FishTable.js';
import { activeMap } from '../maps/registry.js';

// the species that bite on the active map (maps/*.js)
const MAP_FISH = activeMap().species;

// Where the bobber is and what lives there.
//   depth     water depth under the bobber (m)
//   reefDist  horizontal distance to the reef edge (m, < 0 inside it)
//   pierDist  horizontal distance to the pier (piles / head) (m)
// Returns weights per water type (they overlap: a spot can be both pier and bay).
export function habitatAt( { depth, reefDist, pierDist } ) {

	const h = { shallows: 0, reef: 0, pier: 0, bay: 0, deep: 0 };
	if ( depth < 0.25 ) return h; // on the sand
	h.shallows = smooth( 3.5, 1.0, depth );
	h.reef = smooth( 12, - 6, reefDist ) * smooth( 0.8, 2.5, depth );
	h.pier = smooth( 9, 2, pierDist ) * smooth( 0.6, 2, depth );
	h.bay = smooth( 1.5, 4, depth ) * ( 1 - smooth( 18, 30, depth ) );
	h.deep = smooth( 16, 28, depth );
	return h;

}

// 1 at the species' favourite time, less at others; hour 0..24
export function activity( pref, hour ) {

	const dawn = Math.exp( - ( ( hour - 6.5 ) ** 2 ) / 2.5 ), dusk = Math.exp( - ( ( hour - 18.5 ) ** 2 ) / 2.5 );
	const night = hour < 5.5 || hour > 19.5 ? 1 : 0;
	const day = hour > 7 && hour < 18 ? 1 : 0.35;
	switch ( pref ) {

		case 'day': return 0.25 + 0.75 * day * ( 1 - night );
		case 'dawnDusk': return 0.3 + 0.7 * Math.max( dawn, dusk ) + 0.1 * day;
		case 'night': return 0.15 + 0.85 * Math.max( night, dusk * 0.8 );
		default: return 0.8 + 0.2 * Math.max( dawn, dusk );

	}

}

// how much each species of the map bites here and now (habitat × rarity × time of day), times mul( id ) (the rig's
// bite multiplier for that species, Tackle.biteMul; 1 when not given)
function speciesWeights( habitat, hour, mul ) {

	let total = 0;
	const w = [];
	for ( const id of MAP_FISH ) {

		const f = FISH[ id ];
		let hw = 0;
		for ( const k in f.habitat ) hw += f.habitat[ k ] * habitat[ k ];
		const x = hw * f.rarity * activity( f.time, hour ) * ( mul ? mul( id ) : 1 );
		w.push( x );
		total += x;

	}

	return { w, total };

}

// the rig's bite multiplier averaged over what lives here (D64): the wait for a bite is divided by it
export function biteMulHere( habitat, hour, mul ) {

	const base = speciesWeights( habitat, hour, null ).total;
	return base < 1e-4 ? 1 : speciesWeights( habitat, hour, mul ).total / base;

}

// Weighted pick of the species that bites here; null when nothing lives here.
// rng: () => [0, 1); mul: optional ( id ) => the rig's bite multiplier for that species
export function pickSpecies( habitat, hour, rng = Math.random, mul = null ) {

	const { w, total } = speciesWeights( habitat, hour, mul );

	if ( total < 1e-4 ) return null;
	let r = rng() * total;
	for ( let i = 0; i < w.length; i ++ ) {

		r -= w[ i ];
		if ( r <= 0 ) return MAP_FISH[ i ];

	}

	return MAP_FISH[ MAP_FISH.length - 1 ];

}

// Weight in kg: skewed toward the small end (most fish are small, trophies are rare)
export function rollWeight( id, rng = Math.random ) {

	const [ a, b ] = FISH[ id ].kg;
	const t = Math.pow( rng(), 2.2 );
	return a + ( b - a ) * t;

}

// Seconds until the next bite at this spot: richer water bites sooner. Infinity when barren.
export function biteDelay( habitat, hour, rng = Math.random ) {

	let rich = 0;
	for ( const k in habitat ) rich += habitat[ k ];
	if ( rich < 0.05 ) return Infinity;
	// open water between the named habitats still has fish: never much slower than a poor spot
	rich = Math.max( rich, 0.35 );
	const light = hour > 6 && hour < 19 ? 1 : 0.8;
	const mean = 8 / ( Math.min( rich, 1.6 ) * light );
	return 2 + - Math.log( 1 - rng() * 0.98 ) * mean * 0.6;

}

// ---- not every bite hooks a fish (docs/DISENO.md D74; defined in E1, used by the game from E2)
//   waitMul    the wait for a bite is this many times today's (and divided by the rig's biteMul, Tackle.js)
//   steal      chance a nibbling fish takes the bait without pulling the bobber under (baits only; ×1.5 with a hook
//              too big for it); the bait is gone, reel in and bait up again
//   spook      striking on a nibble scares the fish off this often (else it keeps nibbling)
//   hookFirst  striking while the bobber is under hooks it this often in the first half of the window…
//   hookLate   …and this often in the second half
//   spinWindow seconds to strike when a fish hits a lure on the retrieve; spinSelf: it hooks itself if you don't
export const HOOKING = { waitMul: 3.5, steal: 0.15, bigHookSteal: 1.5, spook: 0.6, hookFirst: 0.75, hookLate: 0.55, spinWindow: 0.6, spinSelf: 0.3 };

// seconds until the next bite with the rig's bite multiplier (Tackle.biteMul( species, rig ).total)
export function biteDelayFor( habitat, hour, mul = 1, rng = Math.random ) {

	return biteDelay( habitat, hour, rng ) * HOOKING.waitMul / Math.max( mul, 0.01 );

}

// a nibble: 'steal' (bait gone) or 'nibble' (keeps going). lure: true for lures (never stolen)
export function nibbleOutcome( { lure = false, bigHook = false } = {}, rng = Math.random ) {

	if ( lure ) return 'nibble';
	return rng() < HOOKING.steal * ( bigHook ? HOOKING.bigHookSteal : 1 ) ? 'steal' : 'nibble';

}

// the strike: phase 'nibble' (too early) -> 'spooked' | 'early'; phase 'take' -> 'hooked' | 'missed'.
// frac: how far into the take window (0 just pulled under .. 1 about to let go)
export function strikeOutcome( phase, frac = 0, rng = Math.random ) {

	if ( phase === 'nibble' ) return rng() < HOOKING.spook ? 'spooked' : 'early';
	if ( phase !== 'take' ) return 'early';
	return rng() < ( frac < 0.5 ? HOOKING.hookFirst : HOOKING.hookLate ) ? 'hooked' : 'missed';

}

// a fish hitting a lure on the retrieve: struck within the window -> 'hooked' / 'missed'; not struck -> it may hook
// itself ('hooked') or let go ('missed'). struckAt: seconds after the hit, or null
export function lureHitOutcome( struckAt, rng = Math.random ) {

	if ( struckAt != null && struckAt <= HOOKING.spinWindow ) return rng() < HOOKING.hookFirst ? 'hooked' : 'missed';
	return rng() < HOOKING.spinSelf ? 'hooked' : 'missed';

}

function smooth( e0, e1, x ) {

	const t = Math.min( 1, Math.max( 0, ( x - e0 ) / ( e1 - e0 ) ) );
	return t * t * ( 3 - 2 * t );

}
