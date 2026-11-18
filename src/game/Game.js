import { loc } from '../i18n.js';
import { Vector3, Color } from '../engine/index.js';
import { WORLD } from '../world/WorldLayout.js';
import { FISH } from './FishTable.js';
import { habitatAt, pickSpecies, rollWeight, biteDelay } from './Bites.js';
import { CatchMinigame } from './CatchMinigame.js';
import { GameState } from './GameState.js';
import { Profiles } from './Profiles.js';
import { activeMap } from '../maps/registry.js';
import { FishingRod } from './FishingRod.js';
import { FishStand } from './FishStand.js';
import { Chandlery } from './Chandlery.js';
import { CatchDisplay } from './CatchDisplay.js';
import { UPGRADES, fuelBurn } from './Gear.js';
import { GameHUD, releaseText, licenseName } from './GameHUD.js';
import { LICENSES, LICENSE_WARN_SECONDS } from './Progression.js';
import { spotOf } from './Spots.js';
import { Minimap } from './Minimap.js';
import { Guide } from './Guide.js';

// how long the catch card stays up unless dismissed (ms)
const CATCH_CARD_MS = 9000;

// The fishing game on top of the world:
//   R          take out / put away the rod (on foot, on the pier, on the boat's deck)
//   hold LMB   wind up, release to cast (hold longer = farther)
//   LMB        strike when a fish takes the bobber ("!"); then hold LMB to reel, let go to ease off
//   RMB        reel an empty line back in
//   I / Tab    cooler / hold contents and the fish log
//   E          at the fish stand: sell your catch
export class Game {

	constructor( app ) {

		this.app = app;
		// the active save profile (Profiles; chosen on the start screen or in the panel, H -> Game)
		this.profiles = new Profiles();
		const prof = this.profile = this.profiles.active;
		this.state = new GameState( undefined, { key: this.profiles.saveKey( prof.id ), legacy: this.profiles.legacy( prof.id ) } );
		this.state.onSaved = ( s ) => this.profiles.touch( prof.id, { level: s.level, money: s.money, played: Math.round( s.playedSeconds ), map: s.mapId } );
		this.state.load();
		// the map this page loaded (maps/registry.js): its log and licences become the current ones
		this.map = activeMap();
		this.state.mapId = this.map.id;
		// the game clock carries on from the saved hour (D16)
		if ( this.state.hour !== null && ! ( app.qs && app.qs.has( 'bench' ) ) ) app.settings.timeOfDay = this.state.hour;
		this.rod = new FishingRod( { scene: app.scene, camera: app.camera, query: app.query, terrain: app.terrainData, audio: app.audio } );
		this.rod.onLand = ( where ) => this.onBobberLanded( where );
		this.stand = new FishStand( { scene: app.scene, terrain: app.terrainData, colliders: app.colliders } );
		this.display = new CatchDisplay( { scene: app.scene, stall: this.stand.iceFish() } );
		this.landing = null; // { species, kg } while the caught fish swings in view
		this.chandlery = new Chandlery( { scene: app.scene, terrain: app.terrainData, colliders: app.colliders, material: this.stand.material } );
		this.vendors = [ this.stand.vendor, this.chandlery.vendor ];
		// boat upgrades: engine (thrust / top speed) and deck floodlights for night fishing
		const b = app.boatCtl;
		this._engineBase = { maxThrust: b.maxThrust, pitchSpeed: b.pitchSpeed };
		this.floods = [];
		if ( app.localLights ) this.addFloodlights( app.localLights, app.boat );
		this._fuelOut = false;
		this._sonarT = 0;
		this._sonar = null;
		this.hud = null;
		this.fight = null; // CatchMinigame while a fish is on
		this.bite = null; // { phase: 'wait' | 'nibble' | 'take', t, nibbles, species, kg }
		this._lmb = false;
		this._rmb = false;
		this._hookedSpecies = null;
		this._pier = WORLD.pier;
		this._tmp = new Vector3();
		this._licTier = this.state.licenseTier; // to tell when a licence runs out
		// an old save's gear was converted to the new shop: say so once the HUD is up (D44)
		this._gearNote = this.state.gearConverted || null;
		this._licWarned = false;
		this.applyGear();
		this.state.onChange( () => this.applyGear() );

	}

