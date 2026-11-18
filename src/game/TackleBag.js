import { RODS, REELS, LINES, HOOKS, FLOATS, SINKERS, BAITS, LURES, PREFS, POWERS, STARTER_RIG, GRADE_RIGS, isLure, rigProblems, BLOCKING, biteMul } from './Tackle.js';
// The tackle the player owns and the rods they have assembled (docs/DISENO.md 7h, E3a: D63, D65, D66, D68, D69, D79).
// Plain data and pure-ish functions (they change the object passed in), importable in Node.
//
//   tackle = { bag, rigs: [ rig | null, rig | null, rig | null ], active: 0 }
//   bag    = { rod: { id: n }, reel: { id: n }, line: { id: n }, hook: { size: n }, float: { g: n }, sinker: { g: n },
//              bait: { id: n }, lure: { id: n } }   (units; a pack of 30 maggots adds 30)
//
// Rods, reels and lines are kept: a rig uses one of them while it is assembled (owned − in use is what is free).
// Hooks, floats, sinkers, baits and lures are spent: one bait per bite, the end of the line (hook, float or sinker,
// bait or lure) with a snapped line, the rod when it breaks. A rig names what it uses; it can only be cast while the
// bag still has them.

export const RIG_SLOTS = 3; // D65
export const KINDS = [ 'rod', 'reel', 'line', 'hook', 'float', 'sinker', 'bait', 'lure' ];
export const DURABLE = new Set( [ 'rod', 'reel', 'line' ] );
export const TABLES = { rod: RODS, reel: REELS, line: LINES, hook: HOOKS, float: FLOATS, sinker: SINKERS, bait: BAITS, lure: LURES };
export const SELL_SHARE = 0.5; // D68

// units in one purchase (a pack) and the price of that purchase
export const packUnits = ( kind, id ) => ( DURABLE.has( kind ) || kind === 'lure' ) ? 1 : ( TABLES[ kind ][ id ]?.n ?? 1 );
export const packPrice = ( kind, id ) => TABLES[ kind ][ id ]?.cost ?? null;
export const pieceLevel = ( kind, id ) => TABLES[ kind ][ id ]?.level ?? 1;

export function emptyBag() {

	const b = {};
	for ( const k of KINDS ) b[ k ] = {};
	return b;

}

export const count = ( bag, kind, id ) => ( id == null ? 0 : bag[ kind ]?.[ id ] ?? 0 );

export function add( bag, kind, id, n = 1 ) {

	bag[ kind ][ id ] = count( bag, kind, id ) + n;
	return bag;

}

// spend n units; false when there aren't enough (nothing is spent then)
export function spend( bag, kind, id, n = 1 ) {

	const have = count( bag, kind, id );
	if ( have < n ) return false;
	if ( have - n > 0 ) bag[ kind ][ id ] = have - n;
	else delete bag[ kind ][ id ];
	return true;

}

// the bait slot of a rig holds a bait or a lure: which bag kind it is
export const baitKind = ( id ) => ( isLure( id ) ? 'lure' : 'bait' );

// how many rigs use this durable piece
export function inUse( tackle, kind, id, exceptSlot = - 1 ) {

	return tackle.rigs.reduce( ( n, r, i ) => n + ( r && i !== exceptSlot && r[ kind ] === id ? 1 : 0 ), 0 );

}

// free units of a durable piece (owned and not on another rig)
export const free = ( tackle, kind, id, exceptSlot = - 1 ) => count( tackle.bag, kind, id ) - inUse( tackle, kind, id, exceptSlot );

// what the player starts with (D72): the starter rod assembled, and in the bag a pack of #12 hooks, 3 g floats,
// 30 maggots and 20 worms
export function starterTackle() {

	return tackleFromRig( STARTER_RIG );

}

