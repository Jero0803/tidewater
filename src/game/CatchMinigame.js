import { FISH } from './FishTable.js';

// The fight with a hooked fish (docs/DISENO.md D62, section 7g), with the controls of Fishing Planet:
//   hold left click        reel in
//   Shift + left click     reel in fast (more line per second, more tension)
//   hold right click       pull: lift the rod, more pressure on the fish (it tires faster, comes in a little)
//   look left / right      the rod follows the view: against the fish's run it tires it fast, with it hardly
//   mouse wheel, + / -     the drag (10 positions)
//
// Physics in kilograms of pull. The fish pulls with a force that depends on its weight, its species, what it is
// doing and how tired it is. The reel's drag lets line out when the pull on the line passes it, so a running fish
// takes line instead of breaking it; the line only breaks above its own strength (the rig's line, lineKg), which
// a too tight drag lets the pull reach (a run starts with a jolt above the drag). A too loose drag lets the fish
// take all the line on the spool. Slack line for too long and the hook falls out.
//
// What the fish does (its species' style, FishTable.js `style`): holds, runs away (to one side: `runDir`),
// swims toward you (reel fast or the line goes slack), jumps (jumpers: let go of the right click, a lifted rod on a
// tight line can throw the hook), dives for the bottom (snaggers like carp: pull or it wraps the line in the weeds
// and cuts it). It tires with the pressure you put on it, clearly and steadily.
//
//   const g = new CatchMinigame( { species, kg, lineKg, reelSpeed, distance, drag, lineCap, rng } )
//   g.update( dt, input ) -> 'fighting' | 'caught' | 'snapped' | 'escaped'
//     input: { reel, fast, pull, side } (side: -1 .. 1, the rod's sideways offset from the line, see rodSide)
//            or a boolean (reel) for the old callers (balance tools)
//   g.setDrag( n ) / g.drag (1 .. 10), g.dragKg, g.tensionKg, g.tension (0..1+ of lineKg), g.distance (m),
//   g.lineLeft (m), g.stamina (0..1), g.mode ('hold' | 'run' | 'come' | 'jump' | 'dive'), g.runDir (-1 | 1),
//   g.angle (rad, the fish's bearing offset from where it was hooked), g.slipping, g.surge (0..1),
//   g.cause ('line' | 'spooled' | 'snag' | 'slack' | 'jump' | with tackle: 'tear' | 'rod'), g.band (old callers)

// With tackle by pieces (docs/DISENO.md 7h, E2: D63, D64, D73), pass `tackle` = { stiff, rodMax, dragMax, mouth,
// smallHook } (Tackle.fightTackle): the fish pulls like a real one on 1.5–12 kg lines, tires in at least a minute,
// the reel's drag can't pass its maximum, a stiff rod passes the jolts to the hook (it can tear out), and the rod
// breaks above its limit. Without it the fight is the P1 one (the island until it has its catalogue).
//   g.loads = { line, rod, reel } (0..1+): how close each piece is to failing (the three bars on screen); reel is
//   what the drag holds against its setting (1 = the spool slips)
export const DRAG_STEPS = 10;
const TAU = Math.PI * 2;
export const STAMINA = { min: 180, k: 4, size: 0.35 }; // D73: seconds of full pressure to tire a fish (with tackle)
export const fishForce = ( f, kg ) => Math.max( 0.05, kg * ( 0.25 + 0.6 * f.fight ) + 0.05 ); // kg of pull (with tackle)
export const fishStamina = ( f, kg ) => STAMINA.min + STAMINA.k * f.stamina * Math.pow( Math.max( kg / f.kg[ 1 ], 0.05 ), STAMINA.size );

// the default fighting style of a species (FishTable.js may override any of these in `style`)
function styleOf( f ) {

	const s = f.style || {};
	return {
		runs: s.runs ?? 0.4 + 0.5 * f.fight, // how often it runs (0..1)
		speed: s.speed ?? 0.3 + 0.7 * f.fight, // how fast its runs are (0..1)
		jumps: s.jumps ?? 0, // chance of a jump at the end of a run
		dive: s.dive ?? 0, // how often it heads for the bottom
		snag: s.snag ?? false, // a dive reaching the weeds / rocks cuts the line
		come: s.come ?? 0.12, // how often it swims at you
	};

}

