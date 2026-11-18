import { loc, LANG, setLang } from '../i18n.js';
import { Profiles, MAX_PROFILES } from '../game/Profiles.js';
import { levelFromXp } from '../game/Levels.js';
import { FISH } from '../game/FishTable.js';
import { UPGRADES } from '../game/Gear.js';
import { mapName, catalogEntry, MAP_CATALOG } from '../maps/catalog.js';

// The landing page (docs/DISENO.md D53–D55, section 7e). No engine, no WebGPU: the saved games (Profiles), the map
// catalog, the fish table, the gear table and the level curve, read straight from the browser storage the game
// writes. "Play" opens juego.html with the active game; the game's "Back to menu" comes back here.
//   side panel tabs: Saved games · Maps · Progress (of the selected game)
document.documentElement.lang = LANG;
const profiles = new Profiles();
let confirmId = null, confirmT = 0;
const TAB_KEY = 'tidewater.portada.tab';
let tab = 'games';
try {

	tab = localStorage.getItem( TAB_KEY ) || 'games';

} catch ( e ) { /* blocked storage: start on the saved games */ }

const esc = ( s ) => String( s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' } )[ c ] );
const money = ( x ) => `$${ Math.round( x || 0 ).toLocaleString() }`;
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

const LICENSE = [ loc( 'No licence', 'Sin licencia' ), loc( 'Basic', 'Básica' ), loc( 'Intermediate', 'Intermedia' ), loc( 'Advanced', 'Avanzada' ) ];
const STATUS = { open: loc( 'Open', 'Abierto' ), building: loc( 'Being built', 'En construcción' ), planned: loc( 'Planned', 'Planeado' ) };

// a game's save as the game wrote it (its own key; the first game also the saves from before profiles), with the
// older shapes brought to the current one (log per map); null for a game never played
function readSave( p ) {

	try {

		const keys = [ profiles.saveKey( p.id ), ...( profiles.legacy( p.id ) ? [ 'tidewater.save.v2', 'tidewater.save.v1' ] : [] ) ];
		for ( const k of keys ) {

			const raw = localStorage.getItem( k );
			if ( ! raw ) continue;
			const d = JSON.parse( raw );
			if ( ! d.maps ) d.maps = { island: { log: d.log || {}, licences: {} } }; // v1
			if ( ! d.map ) d.map = 'island';
			return d;

		}

	} catch ( e ) { /* blocked storage or a broken save */ }

	return null;

}

// what the menus show of a game: the summary the game keeps in the index, or read from its save
function summary( p ) {

	if ( p.summary ) return p.summary;
	const d = readSave( p );
	return d ? { level: levelFromXp( d.xp || 0 ).level, money: d.money || 0, played: d.playedSeconds || 0, map: d.map } : null;

}

const metaLine = ( s ) => s ? `${ mapName( s.map ) || '' } · ${ loc( 'Lv', 'Nv' ) } ${ s.level } · ${ money( s.money ) } · ${ played( s.played ) }` : loc( 'New game', 'Partida nueva' );

// open the game with the active profile (keeps ?lang= when it came from the address)
function play() {

	const q = new URLSearchParams( location.search );
	location.href = `juego.html${ q.has( 'lang' ) ? `?lang=${ q.get( 'lang' ) }` : '' }`;

}

const LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="rgba(246,239,228,0.55)" stroke-width="1.6"/><circle cx="24" cy="19" r="7" fill="#ffb86b"/><path d="M9 28c4-3 8-3 12 0s8 3 12 0 6-3 8-1" fill="none" stroke="#5fe3d4" stroke-width="2.4" stroke-linecap="round"/><path d="M11 34c4-3 8-3 12 0s8 3 12 0" fill="none" stroke="#5fe3d4" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

// ---- side panel: saved games
function gamesTab( active ) {

	return `${ profiles.list.map( ( p ) => {

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
	<div class="pt-note">${ profiles.full ? loc( `${ MAX_PROFILES } games at most: delete one to start another.`, `Máximo ${ MAX_PROFILES } partidas: borra una para empezar otra.` ) : loc( 'Each game keeps its own progress in this browser.', 'Cada partida guarda su propio progreso en este navegador.' ) }</div>`;

}

// ---- side panel: the chain of maps
function mapsTab( active ) {

	const save = readSave( active ), here = save ? save.map : 'lake';
	const level = summary( active )?.level || 1;
	return `<div class="pt-maps">${ MAP_CATALOG.map( ( m ) => {

		const log = save && save.maps && save.maps[ m.id ] ? save.maps[ m.id ].log || {} : null;
		const caught = log && m.species ? m.species.filter( ( id ) => log[ id ] && log[ id ].count > 0 ).length : 0;
		return `<div class="pt-map is-${ m.status } ${ m.id === here ? 'is-here' : '' }">
			<div class="pt-map-n">${ m.order }</div>
			<div class="pt-map-body">
				<div class="pt-map-name">${ esc( m.name ) }${ m.id === here ? `<span class="pt-tag-on">${ loc( 'your game is here', 'tu partida está aquí' ) }</span>` : '' }</div>
				<small>${ esc( m.place ) } · <span class="pt-nowrap">${ loc( 'levels', 'niveles' ) } ${ m.levels }</span></small>
				${ m.species && log ? `<small>${ caught } ${ loc( 'of', 'de' ) } ${ m.species.length } ${ loc( 'species caught', 'especies capturadas' ) }</small>` : '' }
			</div>
			${ m.status === 'open' && level < ( m.unlock || 1 ) ? `<span class="pt-badge">${ loc( 'Level', 'Nivel' ) } ${ m.unlock }</span>` : `<span class="pt-badge is-${ m.status }">${ STATUS[ m.status ] }</span>` }
		</div>`;

	} ).join( '' ) }</div>
	<div class="pt-note">${ loc( 'You play on the map where your game is. To change map, travel by boat from the mooring (B): to every map your level has opened. While only the lake and the island exist, the island opens at level 10.', 'Juegas en el mapa donde está tu partida. Para cambiar de mapa, viaja en bote desde el amarre (B): a todos los mapas que tu nivel ya abrió. Mientras solo existan el lago y la isla, la isla se abre en el nivel 10.' ) }</div>`;

}

// ---- side panel: progress of the selected game
function progressTab( active ) {

	const d = readSave( active );
	if ( ! d ) return `<div class="pt-empty">${ loc( 'This game has not been played yet: its progress shows up here after the first catch.', 'Esta partida todavía no se ha jugado: su progreso aparece aquí después de la primera captura.' ) }</div>`;
	const lv = levelFromXp( d.xp || 0 );
	const t = d.playedSeconds || 0;
	const lic = d.maps && d.maps[ d.map ] ? d.maps[ d.map ].licences || {} : {};
	let tier = 0;
	for ( const [ k, until ] of Object.entries( lic ) ) if ( until > t && Number( k ) > tier ) tier = Number( k );
	// the basic licence of the starting map is free and never runs out (D82)
	const freeBasic = !! catalogEntry( d.map )?.freeBasic && tier <= 1;
	if ( freeBasic ) tier = 1;
	const left = freeBasic ? Infinity : tier ? lic[ tier ] - t : 0;
	const up = d.upgrades || {};
	const rig = UPGRADES.rig.levels[ Math.min( up.rig | 0, UPGRADES.rig.levels.length - 1 ) ];
	const hold = UPGRADES.hold.levels[ Math.min( up.hold | 0, UPGRADES.hold.levels.length - 1 ) ];
	const extras = [ up.fishFinder ? loc( 'fish finder', 'sonda' ) : '', up.lights ? loc( 'deck lights', 'luces de cubierta' ) : '' ].filter( Boolean );

	const logs = MAP_CATALOG.filter( ( m ) => m.species && d.maps && d.maps[ m.id ] ).map( ( m ) => {

		const log = d.maps[ m.id ].log || {};
		const rows = m.species.map( ( id ) => {

			const e = log[ id ], f = FISH[ id ];
			if ( ! f ) return '';
			return e && e.count > 0
				? `<div class="pt-fish"><span>${ esc( f.name ) }</span><span>${ e.count }×</span><span>${ ( e.bestKg || 0 ).toFixed( 2 ) } kg${ e.bestCm ? ` · ${ e.bestCm } cm` : '' }</span></div>`
				: `<div class="pt-fish is-missing"><span>${ esc( f.name ) }</span><span>—</span><span>${ loc( 'not caught yet', 'sin capturar' ) }</span></div>`;

		} ).join( '' );
		const n = m.species.filter( ( id ) => log[ id ] && log[ id ].count > 0 ).length;
		return `<h3>${ esc( m.name ) } · ${ n } ${ loc( 'of', 'de' ) } ${ m.species.length }</h3>
			<div class="pt-fish is-head"><span>${ loc( 'Species', 'Especie' ) }</span><span>${ loc( 'Caught', 'Capturas' ) }</span><span>${ loc( 'Best', 'Récord' ) }</span></div>${ rows }`;

	} ).join( '' );

	return `<div class="pt-prog">
		<div class="pt-prog-top"><b>${ loc( 'Level', 'Nivel' ) } ${ lv.level }</b><span class="pt-bar"><span style="width:${ ( lv.into / lv.need * 100 ).toFixed( 1 ) }%"></span></span><span>${ lv.into } / ${ lv.need } XP</span></div>
		<div class="pt-stats">
			<div><span>${ loc( 'Money', 'Dinero' ) }</span><b>${ money( d.money ) }</b></div>
			<div><span>${ loc( 'Played', 'Jugado' ) }</span><b>${ played( t ) }</b></div>
			<div><span>${ loc( 'Licence', 'Licencia' ) }</span><b>${ LICENSE[ tier ] }</b><small>${ freeBasic ? loc( 'free, no expiry', 'gratis, sin vencimiento' ) : tier ? `${ played( left ) } ${ loc( 'left', 'restantes' ) }` : '' }</small></div>
		</div>
		<div class="pt-gear"><span>${ loc( 'Float rig', 'Aparejo de flotador' ) } ${ loc( 'grade', 'grado' ) } ${ rig.grade } · ${ rig.lineKg } kg</span><span>${ esc( hold.label ) }</span>${ extras.length ? `<span>${ extras.join( ' · ' ) }</span>` : '' }</div>
		${ logs }
	</div>`;

}

function render() {

	const active = profiles.active, sum = summary( active );
	const map = catalogEntry( sum ? sum.map : 'island' );
	const root = document.getElementById( 'portada' );
	const typing = root.contains( document.activeElement ) && document.activeElement.tagName === 'INPUT' ? document.activeElement.value : null;
	const scroll = root.querySelector( '.pt-side-body' )?.scrollTop || 0;
	const tabs = [ [ 'games', loc( 'Saved games', 'Partidas' ) ], [ 'maps', loc( 'Maps', 'Mapas' ) ], [ 'progress', loc( 'Progress', 'Progreso' ) ] ];
	if ( ! tabs.some( ( [ id ] ) => id === tab ) ) tab = 'games';
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
					<div class="pt-card-meta">${ sum ? `${ map ? esc( map.name ) : '' } · ${ loc( 'Level', 'Nivel' ) } <b>${ sum.level }</b> · <b>${ money( sum.money ) }</b> · ${ played( sum.played ) }` : loc( 'A new game: you start on the mountain lake, where the basic licence is free for good.', 'Partida nueva: empiezas en el lago de montaña, donde la licencia básica es gratis y no vence.' ) }</div>
					<div class="pt-card-row">
						<button type="button" class="pt-play" data-play>${ PLAY }<span>${ sum ? loc( 'Play', 'Jugar' ) : loc( 'Start fishing', 'Empezar a pescar' ) }</span></button>
						<span class="pt-hint">${ loc( 'The game loads in a few seconds', 'El juego carga en unos segundos' ) }</span>
					</div>
				</div>
			</div>
			<aside class="pt-side">
				<nav class="pt-tabs" role="tablist">${ tabs.map( ( [ id, label ] ) => `<button type="button" role="tab" aria-selected="${ id === tab }" class="${ id === tab ? 'is-on' : '' }" data-tab="${ id }">${ label }</button>` ).join( '' ) }</nav>
				${ tab !== 'games' ? `<div class="pt-side-sub">${ esc( active.name ) }</div>` : '' }
				<div class="pt-side-body">${ tab === 'maps' ? mapsTab( active ) : tab === 'progress' ? progressTab( active ) : gamesTab( active ) }</div>
			</aside>
		</section>
		<footer class="pt-foot"><span>${ loc( `${ MAP_CATALOG.length } maps planned · the mountain lake and the island are open`, `${ MAP_CATALOG.length } mapas planeados · el lago de montaña y la isla están abiertos` ) }</span><span>Tidewater</span></footer>`;

	// wiring
	for ( const b of root.querySelectorAll( '[data-lang]' ) ) b.onclick = () => setLang( b.dataset.lang );
	root.querySelector( '[data-play]' ).onclick = play;
	for ( const b of root.querySelectorAll( '[data-tab]' ) ) b.onclick = () => {

		tab = b.dataset.tab;
		try {

			localStorage.setItem( TAB_KEY, tab );

		} catch ( e ) { /* blocked storage */ }

		render();

	};

	const body = root.querySelector( '.pt-side-body' );
	if ( body && scroll ) body.scrollTop = scroll;
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
	if ( ! input ) return;
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
