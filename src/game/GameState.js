import { FISH, fishLengthCm } from './FishTable.js';
import { defaultUpgrades, gearStats, nextLevel, UPGRADES, FUEL_PRICE, convertLegacyUpgrades } from './Gear.js';
import { catchXp, levelFromXp, activeLicenseTier, licenseSecondsLeft, withLicense, starterLicences, LICENSES, SIZE_CLASSES,
	sizeClass, classValue, releaseReason, licenseTierOf } from './Progression.js';

// Save version 3 (docs/DISENO.md D20, D44): v2 plus the Phase 1 shop (float rig by grade). Older saves are read from
// their own keys and converted (v1 -> v2 -> v3); the old keys are left untouched, so going back to an older build
// still finds the old game.
const SAVE_KEY = 'tidewater.save.v3';
const SAVE_KEY_V2 = 'tidewater.save.v2';
const SAVE_KEY_V1 = 'tidewater.save.v1';
export const START_MAP = 'island';
const PLAYED_SAVE_EVERY = 10; // seconds of play between saves of the played-time counter

// Everything the player owns, split as D20 says: what travels with the player (wallet, XP, played time, gear, the
// fish in the cooler / hold) and what belongs to each map (fish log and records, licences). Saved to localStorage
// (per browser) after every change; storage can be missing or throw (private windows, blocked site data), so every
// access is guarded and the game runs without it.
export class GameState {

	// key: where this game is saved (one per profile, see Profiles); legacy: may read and convert the older save
	// versions (only the first profile, the game from before profiles)
	constructor( storage = safeStorage(), { key = SAVE_KEY, legacy = true } = {} ) {

		this.storage = storage;
		this.key = key;
		this.legacy = legacy;
		this.onSaved = null; // ( state ) after each save (Profiles keeps the menu summary)
		this.money = 0;
		this.xp = 0; // total experience (Progression.levelFromXp gives the level)
		this.playedSeconds = 0; // time with the game running; licences count down in it (D19, D41)
		this._playedSavedAt = 0;
		this.hour = null; // game clock (0..24) when last saved; null = the world's default
		this.inventory = []; // { id, species, kg, cm, value, caughtAt (game hours), record }
		this.mapId = START_MAP;
		this.maps = { [ START_MAP ]: newMapData() }; // map id -> { log, licences }
		// the last addFish (the catch card): { species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept,
		// cls (size class id), xp (gained), level, levelUp (levels gained), reason (why released: 'juvenile' | 'protected'
		// | 'license' | 'full' | null), tier (licence tier the species needs) }
		this.lastCatch = null;
		this.upgrades = defaultUpgrades();
		this.fuel = null; // litres left (null = full tank)
		this._nextId = 1;
		this.listeners = new Set();

	}

	// ---- data of the current map
	get map() {

		return this.maps[ this.mapId ] || ( this.maps[ this.mapId ] = newMapData() );

	}

	get log() { return this.map.log; } // species -> { count, bestKg, bestCm }
	set log( v ) { this.map.log = v; }
	get licences() { return this.map.licences; } // tier -> expires at (played seconds)
	set licences( v ) { this.map.licences = v; }

	// ---- experience and level
	get level() {

		return levelFromXp( this.xp ).level;

	}

	// add experience; returns how many levels it went up (0 most of the time)
	addXp( amount ) {

		const before = this.level;
		this.xp += Math.max( 0, Math.round( amount ) );
		this.save();
		this.emit();
		return this.level - before;

	}

	// ---- licences of the current map
	get licenseTier() {

		return activeLicenseTier( this.licences, this.playedSeconds );

	}

	get licenseSecondsLeft() {

		return licenseSecondsLeft( this.licences, this.playedSeconds );

	}

	// why a licence can't be bought now ('level' | 'money'), or null when it can
	licenseBlock( tier ) {

		const L = LICENSES[ tier ];
		if ( ! L ) return 'unknown';
		if ( this.level < L.minLevel ) return 'level';
		if ( this.money < L.price ) return 'money';
		return null;

	}