	applyGear() {

		const g = this.state.stats;
		this.rod.setGear( { castM: g.castM, reelSpeed: g.reelSpeed } );
		const b = this.app.boatCtl;
		if ( b && this._engineBase ) {

			b.maxThrust = this._engineBase.maxThrust * g.speedMul * g.speedMul;
			b.pitchSpeed = this._engineBase.pitchSpeed * g.speedMul;

		}

		for ( const f of this.floods || [] ) f.scale = g.deckLights ? 1 : 0;

	}

	// two floodlights under the back of the wheelhouse roof, lighting the cockpit and the water
	// astern (night only, like every local light; switched by the lights upgrade)
	addFloodlights( lights, boat ) {

		const obj = boat.group;
		for ( const x of [ - 0.8, 0.8 ] ) {

			const local = new Vector3( x, 2.25, - 1.0 );
			const localDir = new Vector3( x * 0.25, - 0.75, - 0.62 ).normalize();
			const src = {
				position: new Vector3(), color: new Color( 1.0, 0.93, 0.8 ), intensity: 3.2, range: 14, kind: 'boatFlood',
				dir: new Vector3(), cosInner: 0.8, cosOuter: 0.45, scale: 0,
				update() {

					obj.updateWorldMatrix( true, false );
					this.position.copy( local ).applyMatrix4( obj.matrixWorld );
					this.dir.copy( localDir ).transformDirection( obj.matrixWorld );

				},
			};
			src.update();
			this.floods.push( src );
			lights.add( src );

		}

	}

	buy( key ) {

		const r = this.state.buy( key );
		if ( r ) this.toast( `${ UPGRADES[ key ].name }: ${ r.label }` );
		return r;

	}

	// ---- save profiles: every change reloads the page into the chosen game (like the language)
	switchProfile( id ) {

		if ( id === this.profile.id ) return;
		this.state.save();
		if ( this.profiles.setActive( id ) ) this._reload();

	}

	newProfile( name ) {

		const p = this.profiles.create( name );
		if ( ! p ) return null;
		this.state.save();
		this.profiles.setActive( p.id );
		this._reload();
		return p;

	}

	deleteProfile( id ) {

		if ( id !== this.profile.id ) {

			this.profiles.remove( id );
			return false;

		}

		// the game being played: stop saving it, then load the next one
		this.state.storage = null;
		this.profiles.remove( id );
		this._reload();
		return true;

	}

	_reload() {

		if ( typeof location !== 'undefined' ) location.reload();

	}

	// buy or extend a licence of this map (the shop)
	buyLicense( tier ) {

		const ok = this.state.buyLicense( tier );
		if ( ok ) {

			this._licTier = this.state.licenseTier;
			this._licWarned = false;
			this.toast( loc( `${ licenseName( tier ) } licence · ${ Math.ceil( this.state.licenseSecondsLeft / 60 ) } min of play`, `Licencia ${ licenseName( tier ).toLowerCase() } · ${ Math.ceil( this.state.licenseSecondsLeft / 60 ) } min de juego` ) );
			if ( this.app.audio && this.app.audio.coin ) this.app.audio.coin();

		}

		return ok;

	}

	// played time and the licence clock (D19, D41: runs while the game runs, also with the day paused)
	updateLicence( dt ) {

		const s = this.state;
		// the clock is saved with the played time; not in photo mode, where the panel can move the hour (D42)
		if ( ! this.photo ) s.hour = this.app.settings.timeOfDay;
		s.addPlayed( dt );
		const tier = s.licenseTier, left = s.licenseSecondsLeft;
		if ( tier < this._licTier ) {

			const was = licenseName( this._licTier );
			this.toast( tier
				? loc( `${ was } licence expired · renew it at Marta's`, `Venció la licencia ${ was.toLowerCase() } · renuévala con Marta` )
				: loc( 'Licence expired · fish go back until you renew it', 'Venció tu licencia · sueltas los peces hasta renovarla' ), 5200 );
			this._licWarned = false;
			s.emit();

		} else if ( tier && left < LICENSE_WARN_SECONDS && ! this._licWarned ) {

			this._licWarned = true;
			const min = Math.ceil( left / 60 );
			this.toast( loc( `${ licenseName( tier ) } licence: ${ min } min left`, `Licencia ${ licenseName( tier ).toLowerCase() }: quedan ${ min } min` ), 3600 );

		}

		this._licTier = tier;

	}