// a new bag holding one rig's pieces (assembled in slot 1) plus the starter consumables. Used for new games and to
// convert saves from before tackle by pieces: the float rig grade becomes its rod of the catalogue (GRADE_RIGS)
export function tackleFromRig( rig ) {

	const bag = emptyBag();
	add( bag, 'rod', rig.rod );
	add( bag, 'reel', rig.reel );
	add( bag, 'line', rig.line );
	add( bag, 'hook', 12, HOOKS[ 12 ].n );
	if ( rig.hook !== 12 && rig.hook ) add( bag, 'hook', rig.hook, HOOKS[ rig.hook ].n );
	add( bag, 'float', 3, FLOATS[ 3 ].n );
	if ( rig.float && rig.float !== 3 ) add( bag, 'float', rig.float, FLOATS[ rig.float ].n );
	if ( rig.sinker ) add( bag, 'sinker', rig.sinker, SINKERS[ rig.sinker ].n );
	if ( isLure( rig.bait ) ) add( bag, 'lure', rig.bait, 3 );
	add( bag, 'bait', 'larva', BAITS.larva.n );
	add( bag, 'bait', 'worm', BAITS.worm.n );
	const r = { ...rig };
	if ( r.sinker && RODS[ r.rod ].tech !== 'bottom' ) r.sinker = null;
	if ( RODS[ r.rod ].tech === 'bottom' ) r.float = null;
	if ( RODS[ r.rod ].tech === 'spin' ) { r.float = null; r.sinker = null; r.hook = null; if ( ! isLure( r.bait ) ) r.bait = null; }
	return { bag, rigs: [ r, null, null ], active: 0 };

}

export const tackleFromGrade = ( grade ) => tackleFromRig( GRADE_RIGS[ Math.max( 0, Math.min( GRADE_RIGS.length - 1, grade | 0 ) ) ] );

// a saved tackle object, checked: unknown pieces dropped, counts positive integers, three slots
export function cleanTackle( t ) {

	if ( ! t || typeof t !== 'object' || ! t.bag ) return null;
	const bag = emptyBag();
	for ( const k of KINDS ) for ( const [ id, n ] of Object.entries( t.bag[ k ] || {} ) ) if ( TABLES[ k ][ id ] && Number.isFinite( n ) && n >= 1 ) bag[ k ][ id ] = Math.floor( n );
	const rigs = [];
	for ( let i = 0; i < RIG_SLOTS; i ++ ) {

		const r = t.rigs?.[ i ];
		if ( ! r || typeof r !== 'object' ) { rigs.push( null ); continue; }
		const ok = ( k, id ) => ( id != null && TABLES[ k ][ id ] ? id : null );
		const b = r.bait != null && ( BAITS[ r.bait ] || LURES[ r.bait ] ) ? r.bait : null;
		rigs.push( { rod: ok( 'rod', r.rod ), reel: ok( 'reel', r.reel ), line: ok( 'line', r.line ), hook: r.hook != null && HOOKS[ r.hook ] ? Number( r.hook ) : null,
			float: r.float != null && FLOATS[ r.float ] ? Number( r.float ) : null, sinker: r.sinker != null && SINKERS[ r.sinker ] ? Number( r.sinker ) : null, bait: b } );

	}

	// a rig can't use more rods / reels / lines than the bag has
	for ( const k of DURABLE ) for ( let i = rigs.length - 1; i >= 0; i -- ) if ( rigs[ i ] && rigs[ i ][ k ] != null && free( { bag, rigs }, k, rigs[ i ][ k ], i ) < 1 ) rigs[ i ][ k ] = null;
	return { bag, rigs, active: Math.max( 0, Math.min( RIG_SLOTS - 1, t.active | 0 ) ) };

}

