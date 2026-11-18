import { loc } from '../i18n.js';
import { MAX_PROFILES } from './Profiles.js';

// Save profiles in the interface (Profiles holds the data, Game switches / creates / deletes):
//   start screen   under "Click to explore": the current game in one line and "Change", which opens the list
//   panel          H -> Game -> Saved games: the same list, any time
// Each row: name, level, money, time played, last played; Play (other games) and Delete (asks again first).
// Every change reloads the page into the chosen game.
const CSS = /* css */`
.gm-prof { font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink); text-align: left; }
.gm-prof-row { display: grid; grid-template-columns: 1fr auto; gap: var(--tw-2); align-items: center; padding: var(--tw-2) 0; border-bottom: 1px solid var(--tw-line); }
.gm-prof-row b { font-weight: 600; }
.gm-prof-row small { display: block; margin-top: 2px; color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-prof-tag { margin-left: var(--tw-2); padding: 1px var(--tw-2); border-radius: 999px; font-size: var(--tw-fs-xs); font-weight: 700; letter-spacing: 0.08em;
	text-transform: uppercase; color: #062420; background: var(--tw-aqua); vertical-align: 1px; }
.gm-prof-acts { display: flex; gap: var(--tw-1); }
.gm-prof button { font: 600 var(--tw-fs-sm) var(--tw-font); border: 0; border-radius: 999px; padding: calc(4 * var(--tw-u)) calc(10 * var(--tw-u)); cursor: pointer;
	color: var(--tw-ink); background: var(--tw-fill-2); }
.gm-prof button.is-play { color: #0b1418; background: var(--tw-aqua); }
.gm-prof button.is-danger { color: #2a0b0b; background: var(--tw-coral); }
.gm-prof button[disabled] { opacity: 0.4; cursor: default; }
.gm-prof-new { display: flex; gap: var(--tw-2); margin-top: var(--tw-3); }
.gm-prof-new input { flex: 1; min-width: 0; font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink); background: var(--tw-fill); border: 1px solid var(--tw-line);
	border-radius: 999px; padding: calc(4 * var(--tw-u)) calc(12 * var(--tw-u)); }
.gm-prof-note { margin-top: var(--tw-2); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
/* start screen */
.gm-prof-start { margin-top: var(--tw-4); display: flex; flex-direction: column; align-items: center; gap: var(--tw-2); cursor: default; }
.gm-prof-cur { display: flex; align-items: center; gap: var(--tw-3); padding: var(--tw-2) var(--tw-4); border-radius: 999px; background: rgba(8, 18, 28, 0.5);
	color: rgba(244, 248, 250, 0.9); font: 500 var(--tw-fs-md) var(--tw-font); }
.gm-prof-cur small { color: rgba(244, 248, 250, 0.6); }
.gm-prof-start .gm-prof { width: min(92vw, calc(440 * var(--tw-u))); padding: var(--tw-3) var(--tw-4); border-radius: var(--tw-r-lg); background: rgba(8, 18, 28, 0.72);
	-webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.gm-prof-start .gm-prof[hidden] { display: none; }
`;

const h = ( tag, cls, html ) => {

	const e = document.createElement( tag );
	if ( cls ) e.className = cls;
	if ( html !== undefined ) e.innerHTML = html;
	return e;

};