	// buy (or extend by a day) a licence tier of the current map; false when it can't be bought
	buyLicense( tier ) {

		if ( this.licenseBlock( tier ) ) return false;
		this.money -= LICENSES[ tier ].price;
		this.licences = withLicense( this.licences, tier, this.playedSeconds );
		this.save();
		this.emit();
		return true;

	}

	// ---- played time: called every frame with the frame time; saved every few seconds, not every frame
	addPlayed( dt ) {

		if ( ! ( dt > 0 ) ) return;
		this.playedSeconds += Math.min( dt, 1 ); // a long stall (tab in the background) is not play
		if ( this.playedSeconds - this._playedSavedAt >= PLAYED_SAVE_EVERY ) this.save();

	}

	get stats() {

		return gearStats( this.upgrades );

	}

	get holdKg() {

		let kg = 0;
		for ( const f of this.inventory ) kg += f.kg;
		return kg;

	}

	get holdValue() {

		let v = 0;
		for ( const f of this.inventory ) v += f.value;
		return v;

	}

	// room in the cooler / hold for a fish of `kg`?
	fits( kg ) {

		return this.holdKg + kg <= this.stats.holdKg + 1e-6;

	}

	// store a caught fish; returns the entry, or null when it has to go back (juvenile, protected, no licence for it,
	// hold full). Either way it is logged and gives XP (D13). A record beats an earlier catch of the species; the
	// first one of a species is a new species. Values follow the size classes (Progression.classValue).
	addFish( species, kg, timeOfDay = 12 ) {

		kg = Math.round( kg * 100 ) / 100;
		const cm = Math.round( fishLengthCm( species, kg ) );
		const logEntry = this.log[ species ] || ( this.log[ species ] = { count: 0, bestKg: 0 } );
		const newSpecies = logEntry.count === 0;
		const prevBestKg = logEntry.bestKg, prevBestCm = logEntry.bestCm ?? ( prevBestKg > 0 ? Math.round( fishLengthCm( species, prevBestKg ) ) : 0 );
		const record = ! newSpecies && kg > prevBestKg;
		logEntry.count ++;
		if ( kg > prevBestKg ) {

			logEntry.bestKg = kg;
			logEntry.bestCm = cm;

		}

		const cls = sizeClass( species, kg ).id;
		const value = classValue( species, kg );
		const reason = releaseReason( species, kg, this.licenseTier ) || ( this.fits( kg ) ? null : 'full' );
		const kept = ! reason;
		const levelBefore = this.level;
		const xp = catchXp( species, kg, { newSpecies } );
		this.xp += xp;
		const level = this.level;
		this.lastCatch = { species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept, cls, xp, level, levelUp: level - levelBefore, reason, tier: licenseTierOf( species ) };
		if ( ! kept ) {

			this.save();
			this.emit();
			return null;

		}

		const f = { id: this._nextId ++, species, kg, cm, value, caughtAt: timeOfDay, record, cls };
		this.inventory.push( f );
		this.save();
		this.emit();
		return f;

	}

	// sell the given fish ids (all when omitted); returns the money made
	sell( ids = null ) {

		const keep = [], sold = [];
		for ( const f of this.inventory ) ( ids === null || ids.includes( f.id ) ? sold : keep ).push( f );
		let total = 0;
		for ( const f of sold ) total += f.value;
		this.inventory = keep;
		this.money += total;
		this.save();
		this.emit();
		return { total, count: sold.length };

	}

	release( id ) {

		this.inventory = this.inventory.filter( ( f ) => f.id !== id );
		this.save();
		this.emit();

	}

	// spend money (upgrade shop); false when it can't be afforded
	spend( amount ) {

		if ( amount > this.money ) return false;
		this.money -= amount;
		this.save();
		this.emit();
		return true;

	}

