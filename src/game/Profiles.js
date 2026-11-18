import { loc } from '../i18n.js';

// Save profiles: up to MAX_PROFILES named games in this browser, each with its own save (GameState) under its own
// key. The index (which games exist, which one is active, a summary of each for the menus) lives in INDEX_KEY.
// The first profile, 'p1', is the game that existed before profiles: it keeps the original save key and is the only
// one that reads (and converts) the older save versions. Ids are never reused, so a deleted p1 never comes back.
//   const profiles = new Profiles();  profiles.active  profiles.list  profiles.create( name )  profiles.remove( id )
export const MAX_PROFILES = 5;
export const INDEX_KEY = 'tidewater.profiles';
export const FIRST_PROFILE = 'p1';
const BASE_SAVE_KEY = 'tidewater.save.v3';

export class Profiles {

	constructor( storage = safeStorage() ) {

		this.storage = storage;
		this.data = this._load();

	}

	get list() {

		return this.data.list;

	}

	get active() {

		return this.data.list.find( ( p ) => p.id === this.data.active ) || this.data.list[ 0 ];

	}

	get full() {

		return this.data.list.length >= MAX_PROFILES;

	}

	// where a profile's game is saved, and whether it may read the pre-profile saves (v2 / v1)
	saveKey( id ) {

		return id === FIRST_PROFILE ? BASE_SAVE_KEY : `${ BASE_SAVE_KEY }.${ id }`;

	}

	legacy( id ) {

		return id === FIRST_PROFILE;

	}

	// a new, empty game; null when there are already MAX_PROFILES. A blank name becomes "Game N".
	create( name = '' ) {

		if ( this.full ) return null;
		const n = this.data.next ++;
		const clean = String( name ).replace( /\s+/g, ' ' ).trim().slice( 0, 24 );
		const p = { id: `p${ n }`, name: clean || defaultName( n ), created: Date.now(), lastPlayed: null, summary: null };
		this.data.list.push( p );
		this._save();
		return p;

	}

	// delete a game and its save. When it was the active one, the next game becomes active (a new one when none is
	// left). Returns the active profile afterwards.
	remove( id ) {

		const i = this.data.list.findIndex( ( p ) => p.id === id );
		if ( i < 0 ) return this.active;
		this.data.list.splice( i, 1 );
		try {

			if ( this.storage ) this.storage.removeItem( this.saveKey( id ) );

		} catch ( e ) { /* blocked storage: nothing to delete */ }

		if ( ! this.data.list.length ) this.create();
		if ( this.data.active === id ) this.data.active = this.data.list[ 0 ].id;
		this._save();
		return this.active;

	}

	setActive( id ) {

		if ( ! this.data.list.some( ( p ) => p.id === id ) ) return false;
		this.data.active = id;
		this._save();
		return true;

	}

	// after each save of a game: what the menus show (level, money, played seconds) and when it was last played
	touch( id, summary ) {

		const p = this.data.list.find( ( q ) => q.id === id );
		if ( ! p ) return;
		p.summary = summary;
		p.lastPlayed = Date.now();
		this._save();

	}

	_load() {

		let d = null;
		try {

			const raw = this.storage && this.storage.getItem( INDEX_KEY );
			d = raw ? JSON.parse( raw ) : null;

		} catch ( e ) {

			d = null;

		}

		const list = Array.isArray( d && d.list ) ? d.list.filter( ( p ) => p && typeof p.id === 'string' && /^p\d+$/.test( p.id ) ).slice( 0, MAX_PROFILES ) : [];
		for ( const p of list ) if ( typeof p.name !== 'string' || ! p.name.trim() ) p.name = defaultName( Number( p.id.slice( 1 ) ) );
		const maxId = list.reduce( ( m, p ) => Math.max( m, Number( p.id.slice( 1 ) ) ), 0 );
		const data = { active: d && d.active, next: Math.max( Number( d && d.next ) || 0, maxId + 1 ), list };
		if ( ! list.length ) {

			// first run with profiles: the existing game (if any) becomes "Game 1"
			list.push( { id: FIRST_PROFILE, name: defaultName( 1 ), created: Date.now(), lastPlayed: null, summary: null } );
			data.next = Math.max( data.next, 2 );

		}

		if ( ! list.some( ( p ) => p.id === data.active ) ) data.active = list[ 0 ].id;
		this.data = data;
		this._save();
		return data;

	}

	_save() {

		try {

			if ( this.storage ) this.storage.setItem( INDEX_KEY, JSON.stringify( this.data ) );

		} catch ( e ) { /* storage full or blocked: keep playing */ }

	}

}

const defaultName = ( n ) => loc( `Game ${ n }`, `Partida ${ n }` );

function safeStorage() {

	try {

		return typeof localStorage !== 'undefined' ? localStorage : null;

	} catch ( e ) {

		return null;

	}

}