export class CatchMinigame {

	constructor( { species, kg, lineKg = 7, reelSpeed = 1.1, distance = 15, drag = 5, lineCap = 150, tackle = null, rng = Math.random } ) {

		const f = FISH[ species ];
		this.species = species;
		this.kg = kg;
		this.rng = rng;
		this.lineKg = lineKg;
		this.reelSpeed = reelSpeed;
		this.style = styleOf( f );
		this.tackle = tackle;
		if ( tackle ) {

			this.force = fishForce( f, kg );
			this.staminaMax = fishStamina( f, kg );
			// kg the hook holds in its mouth (less with a hook too small for it)
			this.hold = ( tackle.mouth * Math.pow( kg, 0.6 ) + 0.15 ) * ( tackle.smallHook ? 0.7 : 1 );

		} else {

			// the fish's full pull (kg) when fresh and running; a guapucha hardly pulls, a big carp pulls its weight
			this.force = Math.max( 0.15, kg * ( 0.35 + 1.4 * f.fight ) + 0.1 );
			// seconds of full pressure it takes to tire it out
			this.staminaMax = Math.max( 3, 3.5 * f.stamina * Math.pow( Math.max( kg / f.kg[ 1 ], 0.15 ), 0.35 ) );

		}

		this.tearT = 0; // seconds the hook has been overloaded
		this.rodT = 0; // seconds the rod has been over its limit
		this.loads = { line: 0, rod: 0, reel: 0 };
		this.stamina = 1;
		this.distance = distance;
		this.lineCap = Math.max( lineCap, distance + 30 );
		this.drag = 5;
		this.setDrag( drag );
		this.tensionKg = 0;
		this.tension = 0;
		this.mode = 'hold';
		this.modeT = 1 + rng() * 1.5;
		this.runDir = rng() < 0.5 ? - 1 : 1;
		this.angle = 0;
		this.slipping = false;
		this.surge = 0;
		this.jolt = 0; // seconds of the jolt at the start of a run (above the drag)
		this.overload = 0; // seconds above the line's strength
		this.slack = 0; // seconds of slack line
		this.snagT = 0; // seconds a snagging fish has been diving freely
		this.jumpHit = false; // this jump already tested the hook
		this.time = 0;
		this.band = [ 0.3, 0.85 ];
		this.cause = null;
		this.state = 'fighting';

	}

	setDrag( n ) {

		this.drag = Math.max( 1, Math.min( DRAG_STEPS, Math.round( n ) ) );
		// position 10 lets the line take 95 % of its strength before the spool slips (never more than the reel gives)
		this.dragKg = this.lineKg * 0.095 * this.drag;
		if ( this.tackle ) this.dragKg = Math.min( this.dragKg, this.tackle.dragMax );

	}

	get lineLeft() {

		return Math.max( 0, this.lineCap - this.distance );

	}

	// the fish's pull now (kg)
	pull() {

		const tired = 0.2 + 0.8 * this.stamina;
		const k = { hold: 0.42, run: 1.0, come: 0.08, jump: 0.35, dive: 0.85 }[ this.mode ];
		return this.force * k * tired;

	}

	// the fish's own speed away from you (m/s; negative toward you)
	swim() {

		const s = this.style, tired = 0.3 + 0.7 * this.stamina;
		switch ( this.mode ) {

			case 'run': return ( 1.2 + 2.6 * s.speed ) * tired;
			case 'dive': return 0.7 * tired;
			case 'come': return - ( 0.8 + 1.2 * s.speed ) * tired;
			case 'jump': return 0.2;
			default: return 0.25 * tired;

		}

	}