	// after a catch: level up message (and what the new level opens)
	announceLevel( info ) {

		if ( ! info || ! info.levelUp ) return;
		const opens = LICENSES.filter( ( L ) => L && L.minLevel > info.level - info.levelUp && L.minLevel <= info.level );
		const extra = opens.length ? loc( ` · ${ licenseName( opens[ 0 ].tier ).toLowerCase() } licence for sale`, ` · ya puedes comprar la licencia ${ licenseName( opens[ 0 ].tier ).toLowerCase() }` ) : '';
		this.toast( `${ loc( `Level ${ info.level }!`, `¡Nivel ${ info.level }!` ) }${ extra }`, 4200 );

	}

	refuel() {

		const l = this.state.refuel();
		if ( l > 0 ) {

			this._fuelOut = false;
			this.toast( `${ loc( 'Filled up', 'Tanque lleno' ) } · ${ l.toFixed( 0 ) } L` );

		}

		return l;

	}

	toast( text, ms = 2600 ) {

		if ( this.hud ) this.hud.toast( text, ms );
		else console.log( '[game]', text );

	}

	get photo() {

		const app = this.app;
		return !! ( app.ui && app.ui.ui && app.ui.ui.photoMode );

	}

	get canFish() {

		const app = this.app, p = app.player;
		return ! app.freeCam && ( p.mode === 'walk' || p.mode === 'deck' ) && ! ( app.ui && app.ui.ui && app.ui.ui._photo );

	}