	// buy the next level of an upgrade track; returns the new level entry or null
	buy( key ) {

		if ( ! UPGRADES[ key ] ) return null;
		const next = nextLevel( this.upgrades, key );
		if ( ! next || next.cost > this.money ) return null;
		this.money -= next.cost;
		this.upgrades[ key ] = next.index;
		if ( key === 'fuel' ) this.fuel = null; // a new tank comes full
		this.save();
		this.emit();
		return next;

	}

	get fuelL() {

		return this.fuel === null ? this.stats.fuelL : Math.min( this.fuel, this.stats.fuelL );

	}

	// burn litres (no save: that happens when the boat stops or at the next sale / purchase)
	burn( litres ) {

		this.fuel = Math.max( 0, this.fuelL - litres );
		return this.fuel;

	}

	refuelCost() {

		return Math.ceil( ( this.stats.fuelL - this.fuelL ) * FUEL_PRICE );

	}

	// fill up as far as the money goes; returns litres bought
	refuel() {

		const missing = this.stats.fuelL - this.fuelL;
		const litres = Math.min( missing, Math.floor( this.money / FUEL_PRICE ) );
		if ( litres <= 0 ) return 0;
		this.money -= Math.ceil( litres * FUEL_PRICE );
		this.fuel = this.fuelL + litres;
		if ( this.fuel >= this.stats.fuelL - 1e-3 ) this.fuel = null;
		this.save();
		this.emit();
		return litres;

	}

	onChange( fn ) {

		this.listeners.add( fn );
		return () => this.listeners.delete( fn );

	}

	emit() {

		for ( const fn of this.listeners ) fn( this );

	}

	toJSON() {

		return {
			v: 3,
			// travels with the player (D20)
			money: this.money, xp: this.xp, playedSeconds: this.playedSeconds, hour: this.hour, upgrades: this.upgrades, fuel: this.fuel,
			inventory: this.inventory, nextId: this._nextId,
			// per map
			map: this.mapId, maps: this.maps,
		};

	}

	fromJSON( d ) {

		if ( d && d.v === 1 ) d = convertV1( d );
		if ( d && d.v === 2 ) {

			d = convertV2( d );
			this.gearConverted = d.gearConverted; // { rig, refund, spent }: told to the player once (Game)

		}

		if ( ! d || d.v !== 3 ) return false;
		this.money = finite( d.money );
		this.xp = Math.max( 0, finite( d.xp ) );
		this.playedSeconds = Math.max( 0, finite( d.playedSeconds ) );
		this._playedSavedAt = this.playedSeconds;
		this.hour = Number.isFinite( d.hour ) ? ( ( d.hour % 24 ) + 24 ) % 24 : null;
		this.inventory = Array.isArray( d.inventory ) ? d.inventory.filter( ( f ) => f && FISH[ f.species ] && Number.isFinite( f.kg ) ) : [];
		// saves from before lengths were recorded
		for ( const f of this.inventory ) if ( ! Number.isFinite( f.cm ) ) f.cm = Math.round( fishLengthCm( f.species, f.kg ) );
		this.maps = {};
		for ( const [ id, m ] of Object.entries( d.maps && typeof d.maps === 'object' ? d.maps : {} ) ) this.maps[ id ] = cleanMapData( m );
		this.mapId = typeof d.map === 'string' ? d.map : START_MAP;
		this.map; // make sure the current map has its data
		this.upgrades = { ...defaultUpgrades(), ...( d.upgrades || {} ) };
		this.fuel = Number.isFinite( d.fuel ) ? d.fuel : null;
		this._nextId = Math.max( d.nextId | 0, ...this.inventory.map( ( f ) => f.id + 1 ), 1 );
		return true;

	}

	save() {

		if ( ! this.storage ) return;
		this._playedSavedAt = this.playedSeconds;
		try {

			this.storage.setItem( this.key, JSON.stringify( this.toJSON() ) );
			if ( this.onSaved ) this.onSaved( this );

		} catch ( e ) { /* storage full or blocked: keep playing */ }

	}