	// what the fish does next
	nextMode() {

		const s = this.style, r = this.rng, fresh = this.stamina;
		const was = this.mode;
		if ( was === 'run' && s.jumps > 0 && r() < s.jumps * ( 0.4 + 0.6 * fresh ) ) {

			this.mode = 'jump';
			this.modeT = 0.9;
			this.jumpHit = false;
			return;

		}

		const x = r();
		const pRun = ( 0.25 + 0.45 * s.runs ) * ( 0.3 + 0.7 * fresh );
		const pDive = s.dive * 0.35 * ( 0.4 + 0.6 * fresh );
		const pCome = s.come * ( 0.5 + 0.5 * fresh );
		if ( was !== 'run' && x < pRun ) {

			this.mode = 'run';
			this.modeT = ( 1 + r() * 2 ) * ( 0.5 + 0.7 * fresh );
			if ( r() < 0.65 ) this.runDir = r() < 0.5 ? - 1 : 1;
			this.jolt = 0.25;

		} else if ( x < pRun + pDive ) {

			this.mode = 'dive';
			this.modeT = 1.5 + r() * 2.5;

		} else if ( x < pRun + pDive + pCome ) {

			this.mode = 'come';
			this.modeT = 1 + r() * 1.5;

		} else {

			this.mode = 'hold';
			this.modeT = 1.2 + r() * 2.5 * ( 1.3 - fresh * 0.5 );

		}

	}