// What stops this rig from being cast: the rig's own problems (Tackle.rigProblems) plus what the bag has run out of:
// 'noHook', 'noFloat', 'noSinker', 'noBait' (a bait or a lure). [] or warnings only = ready.
export const BAG_BLOCKING = new Set( [ 'noHook', 'noFloat', 'noSinker', 'noBait', 'empty' ] );
export function rigIssues( tackle, slot = tackle.active ) {

	const r = tackle.rigs[ slot ];
	if ( ! r ) return [ 'empty' ];
	const out = rigProblems( r );
	const bag = tackle.bag;
	if ( r.bait && count( bag, baitKind( r.bait ), r.bait ) < 1 ) out.push( 'noBait' );
	if ( r.hook && ! isLure( r.bait ) && count( bag, 'hook', r.hook ) < 1 ) out.push( 'noHook' );
	if ( r.float && RODS[ r.rod ]?.tech === 'float' && count( bag, 'float', r.float ) < 1 ) out.push( 'noFloat' );
	if ( r.sinker && RODS[ r.rod ]?.tech === 'bottom' && count( bag, 'sinker', r.sinker ) < 1 ) out.push( 'noSinker' );
	return out;

}

export const rigCastable = ( tackle, slot = tackle.active ) => ! rigIssues( tackle, slot ).some( ( p ) => BLOCKING.has( p ) || BAG_BLOCKING.has( p ) );

// Put a piece on a rig (slot defaults to the active one). Durable pieces need a free unit; consumables only need to be
// in the bag. A rod of another technique clears what doesn't fit it (a float on a spinning rod, a lure on a float rod).
// Returns true when it was put on.
export function equip( tackle, kind, id, slot = tackle.active ) {

	const T = TABLES[ kind ];
	if ( ! T || ! T[ id ] ) return false;
	const key = kind === 'lure' ? 'bait' : kind;
	let r = tackle.rigs[ slot ];
	if ( ! r ) r = tackle.rigs[ slot ] = { rod: null, reel: null, line: null, hook: null, float: null, sinker: null, bait: null };
	const v = ( kind === 'hook' || kind === 'float' || kind === 'sinker' ) ? Number( id ) : id;
	if ( r[ key ] === v ) return true;
	if ( DURABLE.has( kind ) ? free( tackle, kind, v, slot ) < 1 : count( tackle.bag, kind, v ) < 1 ) return false;
	r[ key ] = v;
	if ( kind === 'rod' ) {

		const tech = RODS[ v ].tech;
		if ( tech !== 'float' ) r.float = null;
		if ( tech !== 'bottom' ) r.sinker = null;
		if ( r.bait && isLure( r.bait ) !== ( tech === 'spin' ) ) r.bait = null;
		if ( tech === 'spin' ) r.hook = null;

	}

	return true;

}

export function unequip( tackle, kind, slot = tackle.active ) {

	const r = tackle.rigs[ slot ];
	if ( r ) r[ kind === 'lure' ? 'bait' : kind ] = null;

}

// What a fishing event costs (D66). event: 'bite' (one bait: landed, lost, stolen, missed), 'snap' (the end of the line:
// hook, float or sinker, the bait or the lure), 'rod' (the rod breaks, and the end of the line goes with it).
// Returns what was lost: [ [ kind, id ], … ].
export function spendFor( tackle, event, slot = tackle.active ) {

	const r = tackle.rigs[ slot ], lost = [];
	if ( ! r ) return lost;
	const take = ( kind, id ) => { if ( id != null && spend( tackle.bag, kind, id ) ) lost.push( [ kind, id ] ); };
	const lure = isLure( r.bait );
	if ( event === 'bite' ) {

		if ( r.bait && ! lure ) take( 'bait', r.bait );
		return lost;

	}

	// snap / rod: the whole end of the line
	if ( r.bait ) take( baitKind( r.bait ), r.bait );
	if ( ! lure && r.hook ) take( 'hook', r.hook );
	if ( RODS[ r.rod ]?.tech === 'float' && r.float ) take( 'float', r.float );
	if ( RODS[ r.rod ]?.tech === 'bottom' && r.sinker ) take( 'sinker', r.sinker );
	if ( event === 'rod' && r.rod ) {

		take( 'rod', r.rod );
		if ( free( tackle, 'rod', r.rod, slot ) < 0 || count( tackle.bag, 'rod', r.rod ) < inUse( tackle, 'rod', r.rod ) ) r.rod = null;

	}

	return lost;

}