	// ---- per frame (after the player / camera update)
	update( dt ) {

		const app = this.app, p = app.player, inp = app.input, rod = this.rod;
		this._cardDismissed = false;
		if ( ! this.hud && app.ui && app.ui.ui && typeof document !== 'undefined' && document.head ) {

			const ui = app.ui.ui;
			this.hud = new GameHUD( ui, this );
			// the minimap (lower right) and the first-play guide (intro, one-time tips; replay from F1)
			this.minimap = new Minimap( ui.hud || ui.root, this );
			this.guide = new Guide( ui, this, this.minimap );
			ui.onReplayGuide = () => this.guide.replay();

		}

		this.updateLicence( dt );
		if ( this._gearNote && this.hud ) {

			const g = this._gearNote;
			this._gearNote = null;
			this.toast( loc( `New shop: your line, reel and rod are now a grade ${ g.rig } float rig${ g.refund ? ` · $${ g.refund } back` : '' }`, `Tienda nueva: tu sedal, carrete y caña ahora son un aparejo de flotador grado ${ g.rig }${ g.refund ? ` · te devolvimos $${ g.refund }` : '' }` ), 7000 );

		}

		const can = this.canFish;
		if ( inp.hit( 'KeyR' ) && can && ! this.fight ) {

			rod.equip( ! rod.equipped );
			if ( ! rod.equipped ) this.cancelLine();
			this.toast( rod.equipped ? loc( 'Rod out · hold left mouse to cast', 'Caña lista · mantén el clic izquierdo para lanzar' ) : loc( 'Rod away', 'Caña guardada' ), 1600 );

		}

		if ( ! can && rod.equipped ) {

			// swimming, driving, free camera: the line comes in and the rod goes away
			this.cancelLine( true );
			rod.equip( false );

		}

		if ( this.hud && ( inp.hit( 'KeyI' ) || inp.hit( 'Tab' ) ) ) this.hud.toggleInventory();
		if ( this.hud && inp.hit( 'Escape' ) ) {

			this.hud.toggleInventory( false );
			this.hud.closeStand();

		}

		// mouse edges (the left button also looks around while the pointer isn't captured)
		const lmb = inp.mouseDown && inp.enabled, rmb = inp.rightDown && inp.enabled;
		const lDown = lmb && ! this._lmb, lUp = ! lmb && this._lmb, rDown = rmb && ! this._rmb;
		this._lmb = lmb;
		this._rmb = rmb;
		const panelOpen = this.hud && ( this.hud.invOpen || this.hud.standOpen );

		if ( rod.equipped && ! panelOpen ) {

			if ( rod.state === 'idle' && lDown ) rod.startWindup();
			else if ( rod.state === 'windup' && lUp ) rod.release();
			else if ( rod.state === 'floating' ) {

				if ( lDown ) this.strike();
				else if ( rDown ) {

					rod.retrieve();
					this.bite = null;

				}

			} else if ( rod.state === 'flying' && rDown ) rod.retrieve();

		}

		// bites and the fight
		if ( rod.state === 'floating' ) this.updateBite( dt );
		else if ( ! this.fight ) rod.dip = Math.max( 0, rod.dip - dt * 4 );
		if ( this.fight ) this.updateFight( dt, lmb && ! panelOpen );

		rod.update( dt, { visible: can, fight: this.fight } );
		// the landed fish hangs on the end of the line, turned to face you, then goes in the cooler. With
		// the HUD the catch card comes up once the fish has swung in, and the fish stays (slowly turning)
		// until the card is dismissed (click, E, Esc) or times out.
		const L = this.landing;
		if ( L && rod.state === 'landing' && can ) {

			const c = app.camera.position, m = rod.bobber;
			let yaw = Math.atan2( c.x - m.x, c.z - m.z );
			if ( L.card ) {

				if ( ! L.shown && rod.t > 0.3 ) {

					L.shown = true;
					this.hud.showCatch( L.card, CATCH_CARD_MS );

				}

				if ( L.shown ) {

					// a slow turn so both flanks show
					L.cardT += dt;
					yaw += Math.sin( L.cardT * 0.7 ) * 0.55;
					if ( lDown || inp.hit( 'KeyE' ) || inp.hit( 'Escape' ) || L.cardT > CATCH_CARD_MS / 1000 ) {

						this._cardDismissed = true; // this frame's E / click belong to the card
						this.endLanding();

					}

				}

			}

			if ( this.landing ) {

				// with the HUD the fish is shown on the full-screen catch card (studio portrait), not on
				// the line; without it (headless) it hangs on the line for a moment
				if ( ! L.card ) this.display.show( L.species, L.kg, m, yaw, dt );
				else if ( this.display.shown ) this.display.hide();
				if ( ! L.card && rod.t > 2.8 ) this.endLanding();

			}

		} else if ( this.landing || this.display.shown ) this.endLanding();

		p.busy = rod.lineInWater || rod.state === 'windup';

		this.updateBoat( dt );

		// the traders
		for ( const v of this.vendors ) v.update( dt, p.mode === 'walk' ? p.position : null );
		this.updateVendors( inp, p );

		// prompts when the player has nothing to say
		if ( ! p.prompt && can ) p.prompt = this.prompt();

		const aboard = p.mode === 'boat' || p.mode === 'deck';
		// the catch card's live fish portrait (or one queued thumbnail)
		if ( this.hud && this.hud.portrait ) this.hud.portrait.update( dt );
		if ( this.hud ) this.hud.update( {
			fuel: aboard ? { litres: this.state.fuelL, tank: this.state.stats.fuelL } : null,
			sonar: aboard && this.state.stats.finder ? this._sonar : null,
			fight: this.fight,
			casting: rod.state === 'windup',
			power: rod.power,
			bite: this.bite && this.bite.phase === 'take',
			aiming: rod.equipped,
		} );
		if ( this.minimap ) this.minimap.update( dt );
		if ( this.guide ) this.guide.update( dt );

	}

