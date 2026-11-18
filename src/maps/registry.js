import { ISLAND } from './island.js';
import { Profiles } from '../game/Profiles.js';

// The maps of the game (docs/DISENO.md D17, D20, section 7d). One map is active per page load: changing map reloads
// the page (D6). The active map is, in order: ?map=<id> in the URL (for testing), the map saved in the active
// profile's game, or DEFAULT_MAP for a new game.
//   import { activeMap } from '../maps/registry.js';  activeMap().layout / .species / .spots / .licenses
export const MAPS = { [ ISLAND.id ]: ISLAND };
export const DEFAULT_MAP = ISLAND.id;

export const mapById = ( id ) => MAPS[ id ] || null;

// the map the page should load (see above); safe in Node (no window / storage: the default map)
export function currentMapId() {

	try {

		const q = typeof location !== 'undefined' ? new URLSearchParams( location.search ).get( 'map' ) : null;
		if ( q && MAPS[ q ] ) return q;
		if ( typeof localStorage === 'undefined' ) return DEFAULT_MAP;
		const profiles = new Profiles();
		const raw = localStorage.getItem( profiles.saveKey( profiles.active.id ) );
		const saved = raw ? JSON.parse( raw ).map : null;
		if ( saved && MAPS[ saved ] ) return saved;

	} catch ( e ) { /* blocked storage or a broken save: the default map */ }

	return DEFAULT_MAP;

}

let active = null;
export function activeMap() {

	return active || ( active = MAPS[ currentMapId() ] );

}
