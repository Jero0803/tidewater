import { ISLAND } from './island.js';
import { LAKE } from './lake.js';
import { Profiles } from '../game/Profiles.js';

// The maps of the game (docs/DISENO.md D17, D20, section 7d). One map is active per page load: changing map reloads
// the page (D6). The active map is, in order: ?map=<id> in the URL (for testing), the map saved in the active
// profile's game (a game from before maps: the island), or DEFAULT_MAP for a new game (the lake, D52).
//   import { activeMap } from '../maps/registry.js';  activeMap().layout / .species / .spots / .licenses
export const MAPS = { [ ISLAND.id ]: ISLAND, [ LAKE.id ]: LAKE };
export const DEFAULT_MAP = LAKE.id;

export const mapById = ( id ) => MAPS[ id ] || null;

// the map asked for in the address (?map=<id>), or null
export function mapOverride() {

	try {

		const q = typeof location !== 'undefined' ? new URLSearchParams( location.search ).get( 'map' ) : null;
		return q && MAPS[ q ] ? q : null;

	} catch ( e ) {

		return null;

	}

}

// the map the page should load (see above); safe in Node (no window: the island, which the tests and tools measure)
export function currentMapId() {

	try {

		const q = mapOverride();
		if ( q ) return q;
		// Node (tests, tools/balance): they measure the island
		if ( typeof window === 'undefined' || typeof localStorage === 'undefined' ) return ISLAND.id;
		const profiles = new Profiles();
		const id = profiles.active.id;
		const raw = localStorage.getItem( profiles.saveKey( id ) );
		const saved = raw ? JSON.parse( raw ).map : null;
		if ( saved && MAPS[ saved ] ) return saved;
		// a game saved before maps existed (version 1 / 2, only the first profile reads them) was on the island
		if ( ! raw && profiles.legacy( id ) && ( localStorage.getItem( 'tidewater.save.v2' ) || localStorage.getItem( 'tidewater.save.v1' ) ) ) return ISLAND.id;

	} catch ( e ) { /* blocked storage or a broken save: the default map */ }

	return DEFAULT_MAP;

}

let active = null;
export function activeMap() {

	return active || ( active = MAPS[ currentMapId() ] );

}