	prompt() {

		const rod = this.rod, p = this.app.player;
		if ( ! rod.equipped ) {

			// by the water (boat deck, pier, the wet beach, wading): suggest the rod
			const byWater = p.mode === 'deck' || ( p.mode === 'walk' && [ 'wood', 'wetsand', 'water' ].includes( p.surface ) );
			return byWater ? { key: 'R', text: loc( 'Take out the rod', 'Sacar la caña' ) } : null;

		}

		const b = this.bite;
		switch ( rod.state ) {

			case 'idle': return { key: loc( 'LMB', 'Clic izq' ), text: loc( 'Hold to wind up, release to cast   ·   R  put the rod away', 'Mantén para cargar, suelta para lanzar   ·   R  guardar la caña' ) };
			case 'windup': return { key: loc( 'LMB', 'Clic izq' ), text: loc( 'Release to cast (hold longer to cast farther)', 'Suelta para lanzar (mantén más tiempo para llegar más lejos)' ) };
			case 'flying': return null;
			case 'floating':
				if ( b && b.phase === 'take' ) return { key: loc( 'LMB', 'Clic izq' ), text: loc( 'Strike now!', '¡Clava ahora!' ) };
				if ( b && b.phase === 'nibble' ) return { key: '…', text: loc( 'Something\'s nibbling · wait until the bobber is pulled under', 'Algo está picando · espera a que la boya se hunda' ) };
				return { key: loc( 'RMB', 'Clic der' ), text: loc( 'Waiting for a bite · right-click to reel the line in', 'Esperando una picada · clic derecho para recoger el sedal' ) };
			case 'retrieving': return { key: loc( 'RMB', 'Clic der' ), text: loc( 'Reeling in', 'Recogiendo' ) };
			case 'fighting': return this.fight && this.fight.tension > this.fight.band[ 1 ]
				? { key: loc( 'LMB', 'Clic izq' ), text: loc( 'Too much tension · let go!', 'Demasiada tensión · ¡suelta!' ) }
				: { key: loc( 'LMB', 'Clic izq' ), text: loc( 'Hold to reel · let go when the tension goes red', 'Mantén para recoger · suelta cuando la tensión llegue al rojo' ) };
			case 'landing': return null;
			default: return null;

		}

	}

	// fuel burn at the helm (the engine stops when the tank is dry) and the fish finder
	updateBoat( dt ) {

		const app = this.app, b = app.boatCtl, p = app.player, s = this.state;
		if ( b.driven ) {

			const left = s.burn( fuelBurn( b.rpm ) * dt );
			if ( left <= 0 ) {

				b.throttle = 0;
				if ( ! this._fuelOut ) this.toast( loc( 'Out of fuel · buy diesel at the chandlery by the boathouse', 'Sin combustible · compra diésel en la tienda náutica junto al cobertizo de botes' ), 4000 );
				this._fuelOut = true;

			}

		} else if ( this._wasDriven ) s.save();
		this._wasDriven = b.driven;

		if ( ( p.mode === 'boat' || p.mode === 'deck' ) && s.stats.finder ) {

			this._sonarT -= dt;
			if ( this._sonarT <= 0 ) {

				this._sonarT = 0.5;
				const x = b.position.x, z = b.position.z;
				const depth = Math.max( 0, - app.terrainData.heightAt( x, z ) );
				const h = this.habitatAtPoint( x, z, depth );
				let rich = 0;
				for ( const k in h ) rich += h[ k ];
				this._sonar = { depth, fish: Math.min( 1, rich / 1.4 ) };

			}

		}

	}

	updateVendors( inp, p ) {

		const hud = this.hud;
		let near = null;
		if ( p.mode === 'walk' ) for ( const v of this.vendors ) if ( v.inRange( p.position ) ) near = v;
		for ( const v of this.vendors ) v.talking = !! ( hud && hud.standOpen && hud.vendor === v );
		if ( hud && hud.standOpen && ( ! near || near !== hud.vendor ) ) hud.closeStand();
		if ( ! near || this.fight || this._cardDismissed || ( hud && hud.catchOpen ) ) return;
		if ( ! p.prompt ) p.prompt = { key: 'E', text: hud && hud.standOpen ? loc( 'Leave', 'Salir' ) : `${ loc( 'Talk to', 'Hablar con' ) } ${ near.name.split( ' ·' )[ 0 ] }` };
		if ( inp.hit( 'KeyE' ) ) {

			if ( ! hud ) {

				if ( near.kind === 'buyer' ) this.sellAll(); // headless: straight sale

			} else if ( hud.standOpen ) hud.closeStand();
			else hud.openStand( near );

		}

	}