const esc = ( s ) => String( s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' } )[ c ] );

function played( sec ) {

	const m = Math.floor( ( sec || 0 ) / 60 );
	return m >= 60 ? `${ Math.floor( m / 60 ) } h ${ m % 60 } min` : `${ m } min`;

}

function when( t ) {

	if ( ! t ) return loc( 'not played yet', 'sin jugar' );
	const d = new Date( t ), now = new Date();
	const time = d.toLocaleTimeString( [], { hour: '2-digit', minute: '2-digit' } );
	return d.toDateString() === now.toDateString() ? `${ loc( 'today', 'hoy' ) } ${ time }` : `${ d.toLocaleDateString() } ${ time }`;

}

export class ProfilesUI {

	// game: Game; ui: the UI (start overlay); folder: the panel folder to fill
	constructor( game, ui, folder ) {

		this.game = game;
		const style = h( 'style' );
		style.textContent = CSS;
		document.head.append( style );
		this._confirm = null; // id waiting for the second Delete click

		// panel
		this.panelList = h( 'div', 'gm-prof' );
		if ( folder && folder.body ) folder.body.append( this.panelList );

		// start screen
		const inner = ui.startEl && ui.startEl.querySelector( '.tw-start-inner' );
		if ( inner ) {

			this.start = h( 'div', 'gm-prof-start' );
			this.cur = h( 'div', 'gm-prof-cur' );
			this.startList = h( 'div', 'gm-prof' );
			this.startList.hidden = true;
			this.start.append( this.cur, this.startList );
			// clicks in here never start the game (rows are redrawn on click, so the target may already be detached
			// when the start overlay would look at it)
			this.start.addEventListener( 'click', ( e ) => e.stopPropagation() );
			const cta = inner.querySelector( '.tw-start-cta' );
			if ( cta ) cta.after( this.start );
			else inner.append( this.start );

		}

		game.state.onChange( () => this.render() );
		this.render();

	}

	// the menu summary of a profile (live for the game being played)
	summary( p ) {

		const s = this.game.state;
		const sum = p.id === this.game.profile.id ? { level: s.level, money: s.money, played: s.playedSeconds } : p.summary;
		if ( ! sum ) return loc( 'New game', 'Partida nueva' );
		return `${ loc( 'Lv', 'Nv' ) } ${ sum.level } · $${ Math.round( sum.money ).toLocaleString() } · ${ played( sum.played ) }`;

	}

	render() {

		const g = this.game, profiles = g.profiles, active = g.profile;
		if ( this.cur ) {

			this.cur.innerHTML = `<span>${ loc( 'Game', 'Partida' ) }: <b>${ esc( active.name ) }</b> <small>· ${ this.summary( active ) }</small></span>
				<button type="button" class="gm-prof-toggle">${ this.startList && ! this.startList.hidden ? loc( 'Close', 'Cerrar' ) : loc( 'Change', 'Cambiar' ) }</button>`;
			this.cur.querySelector( 'button' ).style.cssText = 'font:600 var(--tw-fs-sm) var(--tw-font);border:0;border-radius:999px;padding:4px 12px;cursor:pointer;color:#0b1418;background:var(--tw-aqua)';
			this.cur.querySelector( 'button' ).onclick = () => {

				this.startList.hidden = ! this.startList.hidden;
				this.render();

			};

		}

		// (not while a name is being typed in that list: redrawing would drop it)
		const typing = ( el ) => typeof document !== 'undefined' && el.contains( document.activeElement ) && document.activeElement.tagName === 'INPUT';
		for ( const el of [ this.panelList, this.startList ] ) if ( el && ! typing( el ) ) this.fill( el, profiles, active );

	}

	fill( el, profiles, active ) {

		const rows = profiles.list.map( ( p ) => {

			const isActive = p.id === active.id;
			const confirming = this._confirm === p.id;
			return `<div class="gm-prof-row">
				<div><b>${ esc( p.name ) }</b>${ isActive ? `<span class="gm-prof-tag">${ loc( 'playing', 'actual' ) }</span>` : '' }
					<small>${ this.summary( p ) } · ${ isActive ? loc( 'now', 'ahora' ) : when( p.lastPlayed ) }</small></div>
				<div class="gm-prof-acts">
					${ isActive ? '' : `<button type="button" class="is-play" data-play="${ p.id }">${ loc( 'Play', 'Jugar' ) }</button>` }
					<button type="button" class="${ confirming ? 'is-danger' : '' }" data-del="${ p.id }">${ confirming ? loc( 'Delete for good?', '¿Borrar del todo?' ) : loc( 'Delete', 'Borrar' ) }</button>
				</div></div>`;

		} ).join( '' );
		const full = profiles.full;
		el.innerHTML = `${ rows }
			<div class="gm-prof-new"><input type="text" maxlength="24" placeholder="${ loc( 'Name of the new game', 'Nombre de la partida nueva' ) }" ${ full ? 'disabled' : '' }>
				<button type="button" class="is-play" data-new ${ full ? 'disabled' : '' }>${ loc( 'New game', 'Nueva partida' ) }</button></div>
			<div class="gm-prof-note">${ full ? loc( `${ MAX_PROFILES } games at most: delete one to start another.`, `Máximo ${ MAX_PROFILES } partidas: borra una para empezar otra.` ) : loc( 'Changing game reloads the page; your progress is saved.', 'Cambiar de partida recarga la página; tu progreso queda guardado.' ) }</div>`;

		for ( const b of el.querySelectorAll( '[data-play]' ) ) b.onclick = () => this.game.switchProfile( b.dataset.play );
		for ( const b of el.querySelectorAll( '[data-del]' ) ) b.onclick = () => {

			const id = b.dataset.del;
			if ( this._confirm !== id ) {

				this._confirm = id;
				clearTimeout( this._confirmT );
				this._confirmT = setTimeout( () => {

					this._confirm = null;
					this.render();

				}, 4000 );
				this.render();
				return;

			}

			this._confirm = null;
			this.game.deleteProfile( id );
			this.render();

		};

		const input = el.querySelector( 'input' ), add = el.querySelector( '[data-new]' );
		const create = () => this.game.newProfile( input.value );
		add.onclick = create;
		input.onkeydown = ( e ) => {

			e.stopPropagation();
			if ( e.key === 'Enter' ) create();

		};

	}

}