	// load the version 3 save; without one, convert the newest older save (and write it as version 3)
	load() {

		if ( ! this.storage ) return false;
		try {

			const raw = this.storage.getItem( this.key );
			if ( raw ) return this.fromJSON( JSON.parse( raw ) );
			if ( ! this.legacy ) return false;
			const old = this.storage.getItem( SAVE_KEY_V2 ) || this.storage.getItem( SAVE_KEY_V1 );
			if ( ! old || ! this.fromJSON( JSON.parse( old ) ) ) return false;
			this.save();
			return true;

		} catch ( e ) {

			return false;

		}

	}

	reset() {

		this.money = 0;
		this.xp = 0;
		this.playedSeconds = 0;
		this.hour = null;
		this.inventory = [];
		this.mapId = START_MAP;
		this.maps = { [ START_MAP ]: newMapData() };
		this.upgrades = defaultUpgrades();
		this.fuel = null;
		this.save();
		this.emit();

	}

}

const finite = ( x ) => ( Number.isFinite( x ) ? x : 0 );

// a map the player has not fished yet: empty log and the free basic licence for the first day (D18)
function newMapData() {

	return { log: {}, licences: starterLicences() };

}

function cleanMapData( m ) {

	const log = m && m.log && typeof m.log === 'object' ? m.log : {};
	for ( const [ k, v ] of Object.entries( log ) ) if ( FISH[ k ] && v && v.bestKg > 0 && ! Number.isFinite( v.bestCm ) ) v.bestCm = Math.round( fishLengthCm( k, v.bestKg ) );
	const licences = {};
	for ( const [ tier, until ] of Object.entries( m && m.licences && typeof m.licences === 'object' ? m.licences : {} ) ) if ( LICENSES[ tier ] && Number.isFinite( until ) ) licences[ tier ] = until;
	return { log, licences };

}

// XP the fish in an old log would have given (D44): the best of each species with its real weight and the bonus of
// a new species, every other catch as a typical one (the middle of the common class).
export function xpFromLog( log ) {

	const i = SIZE_CLASSES.findIndex( ( c ) => c.id === 'common' );
	const tMid = ( SIZE_CLASSES[ i - 1 ].upTo + SIZE_CLASSES[ i ].upTo ) / 2;
	let xp = 0;
	for ( const [ species, e ] of Object.entries( log || {} ) ) {

		if ( ! FISH[ species ] || ! e || ! ( e.count > 0 ) ) continue;
		const [ lo, hi ] = FISH[ species ].kg;
		const typical = lo + tMid * ( hi - lo );
		xp += catchXp( species, e.bestKg > 0 ? e.bestKg : typical, { newSpecies: true } );
		xp += ( e.count - 1 ) * catchXp( species, typical );

	}

	return xp;

}

// version 1 -> 2 (D44): money, cooler, gear and log are kept as they are; the log goes to the island; the starting XP
// is what the logged fish would have given; the basic licence is given for the first day. (The gear changes format
// with the new shop, Phase 1 delivery 6, and is converted then.)
function convertV1( d ) {

	const log = d.log && typeof d.log === 'object' ? d.log : {};
	return {
		v: 2, money: d.money, xp: xpFromLog( log ), playedSeconds: 0, upgrades: d.upgrades, fuel: d.fuel,
		inventory: d.inventory, nextId: d.nextId,
		map: START_MAP, maps: { [ START_MAP ]: { log, licences: starterLicences() } },
	};

}

// version 2 -> 3 (D44): the old line / reel / rod / hold / tank / engine become the Phase 1 shop; what the old line,
// reel and rod cost beyond the float rig grade they reach comes back as money (Gear.convertLegacyUpgrades)
function convertV2( d ) {

	const c = convertLegacyUpgrades( d.upgrades || {} );
	return { ...d, v: 3, upgrades: c.upgrades, money: finite( d.money ) + c.refund, gearConverted: { rig: c.upgrades.rig, refund: c.refund, spent: c.spent } };

}

function safeStorage() {

	try {

		return typeof localStorage !== 'undefined' ? localStorage : null;

	} catch ( e ) {

		return null;

	}

}