	sellAll() {

		const r = this.state.sell();
		if ( r.count ) this.toast( loc( `Sold ${ r.count } fish for $${ r.total }`, `Vendiste ${ r.count === 1 ? '1 pez' : `${ r.count } peces` } por $${ r.total }` ) );
		if ( this.app.audio && this.app.audio.coin ) this.app.audio.coin();
		return r;

	}

	sell( ids ) {

		const r = this.state.sell( ids );
		if ( r.count ) this.toast( loc( `Sold for $${ r.total }`, `Vendido por $${ r.total }` ) );
		return r;

	}

	// ---- bites
	habitat() {

		return this.habitatAtPoint( this.rod.bobber.x, this.rod.bobber.z, this.rod.depth );

	}

	habitatAtPoint( x, z, depth ) {

		const b = { x, z };
		const reef = WORLD.reef;
		const reefDist = Math.hypot( b.x - reef.center.x, b.z - reef.center.z ) - reef.radius;
		const P = this._pier;
		const rect = ( x0, x1, z0, z1 ) => Math.hypot( Math.max( x0 - b.x, 0, b.x - x1 ), Math.max( z0 - b.z, 0, b.z - z1 ) );
		const walk = rect( P.x - P.width / 2, P.x + P.width / 2, P.zStart, P.zEnd );
		const head = rect( P.x - P.headWidth / 2, P.x + P.headWidth / 2, P.zEnd - P.headDepth, P.zEnd );
		return habitatAt( { depth, reefDist, pierDist: Math.min( walk, head ) } );

	}

	get hour() {

		return this.app.settings.timeOfDay;

	}

	onBobberLanded( where ) {

		if ( where !== 'water' ) {

			this.toast( loc( 'Landed on the sand', 'Cayó en la arena' ), 1400 );
			return;

		}

		const hab = this.habitat();
		this.bite = { phase: 'wait', t: biteDelay( hab, this.hour ) };
		// the spot's name when the bobber lands somewhere new (D40); the minimap always shows it
		const spot = spotOf( hab );
		if ( spot && spot !== this._castSpot ) this.toast( `${ spot.name } · ${ this.rod.depth.toFixed( 1 ) } m`, 2200 );
		this._castSpot = spot;

	}

	// the spot being fished (the bobber's, while the line is in the water) or the one the player is on / over
	// (boat, swimming, wading); null on land
	currentSpot() {

		const rod = this.rod;
		if ( rod.lineInWater && rod.state !== 'flying' ) return spotOf( this.habitat() );
		const p = this.app.player, T = this.app.terrainData;
		const q = p.mode === 'boat' || p.mode === 'deck' ? this.app.boatCtl.position : p.position;
		const depth = T ? - T.heightAt( q.x, q.z ) : 0;
		return depth > 0.25 ? spotOf( this.habitatAtPoint( q.x, q.z, depth ) ) : null;

	}

	updateBite( dt ) {

		const rod = this.rod;
		const b = this.bite;
		if ( ! b ) return;
		b.t -= dt;
		// bobber motion for the cues
		if ( b.phase === 'nibble' ) rod.dip = Math.max( 0, Math.sin( Math.min( 1, ( b.pulse || 0 ) ) * Math.PI ) * 0.45 );
		else if ( b.phase === 'take' ) rod.dip += ( 1.4 - rod.dip ) * ( 1 - Math.exp( - dt * 14 ) );
		else rod.dip = Math.max( 0, rod.dip - dt * 3 );
		if ( b.phase === 'nibble' ) b.pulse = ( b.pulse || 0 ) + dt * 3.2;

		if ( b.t > 0 ) return;
		if ( b.phase === 'wait' ) {

			const h = this.habitat();
			const species = pickSpecies( h, this.hour );
			if ( ! species ) {

				b.t = 8;
				return;

			}

			b.species = species;
			b.kg = rollWeight( species );
			b.phase = 'nibble';
			b.nibbles = 1 + Math.floor( Math.random() * 3 );
			b.t = 0.7 + Math.random() * 0.8;
			b.pulse = 0;

		} else if ( b.phase === 'nibble' ) {

			b.nibbles --;
			b.pulse = 0;
			if ( b.nibbles > 0 ) b.t = 0.6 + Math.random() * 1.0;
			else {

				b.phase = 'take';
				// big, strong fish give a (slightly) shorter window
				b.t = 2.4 - FISH[ b.species ].fight * 0.5;
				if ( this.app.audio && this.app.audio.fishSplash ) this.app.audio.fishSplash( rod.bobber, 0.35 );

			}

		} else if ( b.phase === 'take' ) {

			this.toast( loc( 'It took the bait and ran', 'Se llevó la carnada y escapó' ), 1800 );
			this.bite = { phase: 'wait', t: biteDelay( this.habitat(), this.hour ) };

		}

	}