// buy one purchase (a pack, or one rod / reel / spool / lure); false when it can't (money, level). Returns the price.
export function canBuy( kind, id, { money, level } ) {

	const price = packPrice( kind, id );
	if ( price == null ) return 'unknown';
	if ( level < pieceLevel( kind, id ) ) return 'level';
	if ( money < price ) return 'money';
	return null;

}

// what a durable piece fetches when sold (D68): half its price; only free units (not on a rig) can be sold
export const sellPrice = ( kind, id ) => Math.floor( ( packPrice( kind, id ) || 0 ) * SELL_SHARE );
export const canSell = ( tackle, kind, id ) => DURABLE.has( kind ) && free( tackle, kind, id ) >= 1 && sellPrice( kind, id ) > 0;

// ---- packs by species (D69): every piece of the right rod at 15 % off
export const PACK_DISCOUNT = 0.15;
export const PACKS = {
	trout: { species: [ 'rainbowTrout' ], rig: { rod: 'spinL', reel: 'r2500', line: 'f18', hook: null, float: null, sinker: null, bait: 'spin2' }, extra: [ [ 'lure', 'spin1' ], [ 'bait', 'eggs' ] ] },
	carp: { species: [ 'carp' ], rig: { rod: 'bottomM', reel: 'r4000', line: 'm30', hook: 4, float: null, sinker: 40, bait: 'corn' }, extra: [ [ 'bait', 'bread' ] ] },
	brownTrout: { species: [ 'brownTrout' ], rig: { rod: 'spinML', reel: 'r3000', line: 'f22', hook: null, float: null, sinker: null, bait: 'minnow' }, extra: [ [ 'lure', 'spoon' ] ] },
	capitan: { species: [ 'capitan' ], rig: { rod: 'floatL', reel: 'r2000', line: 'm20', hook: 6, float: 3, sinker: null, bait: 'worm' }, extra: [] },
};

// the purchases a pack is made of: [ [ kind, id ], … ]
export function packItems( pack ) {

	const r = pack.rig, out = [ [ 'rod', r.rod ], [ 'reel', r.reel ], [ 'line', r.line ] ];
	if ( r.hook ) out.push( [ 'hook', r.hook ] );
	if ( r.float ) out.push( [ 'float', r.float ] );
	if ( r.sinker ) out.push( [ 'sinker', r.sinker ] );
	if ( r.bait ) out.push( [ baitKind( r.bait ), r.bait ] );
	return out.concat( pack.extra );

}

export const packFullPrice = ( pack ) => packItems( pack ).reduce( ( s, [ k, id ] ) => s + packPrice( k, id ), 0 );
export const packCost = ( pack ) => Math.round( packFullPrice( pack ) * ( 1 - PACK_DISCOUNT ) );
export const packLevel = ( pack ) => Math.max( ...packItems( pack ).map( ( [ k, id ] ) => pieceLevel( k, id ) ) );

// ---- what a piece is good for (the shop's "for which fish" filter and panel), among the given species
export function goodFor( kind, id, species ) {

	return species.filter( ( s ) => {

		const p = PREFS[ s ];
		if ( ! p ) return false;
		switch ( kind ) {

			case 'rod': return p.power.includes( RODS[ id ].power );
			case 'reel': return true;
			case 'line': return LINES[ id ].d * LINES[ id ].vis <= p.lineD + 1e-9 && LINES[ id ].kg >= POWERS[ p.power[ 0 ] ].line[ 0 ];
			case 'hook': return Number( id ) >= p.hook[ 0 ] && Number( id ) <= p.hook[ 1 ];
			case 'bait': case 'lure': return p.best.includes( id );
			default: return false;

		}

	} );

}

// for a rig: the species that bite fully on it (biteMul ≥ 0.9) among the given ones
export const rigTargets = ( rig, species ) => species.filter( ( s ) => PREFS[ s ] && biteMul( s, rig ).total >= 0.9 );