	update( dt, input = {} ) {

		if ( this.state !== 'fighting' ) return this.state;
		if ( typeof input === 'boolean' ) input = { reel: input };
		const reel = !! input.reel, fast = reel && !! input.fast, pull = !! input.pull;
		const side = Math.max( - 1, Math.min( 1, input.side || 0 ) );
		this.time += dt;

		// ---- the fish's behaviour
		this.modeT -= dt;
		if ( this.modeT <= 0 ) this.nextMode();
		this.surge += ( ( this.mode === 'run' || this.mode === 'dive' ? 1 : 0 ) - this.surge ) * ( 1 - Math.exp( - dt * 6 ) );

		// ---- forces on the line (kg)
		const F = this.pull();
		const L = this.lineKg;
		const load = ( reel ? ( fast ? 0.3 : 0.17 ) * L : 0 ) + ( pull ? 0.22 * L : 0 );
		const want = F + load; // what the line would carry with the spool locked
		this.slipping = want > this.dragKg;
		const joltKg = this.jolt > 0 ? 0.45 * F : 0;
		this.jolt = Math.max( 0, this.jolt - dt );
		this.tensionKg = Math.min( want, this.dragKg ) + ( this.slipping ? joltKg : 0 );
		this.tension = this.tensionKg / L;

		// ---- line in / out
		const v = this.swim();
		if ( this.slipping ) {

			// the spool pays out: the fish takes line at its pace (reeling only twists the line)
			this.distance += Math.max( 0.15, v ) * Math.min( 1, ( want - this.dragKg ) / Math.max( F, 0.05 ) + 0.6 ) * dt;

		} else {

			let dd = 0;
			if ( reel ) dd -= this.reelSpeed * ( fast ? 1.9 : 1 ) * ( 1 - 0.6 * F / Math.max( this.dragKg, 0.1 ) );
			if ( pull ) dd -= 0.3 * ( 1 - this.stamina * 0.5 );
			if ( v < 0 ) dd += v; // swimming at you: the line shortens by itself (slack if you don't reel)
			this.distance += dd * dt;

		}

		this.distance = Math.max( 0, this.distance );

		// ---- sideways: a running fish swings round; the rod against it turns its head
		const against = this.mode === 'run' ? - side * this.runDir : Math.abs( side ) * 0.25;
		if ( this.mode === 'run' ) this.angle += this.runDir * v / Math.max( 4, this.distance ) * dt * ( 1 - 0.5 * Math.max( 0, against ) );
		else this.angle *= Math.exp( - dt * 0.15 );
		this.angle = Math.max( - 1.3, Math.min( 1.3, this.angle ) );

		// ---- tiring: with the pressure on it (tension against its full pull), more with the rod lifted and
		// against its run, less with the rod following it; it recovers a little on a slack line
		const pressure = Math.min( 1.2, this.tensionKg / Math.max( this.force, 0.1 ) );
		const mul = ( 1 + 0.6 * Math.max( 0, against ) - 0.4 * Math.max( 0, - against ) ) * ( pull ? 1.25 : 1 ) * ( this.mode === 'run' ? 1.1 : 1 );
		this.stamina = Math.max( 0, this.stamina - dt / this.staminaMax * pressure * mul );
		if ( this.tension < 0.04 ) this.stamina = Math.min( 1, this.stamina + dt * 0.015 );

		// ---- outcomes
		const end = ( state, cause ) => {

			this.state = state;
			this.cause = cause;
			return state;

		};

		// the three loads on screen: line against its strength, rod against its limit, drag held against its setting
		const T = this.tackle;
		const rodMax = T ? T.rodMax : L * 1.25;
		this.loads.line = this.tensionKg / L;
		this.loads.rod = this.tensionKg / rodMax;
		this.loads.reel = Math.min( 1.05, want / Math.max( this.dragKg, 0.05 ) );

		this.overload = this.tensionKg > L ? this.overload + dt : Math.max( 0, this.overload - dt * 3 );
		if ( this.overload > 0.15 ) return end( 'snapped', 'line' );
		if ( T ) {

			// what reaches the hook: the fish's pull, the water's drag on it when reeled, and what lifting the rod adds
			// (never more than the fish resists); a stiff rod passes more of it, a jump more still (7h, D64)
			const water = reel ? 0.25 * Math.pow( this.kg, 0.7 ) * ( fast ? 1.6 : 1 ) : 0;
			const lift = pull ? Math.min( 0.3 * T.rodMin, F ) : 0;
			const onHook = Math.min( this.tensionKg, F + water + lift ) * ( 0.55 + 0.9 * T.stiff ) * ( this.mode === 'jump' ? 1.5 : 1 );
			this.tearT = onHook > this.hold ? this.tearT + dt : Math.max( 0, this.tearT - dt * 2 );
			if ( this.tearT > 0.2 ) return end( 'escaped', 'tear' );
			this.rodT = this.tensionKg > rodMax ? this.rodT + dt : 0;
			if ( this.rodT > 0.15 ) return end( 'snapped', 'rod' );

		}
		if ( this.distance > this.lineCap ) return end( 'snapped', 'spooled' );
		// a jump on a tight line with the rod lifted can throw the hook (once per jump)
		if ( this.mode === 'jump' && ! this.jumpHit && this.modeT < 0.6 ) {

			this.jumpHit = true;
			if ( pull && this.tension > 0.18 && this.rng() < 0.55 ) return end( 'escaped', 'jump' );

		}

		// a snagger diving with nothing stopping it reaches the weeds
		if ( this.mode === 'dive' && this.style.snag && ! pull && this.tension < 0.35 ) this.snagT += dt;
		else this.snagT = Math.max( 0, this.snagT - dt * 0.7 );
		if ( this.snagT > 2.2 ) return end( 'snapped', 'snag' );
		this.slack = this.tension < 0.03 ? this.slack + dt : Math.max( 0, this.slack - dt * 2 );
		if ( this.slack > 2.5 ) return end( 'escaped', 'slack' );
		// close in: a tired fish is landed; a fresh one makes another run
		if ( this.distance < 1.5 ) {

			if ( this.stamina < 0.35 ) return end( 'caught', null );
			if ( this.mode !== 'run' ) {

				this.mode = 'run';
				this.modeT = 1 + this.rng();
				this.jolt = 0.25;
				this.runDir = this.rng() < 0.5 ? - 1 : 1;

			}

		}

		return this.state;

	}

}

// the rod's sideways offset from the line (-1 .. 1) for update( dt, { side } ): the view direction against the
// bearing to the fish (both as angles in the same convention); the sign only has to be consistent with `angle`
export function rodSide( viewAngle, fishAngle ) {

	let d = viewAngle - fishAngle;
	d = ( ( d + Math.PI ) % TAU + TAU ) % TAU - Math.PI;
	return Math.max( - 1, Math.min( 1, Math.sin( d ) * 1.6 ) );

}
