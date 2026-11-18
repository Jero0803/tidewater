import { loc, LANG, setLang } from '../i18n.js';
import { Profiles, MAX_PROFILES } from '../game/Profiles.js';
import { levelFromXp } from '../game/Levels.js';
import { mapName, catalogEntry, MAP_CATALOG } from '../maps/catalog.js';

// The landing page (docs/DISENO.md D53–D55, section 7e). No engine, no WebGPU: the saved games (Profiles), the map
// catalog and the level curve, read straight from the browser storage the game writes. "Play" opens juego.html
// with the active game; the game's "Back to menu" comes back here.
document.documentElement.lang = LANG;
const profiles = new Profiles();
let confirmId = null, confirmT = 0;

const esc = ( s ) => String( s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' } )[ c ] );
const played = ( sec ) => {

	const m = Math.floor( ( sec || 0 ) / 60 );
	return m >= 60 ? `${ Math.floor( m / 60 ) } h ${ m % 60 } min` : `${ m } min`;

};

const when = ( t ) => {

	if ( ! t ) return loc( 'not played yet', 'sin jugar' );
	const d = new Date( t ), now = new Date();
	const time = d.toLocaleTimeString( [], { hour: '2-digit', minute: '2-digit' } );
	return d.toDateString() === now.toDateString() ? `${ loc( 'today', 'hoy' ) } ${ time }` : `${ d.toLocaleDateString() } ${ time }`;

};

// what the menus show of a game: the summary the game keeps in the index, or read from its save (a game from
// before the summaries existed); null for a game never played
function summary( p ) {

	if ( p.summary ) return p.summary;
	try {

		const keys = [ profiles.saveKey( p.id ), ...( profiles.legacy( p.id ) ? [ 'tidewater.save.v2', 'tidewater.save.v1' ] : [] ) ];
		for ( const k of keys ) {

			const raw = localStorage.getItem( k );
			if ( ! raw ) continue;
			const d = JSON.parse( raw );
			return { level: levelFromXp( d.xp || 0 ).level, money: d.money || 0, played: d.playedSeconds || 0, map: d.map || 'island' };

		}

	} catch ( e ) { /* blocked storage or a broken save */ }

	return null;

}

const metaLine = ( s ) => s ? `${ mapName( s.map ) || '' } · ${ loc( 'Lv', 'Nv' ) } ${ s.level } · $${ Math.round( s.money ).toLocaleString() } · ${ played( s.played ) }` : loc( 'New game', 'Partida nueva' );

// open the game with the active profile (keeps ?lang= when it came from the address)
function play() {

	const q = new URLSearchParams( location.search );
	const keep = q.has( 'lang' ) ? `?lang=${ q.get( 'lang' ) }` : '';
	location.href = `juego.html${ keep }`;

}

const LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="rgba(246,239,228,0.55)" stroke-width="1.6"/><circle cx="24" cy="19" r="7" fill="#ffb86b"/><path d="M9 28c4-3 8-3 12 0s8 3 12 0 6-3 8-1" fill="none" stroke="#5fe3d4" stroke-width="2.4" stroke-linecap="round"/><path d="M11 34c4-3 8-3 12 0s8 3 12 0" fill="none" stroke="#5fe3d4" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

function render() {

	const active = profiles.active, sum = summary( active );
	const map = catalogEntry( sum ? sum.map : 'island' );
	const root = document.getElementById( 'portada' );
	const typing = root.contains( document.activeElement ) && document.activeElement.tagName === 'INPUT' ? document.activeElement.value : null;
	root.innerHTML = `
		<header class="pt-top">
			<div class="pt-brand">${ LOGO }<span>TIDEWATER</span></div>
			<div class="pt-lang" role="group" aria-label="Idioma / Language">
				<button type="button" data-lang="es" class="${ LANG === 'es' ? 'is-on' : '' }">ES</button>
				<button type="button" data-lang="en" class="${ LANG === 'en' ? 'is-on' : '' }">EN</button>
			</div>
		</header>
		<section class="pt-main">
			<div class="pt-hero">
				<div class="pt-eyebrow">${ loc( 'A fishing game', 'Un juego de pesca' ) }</div>
				<h1 class="pt-title">TIDEWATER</h1>
				<p class="pt-tag">${ loc( 'From a mountain lake to the open sea: fish, learn every water, sell your catch and earn the gear and licences for bigger fish.', 'De un lago de montaña al mar abierto: pesca, conoce cada agua, vende tu captura y gánate el equipo y las licencias para peces más grandes.' ) }</p>
				<div class="pt-card">
					<div class="pt-card-head"><span>${ sum ? loc( 'Continue', 'Continuar' ) : loc( 'Start', 'Empezar' ) }</span><span>${ sum ? when( active.lastPlayed ) : '' }</span></div>
					<div class="pt-card-name">${ esc( active.name ) }</div>
					<div class="pt-card-meta">${ sum ? `${ map ? esc( map.name ) : '' } · ${ loc( 'Level', 'Nivel' ) } <b>${ sum.level }</b> · <b>$${ Math.round( sum.money ).toLocaleString() }</b> · ${ played( sum.played ) }` : loc( 'A new game: you start with the basic licence free for your first day.', 'Partida nueva: empiezas con la licencia básica regalada el primer día.' ) }</div>
					<div class="pt-card-row">
						<button type="button" class="pt-play" data-play>${ PLAY }<span>${ sum ? loc( 'Play', 'Jugar' ) : loc( 'Start fishing', 'Empezar a pescar' ) }</span></button>
						<span class="pt-hint">${ loc( 'The game loads in a few seconds', 'El juego carga en unos segundos' ) }</span>
					</div>
				</div>
			</div>
			<aside class="pt-side">
				<h2>${ loc( 'Saved games', 'Partidas' ) }</h2>
				${ profiles.list.map( ( p ) => {

					const s = summary( p ), on = p.id === active.id, conf = confirmId === p.id;
					return `<div class="pt-row ${ on ? 'is-active' : '' }">
						<div><span class="pt-row-name" data-pick="${ p.id }">${ esc( p.name ) }</span>${ on ? `<span class="pt-tag-on">${ loc( 'selected', 'elegida' ) }</span>` : '' }
							<small>${ metaLine( s ) } · ${ when( p.lastPlayed ) }</small></div>
						<div class="pt-acts">
							${ on ? '' : `<button type="button" class="pt-btn is-main" data-go="${ p.id }">${ loc( 'Play', 'Jugar' ) }</button>` }
							<button type="button" class="pt-btn ${ conf ? 'is-danger' : '' }" data-del="${ p.id }">${ conf ? loc( 'Delete for good?', '¿Borrar del todo?' ) : loc( 'Delete', 'Borrar' ) }</button>
						</div></div>`;

				} ).join( '' ) }
				<div class="pt-new"><input type="text" maxlength="24" placeholder="${ loc( 'Name of the new game', 'Nombre de la partida nueva' ) }" ${ profiles.full ? 'disabled' : '' }>
					<button type="button" class="pt-btn is-main" data-new ${ profiles.full ? 'disabled' : '' }>${ loc( 'New game', 'Nueva partida' ) }</button></div>
				<div class="pt-note">${ profiles.full ? loc( `${ MAX_PROFILES } games at most: delete one to start another.`, `Máximo ${ MAX_PROFILES } partidas: borra una para empezar otra.` ) : loc( 'Each game keeps its own progress in this browser.', 'Cada partida guarda su propio progreso en este navegador.' ) }</div>
			</aside>
		</section>
		<footer class="pt-foot"><span>${ loc( `${ MAP_CATALOG.length } maps planned · the island is open, the mountain lake is being built`, `${ MAP_CATALOG.length } mapas planeados · la isla está abierta, el lago de montaña está en construcción` ) }</span><span>Tidewater</span></footer>`;

	// wiring
	for ( const b of root.querySelectorAll( '[data-lang]' ) ) b.onclick = () => setLang( b.dataset.lang );
	root.querySelector( '[data-play]' ).onclick = play;
	for ( const b of root.querySelectorAll( '[data-pick]' ) ) b.onclick = () => {

		profiles.setActive( b.dataset.pick );
		render();

	};

	for ( const b of root.querySelectorAll( '[data-go]' ) ) b.onclick = () => {

		profiles.setActive( b.dataset.go );
		play();

	};

	for ( const b of root.querySelectorAll( '[data-del]' ) ) b.onclick = () => {

		const id = b.dataset.del;
		clearTimeout( confirmT );
		if ( confirmId !== id ) {

			confirmId = id;
			confirmT = setTimeout( () => {

				confirmId = null;
				render();

			}, 4000 );

		} else {

			confirmId = null;
			profiles.remove( id );

		}

		render();

	};

	const input = root.querySelector( '.pt-new input' ), add = root.querySelector( '[data-new]' );
	if ( typing !== null ) {

		input.value = typing;
		input.focus();

	}

	const create = () => {

		const p = profiles.create( input.value );
		if ( ! p ) return;
		profiles.setActive( p.id );
		render();

	};

	add.onclick = create;
	input.onkeydown = ( e ) => {

		if ( e.key === 'Enter' ) create();

	};

}

render();
// another tab may have played or changed the games
window.addEventListener( 'storage', ( e ) => {

	if ( e.key && ! e.key.startsWith( 'tidewater.' ) ) return;
	profiles.data = profiles._load();
	render();

} );