	strike() {

		const b = this.bite;
		if ( ! b || b.phase === 'wait' || b.phase === 'nibble' ) {

			// too early: a nibbling fish isn't hooked yet; it keeps nibbling (a hint, no penalty)
			if ( b && b.phase === 'nibble' ) this.toast( loc( 'Not yet · wait for it to pull under', 'Todavía no · espera a que se hunda' ), 1500 );
			return;

		}

		const g = this.state.stats;
		this.fight = new CatchMinigame( { species: b.species, kg: b.kg, lineKg: g.lineKg, reelSpeed: g.reelSpeed, distance: Math.max( 3, this.rod.lineOut ) } );
		this.bite = null;
		this.rod.hook();
		this.toast( loc( 'Fish on!', '¡Pez enganchado!' ), 1200 );

	}

	updateFight( dt, reeling ) {

		const f = this.fight;
		const st = f.update( dt, reeling );
		// the fish thrashes at the surface as each run starts
		const au = this.app.audio;
		if ( f.surge > 0.6 && ! f._splashed && au && au.fishSplash ) au.fishSplash( this.rod.bobber, 0.3 + 0.5 * Math.min( 1, f.kg / 8 ) );
		f._splashed = f.surge > 0.6 ? true : f.surge < 0.3 ? false : f._splashed;
		if ( st === 'fighting' ) return;
		this.fight = null;
		this.rod.dip = 0;
		const name = FISH[ f.species ].name;
		if ( st === 'caught' ) {

			const entry = this.state.addFish( f.species, f.kg, this.hour );
			const info = this.state.lastCatch;
			if ( au && au.fishSplash ) au.fishSplash( this.rod.bobber, 0.8 );
			if ( au && au.fishFlop ) au.fishFlop();
			// the catch card (with a HUD) while the fish hangs on the line; a toast otherwise
			if ( this.hud ) this.landing = { species: f.species, kg: f.kg, card: info, cardT: 0 };
			else {

				if ( entry ) this.toast( `${ info.record ? loc( 'New record! ', '¡Nuevo récord! ' ) : '' }${ name } · ${ entry.kg.toFixed( 2 ) } kg · $${ entry.value } · +${ info.xp } XP`, 3600 );
				else this.toast( `${ name } · ${ f.kg.toFixed( 1 ) } kg · ${ releaseText( info, this.state ) } · +${ info.xp } XP`, 3600 );
				this.landing = { species: f.species, kg: f.kg };

			}

			this.announceLevel( info );
			this.rod.land();

		} else if ( st === 'snapped' ) {

			this.toast( loc( 'Snap! The line broke', '¡Zas! Se rompió el sedal' ), 2400 );
			if ( au && au.lineSnap ) au.lineSnap();
			this.rod.setState( 'idle' );

		} else {

			this.toast( loc( 'It threw the hook', 'Se soltó del anzuelo' ), 2000 );
			this.rod.endFight();

		}

	}

	// the landed fish goes in the cooler: card, fish and line away
	endLanding() {

		this.landing = null;
		this.display.hide();
		if ( this.hud && this.hud.catchOpen ) this.hud.hideCatch();
		if ( this.rod.state === 'landing' ) this.rod.setState( 'idle' );

	}

	// line in at once (mode change)
	cancelLine( silent = false ) {

		if ( this.fight && ! silent ) this.toast( loc( 'Lost it', 'Se escapó' ), 1400 );
		this.fight = null;
		this.bite = null;
		if ( this.rod.state !== 'stowed' ) this.rod.setState( this.rod.equipped ? 'idle' : 'stowed' );

	}

}
