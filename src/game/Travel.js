import { MAP_CATALOG } from '../maps/catalog.js';

// Travel between maps (docs/DISENO.md D20, D54, D57): by boat, from the mooring. Only to maps that are open and that
// the player's level has unlocked; moving between unlocked maps is always allowed. A trip costs one day of the
// destination's basic licence. The cooler / hold has to be empty (sell or release the fish first).
//   travelOptions( state, maps )  every map of the chain with what blocks a trip there
//   travel( state, id, maps )     pay and move the game to that map (the page then reloads into it)
// maps: the playable map definitions (maps/registry.js MAPS), passed in so this module stays light.

export const travelCost = ( maps, id ) => ( maps[ id ] && maps[ id ].licenses && maps[ id ].licenses[ 1 ] ? maps[ id ].licenses[ 1 ].price : 0 );

// why a trip to `id` can't be made now: 'here' | 'planned' | 'level' | 'cooler' | 'money', or null when it can
export function travelBlock( state, id, maps ) {

	const m = MAP_CATALOG.find( ( c ) => c.id === id );
	if ( ! m ) return 'planned';
	if ( id === state.mapId ) return 'here';
	if ( m.status !== 'open' || ! maps[ id ] ) return 'planned';
	if ( state.level < ( m.unlock || 1 ) ) return 'level';
	if ( state.inventory.length ) return 'cooler';
	if ( state.money < travelCost( maps, id ) ) return 'money';
	return null;

}

export function travelOptions( state, maps ) {

	return MAP_CATALOG.map( ( m ) => ( { ...m, cost: travelCost( maps, m.id ), block: travelBlock( state, m.id, maps ) } ) );

}

// pay and move the game to map `id`; false when the trip can't be made
export function travel( state, id, maps ) {

	if ( travelBlock( state, id, maps ) ) return false;
	state.money -= travelCost( maps, id );
	state.homeMap = null;
	state.mapId = id;
	state.map; // the destination's data (log, licences: the basic one free on a first visit)
	state.save();
	state.emit();
	return true;

}
