import { loc } from '../i18n.js';
import { mapById } from '../maps/registry.js';

// The game being played, in the game's interface. Saved games are managed on the landing page (index.html,
// docs/DISENO.md D53–D55); here there is only the current one and the way back:
//   start screen   under "Click to explore": the current game in one line and "Menu"
//   panel          H -> Game -> Saved game: the same line and "Back to menu"
const CSS = /* css */`
.gm-prof { font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink); text-align: left; }
.gm-prof small { display: block; margin-top: 2px; color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-prof button, .gm-prof-cur button { font: 600 var(--tw-fs-sm) var(--tw-font); border: 0; border-radius: 999px; padding: calc(4 * var(--tw-u)) calc(12 * var(--tw-u));
	cursor: pointer; color: #0b1418; background: var(--tw-aqua); white-space: nowrap; }
.gm-prof-row { display: flex; align-items: center; justify-content: space-between; gap: var(--tw-3); padding: var(--tw-2) 0; }
.gm-prof-note { color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-prof-start { margin-top: var(--tw-4); display: flex; justify-content: center; cursor: default; }
.gm-prof-cur { display: flex; align-items: center; gap: var(--tw-3); padding: var(--tw-2) var(--tw-4); border-radius: 999px; background: rgba(8, 18, 28, 0.5);
	color: rgba(244, 248, 250, 0.9); font: 500 var(--tw-fs-md) var(--tw-font); }
.gm-prof-cur small { color: rgba(244, 248, 250, 0.6); }
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

export class ProfilesUI {

	// game: Game; ui: the UI (start overlay); folder: the panel folder to fill
	constructor( game, ui, folder ) {

		this.game = game;
		const style = h( 'style' );
		style.textContent = CSS;
		document.head.append( style );

		// panel
		this.panel = h( 'div', 'gm-prof' );
		if ( folder && folder.body ) folder.body.append( this.panel );

		// start screen
		const inner = ui.startEl && ui.startEl.querySelector( '.tw-start-inner' );
		if ( inner ) {

			this.start = h( 'div', 'gm-prof-start' );
			this.cur = h( 'div', 'gm-prof-cur' );
			this.start.append( this.cur );
			// clicks in here never start the game
			this.start.addEventListener( 'click', ( e ) => e.stopPropagation() );
			const cta = inner.querySelector( '.tw-start-cta' );
			if ( cta ) cta.after( this.start );
			else inner.append( this.start );

		}

		game.state.onChange( () => this.render() );
		this.render();

	}

	summary() {

		const s = this.game.state, map = mapById( s.mapId );
		return `${ map ? map.name + ' · ' : '' }${ loc( 'Lv', 'Nv' ) } ${ s.level } · $${ Math.round( s.money ).toLocaleString() } · ${ played( s.playedSeconds ) }`;

	}

	render() {

		const name = esc( this.game.profile.name );
		if ( this.cur ) {

			this.cur.innerHTML = `<span>${ loc( 'Game', 'Partida' ) }: <b>${ name }</b> <small>· ${ this.summary() }</small></span>
				<button type="button">${ loc( 'Menu', 'Menú' ) }</button>`;
			this.cur.querySelector( 'button' ).onclick = () => this.game.exitToMenu();

		}

		this.panel.innerHTML = `<div class="gm-prof-row"><div><b>${ name }</b><small>${ this.summary() }</small></div>
				<button type="button">${ loc( 'Back to menu', 'Salir al menú' ) }</button></div>
			<div class="gm-prof-note">${ loc( 'Your progress is saved. Saved games are managed in the menu.', 'Tu progreso queda guardado. Las partidas se administran en el menú.' ) }</div>`;
		this.panel.querySelector( 'button' ).onclick = () => this.game.exitToMenu();

	}

}
