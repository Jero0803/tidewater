import { loc } from '../i18n.js';
import { FISH } from './FishTable.js';
import { UPGRADES, nextLevel, FUEL_PRICE } from './Gear.js';
import { LICENSES, licenseTierOf, licensePrice, LICENSE_DAYS } from './Progression.js';
import { activeMap } from '../maps/registry.js';
import { RODS, REELS, LINES, HOOKS, FLOATS, SINKERS, BAITS, LURES, POWERS, rigStats, isLure } from './Tackle.js';
import { TABLES, DURABLE, count, inUse, free, packUnits, packPrice, pieceLevel, canSell, sellPrice, goodFor, rigIssues, rigCastable,
	PACKS, packItems, packCost, packFullPrice, packLevel, RIG_SLOTS } from './TackleBag.js';

// The shop in a grid (docs/DISENO.md D81, E3b), for maps with tackle by pieces: tabs, filters on the left, cards in the
// middle, the selected item on the right (its numbers against the active rod, what fish it is for, what fits it, buy,
// buy and assemble, sell). The first tab shows the three assembled rods and the packs by species (D69). Island-style
// maps keep the old list (GameHUD.renderShop).
//
//   renderTackleShop( hud )   draws into hud.stand; the UI state lives in hud.shop

const TABS = [
	{ id: 'main', name: loc( 'Main', 'Principal' ) },
	{ id: 'rod', name: loc( 'Rods', 'Cañas' ), kinds: [ 'rod' ] },
	{ id: 'reel', name: loc( 'Reels', 'Carretes' ), kinds: [ 'reel' ] },
	{ id: 'line', name: loc( 'Lines', 'Sedales' ), kinds: [ 'line' ] },
	{ id: 'terminal', name: loc( 'Hooks & floats', 'Anzuelos y boyas' ), kinds: [ 'hook', 'float', 'sinker' ] },
	{ id: 'bait', name: loc( 'Baits', 'Cebos' ), kinds: [ 'bait' ] },
	{ id: 'lure', name: loc( 'Lures', 'Señuelos' ), kinds: [ 'lure' ] },
	{ id: 'boat', name: loc( 'Boat & hold', 'Bote y bodega' ) },
	{ id: 'lic', name: loc( 'Licences', 'Licencias' ) },
];
const TECH = { float: loc( 'Float', 'Flotador' ), spin: loc( 'Spinning', 'Spinning' ), bottom: loc( 'Bottom', 'Fondo' ) };
const LIC_NAME = [ '', loc( 'Basic', 'Básica' ), loc( 'Intermediate', 'Intermedia' ), loc( 'Advanced', 'Avanzada' ) ];
const DAYS_NAME = { 1: loc( '1 day', '1 día' ), 3: loc( '3 days', '3 días' ), 7: loc( '1 week', '1 semana' ) };

// simple line drawings per kind until there is art for every piece (E6)
const GLYPH = {
	rod: '<path d="M8 56 L56 8" stroke-width="3"/><circle cx="20" cy="44" r="5"/><path d="M14 50 l-4 4" stroke-width="5"/>',
	reel: '<circle cx="32" cy="30" r="14"/><circle cx="32" cy="30" r="5"/><path d="M32 44 v8 M24 52 h16 M46 30 h8"/>',
	line: '<ellipse cx="32" cy="18" rx="16" ry="5"/><path d="M16 18 v24 M48 18 v24"/><ellipse cx="32" cy="42" rx="16" ry="5"/><path d="M48 30 q10 4 6 18"/>',
	hook: '<path d="M38 8 v28 a10 10 0 1 1 -20 0 l4 -4"/><circle cx="38" cy="8" r="2"/>',
	float: '<path d="M32 6 v10"/><ellipse cx="32" cy="30" rx="9" ry="14"/><path d="M23 30 h18"/><path d="M32 44 v14"/>',
	sinker: '<path d="M32 8 v10"/><path d="M32 18 q14 14 0 34 q-14 -20 0 -34z"/>',
	bait: '<path d="M10 40 q8 -16 18 -4 t18 -2 t10 -10" stroke-width="5"/>',
	lure: '<path d="M32 6 v8"/><path d="M32 14 q12 10 0 30 q-12 -20 0 -30z"/><path d="M32 44 v6 m-5 2 q5 8 10 0"/>',
	pack: '<rect x="12" y="20" width="40" height="30" rx="3"/><path d="M12 30 h40 M32 20 v30 M22 20 l10 -10 l10 10"/>',
};
const glyph = ( kind, cls = '' ) => `<svg class="sh-glyph ${ cls }" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ GLYPH[ kind ] || GLYPH.pack }</svg>`;

const CSS = /* css */`
.gm-panel.sh-wide { width: min(calc(1080 * var(--tw-u)), 94vw); max-height: 84vh; height: 84vh; }
.sh-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tw-3); }
.sh-money { font-family: var(--tw-mono); color: var(--tw-sun); font-weight: 600; }
.sh-tabs { display: flex; flex-wrap: wrap; gap: var(--tw-1); margin: var(--tw-2) 0 var(--tw-3); border-bottom: 1px solid var(--tw-line); }
.sh-tab { font: 600 var(--tw-fs-sm) var(--tw-font); letter-spacing: 0.06em; text-transform: uppercase; color: var(--tw-ink-3); background: none; border: 0; border-bottom: 2px solid transparent; padding: var(--tw-2) var(--tw-2); cursor: pointer; }
.sh-tab.is-on { color: var(--tw-sun); border-bottom-color: var(--tw-sun); }
.sh-body { flex: 1; min-height: 0; display: grid; grid-template-columns: calc(170 * var(--tw-u)) 1fr calc(300 * var(--tw-u)); gap: var(--tw-4); }
.sh-body.is-wide { grid-template-columns: 1fr calc(300 * var(--tw-u)); }
.sh-body.is-full { grid-template-columns: 1fr; }
.sh-filters { overflow: auto; font-size: var(--tw-fs-sm); color: var(--tw-ink-2); }
.sh-filters h4 { margin: var(--tw-3) 0 var(--tw-1); font-size: var(--tw-fs-xs); letter-spacing: 0.14em; text-transform: uppercase; color: var(--tw-ink-3); }
.sh-filters h4:first-child { margin-top: 0; }
.sh-chip { display: block; width: 100%; text-align: left; font: 500 var(--tw-fs-sm) var(--tw-font); color: var(--tw-ink-2); background: none; border: 0; border-radius: var(--tw-r-sm); padding: 3px var(--tw-2); cursor: pointer; }
.sh-chip.is-on { background: var(--tw-fill-2); color: var(--tw-aqua); }
.sh-grid { overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(150 * var(--tw-u)), 1fr)); gap: var(--tw-3); align-content: start; padding-right: var(--tw-1); }
.sh-card { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: var(--tw-3) var(--tw-2); border-radius: var(--tw-r-md); background: var(--tw-fill); border: 1px solid var(--tw-line); color: var(--tw-ink); cursor: pointer; font: 500 var(--tw-fs-sm) var(--tw-font); text-align: center; }
.sh-card:hover { border-color: var(--tw-line-2); }
.sh-card.is-sel { border-color: var(--tw-aqua); background: rgba(var(--tw-aqua-rgb), 0.08); }
.sh-card.is-locked { opacity: 0.5; }
.sh-card .sh-glyph { width: calc(54 * var(--tw-u)); height: calc(54 * var(--tw-u)); color: var(--tw-ink-2); margin-bottom: var(--tw-1); }
.sh-card-meta { display: flex; justify-content: space-between; width: 100%; color: var(--tw-ink-3); font-size: var(--tw-fs-xs); font-family: var(--tw-mono); }
.sh-card-name { min-height: 2.4em; display: flex; align-items: center; justify-content: center; line-height: 1.2; }
.sh-price { font-family: var(--tw-mono); color: var(--tw-sun); font-weight: 600; }
.sh-price s { color: var(--tw-ink-3); font-weight: 400; margin-right: var(--tw-1); }
.sh-own { color: var(--tw-aqua); font-size: var(--tw-fs-xs); }
.sh-detail { overflow: auto; padding: var(--tw-3); border-radius: var(--tw-r-md); background: var(--tw-fill); border: 1px solid var(--tw-line); }
.sh-detail .sh-glyph { width: calc(90 * var(--tw-u)); height: calc(90 * var(--tw-u)); color: var(--tw-ink-2); display: block; margin: 0 auto var(--tw-2); }
.sh-detail h3 { margin: 0 0 var(--tw-2); font-size: var(--tw-fs-lg); }
.sh-stats { display: grid; grid-template-columns: 1fr auto; gap: 3px var(--tw-3); font-size: var(--tw-fs-sm); margin-bottom: var(--tw-3); }
.sh-stats span { color: var(--tw-ink-3); }
.sh-stats b { font-family: var(--tw-mono); font-weight: 500; text-align: right; }
.sh-up { color: var(--tw-aqua); } .sh-down { color: var(--tw-coral); }
.sh-note { font-size: var(--tw-fs-sm); color: var(--tw-ink-2); margin: 0 0 var(--tw-2); }
.sh-note b { color: var(--tw-ink-3); font-weight: 600; display: block; font-size: var(--tw-fs-xs); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2px; }
.sh-actions { display: flex; flex-wrap: wrap; gap: var(--tw-2); margin-top: var(--tw-3); }
.sh-rigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--tw-3); margin-bottom: var(--tw-4); }
.sh-rig { text-align: left; padding: var(--tw-3); border-radius: var(--tw-r-md); background: var(--tw-fill); border: 1px solid var(--tw-line); color: var(--tw-ink); font: 500 var(--tw-fs-sm) var(--tw-font); cursor: pointer; }
.sh-rig.is-on { border-color: var(--tw-aqua); }
.sh-rig h5 { margin: 0 0 var(--tw-1); font-size: var(--tw-fs-md); display: flex; justify-content: space-between; }
.sh-rig .is-ok { color: var(--tw-aqua); } .sh-rig .is-bad { color: var(--tw-coral); }
.sh-rig div { color: var(--tw-ink-2); line-height: 1.5; }
.sh-section { margin: 0 0 var(--tw-2); font-size: var(--tw-fs-xs); letter-spacing: 0.16em; text-transform: uppercase; color: var(--tw-ink-3); font-weight: 700; }
.sh-lic { display: grid; grid-template-columns: 1fr auto; gap: var(--tw-3); align-items: center; padding: var(--tw-3); border-radius: var(--tw-r-md); background: var(--tw-fill); border: 1px solid var(--tw-line); margin-bottom: var(--tw-3); }
.sh-lic.is-on { border-color: var(--tw-aqua); }
.sh-lic small { display: block; color: var(--tw-ink-3); margin-top: 2px; }
.sh-lic-buy { display: flex; gap: var(--tw-2); flex-wrap: wrap; justify-content: flex-end; }
`;

let styled = false;
function ensureStyle() {

	if ( styled || typeof document === 'undefined' ) return;
	const st = document.createElement( 'style' );
	st.textContent = CSS;
	document.head.appendChild( st );
	styled = true;

}

const esc = ( t ) => String( t ).replace( /[&<>"]/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } )[ c ] );
const fishName = ( id ) => FISH[ id ]?.name ?? id;
const money = ( n ) => `$${ Math.round( n ).toLocaleString() }`;
const mins = ( sec ) => {

	if ( ! Number.isFinite( sec ) ) return loc( 'no expiry', 'sin vencimiento' );
	const m = Math.ceil( sec / 60 );
	return m >= 60 ? `${ Math.floor( m / 60 ) } h${ m % 60 ? ` ${ m % 60 } min` : '' }` : `${ m } min`;

};

// the name of a piece, with its number for hooks, floats and sinkers
export function pieceName( kind, id ) {

	if ( kind === 'hook' ) return loc( `Hooks #${ id }`, `Anzuelos #${ id }` );
	if ( kind === 'float' ) return loc( `Floats ${ id } g`, `Boyas de ${ id } g` );
	if ( kind === 'sinker' ) return loc( `Sinkers ${ id } g`, `Plomos de ${ id } g` );
	return TABLES[ kind ][ id ]?.name ?? String( id );

}

// what a piece's numbers are, and the same numbers of what the active rod carries now (for the ↑ ↓)
function pieceStats( kind, id, rig ) {

	const cmp = ( a, b, better = 1 ) => ( b == null || a === b ? '' : ( a - b ) * better > 0 ? ' sh-up' : ' sh-down' );
	const rows = [];
	const row = ( name, val, cls = '' ) => rows.push( `<span>${ name }</span><b class="${ cls }">${ val }</b>` );
	if ( kind === 'rod' ) {

		const r = RODS[ id ], p = POWERS[ r.power ], cur = rig && RODS[ rig.rod ];
		row( loc( 'Technique', 'Técnica' ), TECH[ r.tech ] );
		row( loc( 'Power', 'Potencia' ), `${ p.name } (${ r.power })` );
		row( loc( 'Line', 'Sedal' ), `${ p.line[ 0 ] }–${ p.line[ 1 ] } kg`, cmp( p.line[ 1 ], cur && POWERS[ cur.power ].line[ 1 ] ) );
		row( loc( 'Lure / sinker', 'Cebo o plomo' ), `${ p.lure[ 0 ] }–${ p.lure[ 1 ] } g` );
		row( loc( 'Cast', 'Lance' ), `${ r.castM } m`, cmp( r.castM, cur && cur.castM ) );

	} else if ( kind === 'reel' ) {

		const r = REELS[ id ], cur = rig && REELS[ rig.reel ];
		row( loc( 'Retrieve', 'Recogida' ), `${ r.reel } m/s`, cmp( r.reel, cur && cur.reel ) );
		row( loc( 'Max drag', 'Freno máximo' ), `${ r.dragMax } kg`, cmp( r.dragMax, cur && cur.dragMax ) );
		row( loc( 'Holds (0.25 mm)', 'Capacidad (0.25 mm)' ), `${ r.cap25 } m`, cmp( r.cap25, cur && cur.cap25 ) );

	} else if ( kind === 'line' ) {

		const l = LINES[ id ], cur = rig && LINES[ rig.line ];
		row( loc( 'Strength', 'Resistencia' ), `${ l.kg } kg`, cmp( l.kg, cur && cur.kg ) );
		row( loc( 'Diameter', 'Grosor' ), `${ l.d.toFixed( 2 ) } mm` );
		row( loc( 'Looks like (to fish)', 'Se ve como (para el pez)' ), `${ ( l.d * l.vis ).toFixed( 2 ) } mm`, cmp( l.d * l.vis, cur && cur.d * cur.vis, - 1 ) );
		row( loc( 'Spool', 'Bobina' ), '150 m' );

	} else if ( kind === 'hook' ) {

		row( loc( 'Size', 'Tamaño' ), `#${ id }` );
		row( loc( 'Pack', 'Sobre' ), `${ HOOKS[ id ].n }` );

	} else if ( kind === 'float' || kind === 'sinker' ) {

		row( loc( 'Weight', 'Peso' ), `${ id } g` );
		row( loc( 'Pack', 'Sobre' ), `${ TABLES[ kind ][ id ].n }` );

	} else if ( kind === 'bait' ) {

		row( loc( 'Pack', 'Paquete' ), `${ BAITS[ id ].n }` );
		row( loc( 'Weight', 'Peso' ), `${ BAITS[ id ].g } g` );

	} else if ( kind === 'lure' ) {

		row( loc( 'Weight', 'Peso' ), `${ LURES[ id ].g } g` );

	}

	return rows.join( '' );

}

// what fits a rod: the lines in its range and, for spinning rods, the lures it casts
function compatible( kind, id ) {

	if ( kind !== 'rod' ) return '';
	const r = RODS[ id ], p = POWERS[ r.power ];
	const lines = Object.entries( LINES ).filter( ( [ , l ] ) => l.kg >= p.line[ 0 ] && l.kg <= p.line[ 1 ] ).map( ( [ , l ] ) => l.name );
	const lures = r.tech === 'spin' ? Object.entries( LURES ).filter( ( [ , l ] ) => l.g >= p.lure[ 0 ] && l.g <= p.lure[ 1 ] ).map( ( [ , l ] ) => l.name ) : [];
	return `<p class="sh-note"><b>${ loc( 'Fits it', 'Compatible' ) }</b>${ lines.join( ', ' ) || '—' }${ lures.length ? '<br>' + lures.join( ', ' ) : '' }</p>`;

}

// can this piece go on the active rod?
function fitsActive( s, kind, id ) {

	const rig = s.rig, tech = rig && RODS[ rig.rod ]?.tech;
	if ( DURABLE.has( kind ) ) return true;
	if ( ! tech ) return false;
	if ( kind === 'lure' ) return tech === 'spin';
	if ( kind === 'float' ) return tech === 'float';
	if ( kind === 'sinker' ) return tech === 'bottom';
	return tech !== 'spin'; // hooks and baits

}

function items( tab ) {

	const out = [];
	for ( const kind of tab.kinds || [] ) for ( const id of Object.keys( TABLES[ kind ] ) ) out.push( { kind, id: kind === 'hook' || kind === 'float' || kind === 'sinker' ? Number( id ) : id } );
	return out.sort( ( a, b ) => pieceLevel( a.kind, a.id ) - pieceLevel( b.kind, b.id ) || packPrice( a.kind, a.id ) - packPrice( b.kind, b.id ) );

}

function rigSummary( s, slot ) {

	const t = s.tackle, r = t.rigs[ slot ];
	const name = ( k, id ) => ( id == null ? '—' : pieceName( k, id ) );
	let body;
	if ( ! r || ! r.rod ) body = `<div>${ loc( 'Not assembled', 'Sin armar' ) }</div>`;
	else {

		const st = rigStats( r );
		const bk = r.bait ? ( isLure( r.bait ) ? 'lure' : 'bait' ) : null;
		body = `<div>${ name( 'rod', r.rod ) }<br>${ name( 'reel', r.reel ) } · ${ name( 'line', r.line ) }<br>${ r.hook && bk !== 'lure' ? '#' + r.hook + ' · ' : '' }${ r.float ? r.float + ' g · ' : '' }${ r.sinker ? r.sinker + ' g · ' : '' }${ bk ? name( bk, r.bait ) + ( bk === 'bait' ? ` (${ count( t.bag, 'bait', r.bait ) })` : ` (${ count( t.bag, 'lure', r.bait ) })` ) : loc( 'no bait', 'sin cebo' ) }${ st ? `<br>${ loc( 'line', 'sedal' ) } ${ st.lineKg } kg · ${ st.castM } m` : '' }</div>`;

	}

	const ready = rigCastable( t, slot ), empty = ! r || ! r.rod;
	const issues = rigIssues( t, slot ).filter( ( i ) => i !== 'empty' );
	return `<button class="sh-rig${ t.active === slot ? ' is-on' : '' }" data-rig="${ slot }"><h5>${ loc( 'Rod', 'Caña' ) } ${ slot + 1 }<span class="${ ready ? 'is-ok' : empty ? '' : 'is-bad' }">${ ready ? loc( 'ready', 'lista' ) : empty ? loc( 'empty', 'vacía' ) : loc( 'not ready', 'incompleta' ) }</span></h5>${ body }${ ! ready && ! empty && issues.length ? `<div class="is-bad">${ issues.join( ', ' ) }</div>` : '' }</button>`;

}

export function renderTackleShop( hud ) {

	ensureStyle();
	const s = hud.game.state, game = hud.game, v = hud.vendor;
	const ui = hud.shop || ( hud.shop = { tab: 'main', sel: null, fish: '', tech: '', power: '', mine: false } );
	const tab = TABS.find( ( t ) => t.id === ui.tab ) || TABS[ 0 ];
	const mapSpecies = activeMap().species.filter( ( id ) => FISH[ id ] && ! FISH[ id ].protected || id === 'capitan' );
	const level = s.level;
	let body = '', bodyCls = '';

	if ( tab.id === 'main' ) {

		const rigs = Array.from( { length: RIG_SLOTS }, ( _, i ) => rigSummary( s, i ) ).join( '' );
		const packs = Object.entries( PACKS ).filter( ( [ , p ] ) => p.species.some( ( id ) => activeMap().species.includes( id ) ) ).map( ( [ id, p ] ) => {

			const lv = packLevel( p ), lock = level < lv, sel = ui.sel === `pack:${ id }`;
			return `<button class="sh-card${ sel ? ' is-sel' : '' }${ lock ? ' is-locked' : '' }" data-sel="pack:${ id }">${ glyph( 'pack' ) }<div class="sh-card-meta"><span>★ ${ lv }</span><span>${ packItems( p ).length } ${ loc( 'items', 'piezas' ) }</span></div><div class="sh-card-name">${ loc( 'To fish', 'Para pescar' ) } ${ p.species.map( fishName ).join( ', ' ).toLowerCase() }</div><div class="sh-price"><s>${ money( packFullPrice( p ) ) }</s>${ money( packCost( p ) ) }</div></button>`;

		} ).join( '' );
		body = `<div class="sh-grid" style="display:block"><p class="sh-section">${ loc( 'Your rods · click one to make it the active rod (keys 1, 2, 3 while fishing come later)', 'Tus cañas · haz clic en una para que sea la activa' ) }</p><div class="sh-rigs">${ rigs }</div><p class="sh-section">${ loc( 'Packs by species · every piece of the right rod, 15 % off, assembled on the active rod', 'Paquetes por especie · todas las piezas de la caña correcta, 15 % menos, armadas en la caña activa' ) }</p><div class="sh-grid" style="overflow:visible">${ packs }</div></div>${ detailPack( s, ui ) }`;
		bodyCls = 'is-wide';

	} else if ( tab.id === 'boat' ) {

		body = `<div class="gm-list">${ boatRows( s ) }</div>`;
		bodyCls = 'is-full';

	} else if ( tab.id === 'lic' ) {

		body = `<div class="gm-list">${ licenceRows( s ) }</div>`;
		bodyCls = 'is-full';

	} else {

		const all = items( tab );
		const shown = all.filter( ( it ) => ( ! ui.mine || pieceLevel( it.kind, it.id ) <= level )
			&& ( ! ui.fish || goodFor( it.kind, it.id, [ ui.fish ] ).length )
			&& ( ! ui.tech || it.kind !== 'rod' || RODS[ it.id ].tech === ui.tech )
			&& ( ! ui.power || it.kind !== 'rod' || RODS[ it.id ].power === ui.power ) );
		if ( ! ui.sel || ! shown.some( ( it ) => `${ it.kind }:${ it.id }` === ui.sel ) ) ui.sel = shown.length ? `${ shown[ 0 ].kind }:${ shown[ 0 ].id }` : null;
		const cards = shown.map( ( it ) => {

			const key = `${ it.kind }:${ it.id }`, lv = pieceLevel( it.kind, it.id ), have = count( s.tackle.bag, it.kind, it.id );
			const units = packUnits( it.kind, it.id );
			return `<button class="sh-card${ ui.sel === key ? ' is-sel' : '' }${ level < lv ? ' is-locked' : '' }" data-sel="${ key }">${ glyph( it.kind ) }<div class="sh-card-meta"><span>★ ${ lv }</span><span>${ units > 1 ? '×' + units : '' }</span></div><div class="sh-card-name">${ esc( pieceName( it.kind, it.id ) ) }</div><div class="sh-price">${ money( packPrice( it.kind, it.id ) ) }</div>${ have ? `<div class="sh-own">${ loc( 'You have', 'Tienes' ) } ${ have }</div>` : '' }</button>`;

		} ).join( '' ) || `<div class="gm-empty">${ loc( 'Nothing matches these filters', 'Nada coincide con estos filtros' ) }</div>`;
		const chip = ( key, val, label ) => `<button class="sh-chip${ ui[ key ] === val ? ' is-on' : '' }" data-f="${ key }:${ val }">${ label }</button>`;
		const filters = `<div class="sh-filters">
			<h4>${ loc( 'For which fish', 'Para qué pez' ) }</h4>${ chip( 'fish', '', loc( 'Any', 'Cualquiera' ) ) }${ mapSpecies.map( ( id ) => chip( 'fish', id, fishName( id ) ) ).join( '' ) }
			${ tab.id === 'rod' ? `<h4>${ loc( 'Technique', 'Técnica' ) }</h4>${ chip( 'tech', '', loc( 'Any', 'Cualquiera' ) ) }${ Object.entries( TECH ).map( ( [ k, n ] ) => chip( 'tech', k, n ) ).join( '' ) }
			<h4>${ loc( 'Power', 'Potencia' ) }</h4>${ chip( 'power', '', loc( 'Any', 'Cualquiera' ) ) }${ Object.entries( POWERS ).map( ( [ k, p ] ) => chip( 'power', k, `${ p.name } (${ k })` ) ).join( '' ) }` : '' }
			<h4>${ loc( 'Level', 'Nivel' ) }</h4>${ chip( 'mine', false, loc( 'Everything', 'Todo' ) ) }${ chip( 'mine', true, loc( 'What my level allows', 'Lo que mi nivel permite' ) ) }
		</div>`;
		body = `${ filters }<div class="sh-grid">${ cards }</div>${ detailPiece( s, ui ) }`;

	}

	hud.stand.classList.add( 'sh-wide' );
	hud.stand.innerHTML = `
		<div class="sh-head"><h2>${ v ? esc( v.name ) : loc( 'Shop', 'Tienda' ) }</h2><span>${ loc( 'Level', 'Nivel' ) } ${ level } · <span class="sh-money">${ money( s.money ) }</span></span></div>
		<div class="sh-tabs">${ TABS.map( ( t ) => `<button class="sh-tab${ t.id === tab.id ? ' is-on' : '' }" data-tab="${ t.id }">${ t.name }</button>` ).join( '' ) }</div>
		<div class="sh-body ${ bodyCls }">${ body }</div>
		<div class="gm-foot"><span class="gm-sub">${ loc( 'What you buy goes in your bag; "Buy and assemble" puts it on the active rod', 'Lo que compras va a tu mochila; "Comprar y armar" lo pone en la caña activa' ) }</span><button class="gm-btn is-ghost" data-close>${ loc( 'Leave (E)', 'Salir (E)' ) }</button></div>`;

	const $$ = ( q ) => hud.stand.querySelectorAll( q );
	const redraw = () => renderTackleShop( hud );
	hud.stand.querySelector( '[data-close]' ).onclick = () => hud.closeStand();
	for ( const b of $$( '[data-tab]' ) ) b.onclick = () => { ui.tab = b.dataset.tab; ui.sel = null; redraw(); };
	for ( const b of $$( '[data-sel]' ) ) b.onclick = () => { ui.sel = b.dataset.sel; redraw(); };
	for ( const b of $$( '[data-f]' ) ) b.onclick = () => { const [ k, val ] = b.dataset.f.split( ':' ); ui[ k ] = k === 'mine' ? val === 'true' : val; redraw(); };
	for ( const b of $$( '[data-rig]' ) ) b.onclick = () => { s.setActiveRig( Number( b.dataset.rig ) ); redraw(); };
	const parse = ( v2 ) => { const [ k, id ] = v2.split( ':' ); return [ k, k === 'hook' || k === 'float' || k === 'sinker' ? Number( id ) : id ]; };
	const say = ( t ) => game.toast && game.toast( t, 1800 );
	for ( const b of $$( '[data-buy]' ) ) b.onclick = () => { const [ k, id ] = parse( b.dataset.buy ); if ( s.buyPiece( k, id ) ) say( `${ loc( 'Bought', 'Compraste' ) }: ${ pieceName( k, id ) }` ); redraw(); };
	for ( const b of $$( '[data-buyequip]' ) ) b.onclick = () => { const [ k, id ] = parse( b.dataset.buyequip ); if ( s.buyPiece( k, id, { equip: true } ) ) say( `${ pieceName( k, id ) } · ${ loc( 'on rod', 'en la caña' ) } ${ s.tackle.active + 1 }` ); redraw(); };
	for ( const b of $$( '[data-equip]' ) ) b.onclick = () => { const [ k, id ] = parse( b.dataset.equip ); if ( s.equipPiece( k, id ) ) say( `${ pieceName( k, id ) } · ${ loc( 'on rod', 'en la caña' ) } ${ s.tackle.active + 1 }` ); redraw(); };
	for ( const b of $$( '[data-sell]' ) ) b.onclick = () => { const [ k, id ] = parse( b.dataset.sell ); if ( s.sellPiece( k, id ) ) say( `${ loc( 'Sold', 'Vendiste' ) }: ${ pieceName( k, id ) } · ${ money( sellPrice( k, id ) ) }` ); redraw(); };
	for ( const b of $$( '[data-pack]' ) ) b.onclick = () => { if ( s.buyPack( b.dataset.pack ) ) say( loc( 'Pack bought and assembled', 'Paquete comprado y armado' ) ); redraw(); };
	for ( const b of $$( '[data-up]' ) ) b.onclick = () => { game.buy( b.dataset.up ); redraw(); };
	for ( const b of $$( '[data-lic]' ) ) b.onclick = () => { const [ tier, days ] = b.dataset.lic.split( ':' ).map( Number ); game.buyLicense( tier, days ); redraw(); };
	const f = hud.stand.querySelector( '[data-fuel]' );
	if ( f ) f.onclick = () => { game.refuel(); redraw(); };

}

function detailPiece( s, ui ) {

	if ( ! ui.sel ) return '<div class="sh-detail"></div>';
	const [ kind, raw ] = ui.sel.split( ':' );
	const id = kind === 'hook' || kind === 'float' || kind === 'sinker' ? Number( raw ) : raw;
	const t = s.tackle, price = packPrice( kind, id ), lv = pieceLevel( kind, id );
	const block = s.pieceBlock( kind, id );
	const fishFor = goodFor( kind, id, activeMap().species );
	const have = count( t.bag, kind, id ), used = DURABLE.has( kind ) ? inUse( t, kind, id ) : 0;
	const onActive = t.rigs[ t.active ] && ( t.rigs[ t.active ][ kind === 'lure' ? 'bait' : kind ] === id );
	const fits = fitsActive( s, kind, id );
	const canPut = ! onActive && fits && ( DURABLE.has( kind ) ? free( t, kind, id, t.active ) >= 1 : have >= 1 );
	const why = block === 'level' ? `${ loc( 'From level', 'Desde el nivel' ) } ${ lv }` : block === 'money' ? loc( 'Not enough money', 'No te alcanza' ) : '';
	return `<div class="sh-detail">${ glyph( kind ) }<h3>${ esc( pieceName( kind, id ) ) }</h3>
		<div class="sh-stats"><span>${ loc( 'Level', 'Nivel' ) }</span><b>★ ${ lv }</b><span>${ loc( 'Price', 'Precio' ) }</span><b class="sh-price">${ money( price ) }</b>${ pieceStats( kind, id, t.rigs[ t.active ] ) }</div>
		<p class="sh-note"><b>${ loc( 'Good for', 'Sirve para' ) }</b>${ fishFor.length ? fishFor.map( fishName ).join( ', ' ) : kind === 'reel' ? loc( 'any rod', 'cualquier caña' ) : '—' }</p>
		${ compatible( kind, id ) }
		<p class="sh-note"><b>${ loc( 'In your bag', 'En tu mochila' ) }</b>${ have }${ used ? ` · ${ loc( 'on a rod', 'en una caña' ) }: ${ used }` : '' }${ onActive ? ` · ${ loc( 'on the active rod', 'en la caña activa' ) }` : '' }</p>
		${ ! fits && ! DURABLE.has( kind ) ? `<p class="sh-note sh-down">${ loc( 'Does not go on the active rod (another technique)', 'No va en la caña activa (es de otra técnica)' ) }</p>` : '' }
		<div class="sh-actions">
			<button class="gm-btn" data-buy="${ kind }:${ id }" ${ block ? 'disabled' : '' }>${ loc( 'Buy', 'Comprar' ) } · ${ money( price ) }</button>
			${ fits && ! onActive ? `<button class="gm-btn" data-buyequip="${ kind }:${ id }" ${ block ? 'disabled' : '' }>${ loc( 'Buy and assemble', 'Comprar y armar' ) }</button>` : '' }
			${ canPut ? `<button class="gm-btn is-ghost" data-equip="${ kind }:${ id }">${ loc( 'Put on the active rod', 'Armar en la caña activa' ) }</button>` : '' }
			${ canSell( t, kind, id ) ? `<button class="gm-btn is-ghost" data-sell="${ kind }:${ id }">${ loc( 'Sell', 'Vender' ) } · ${ money( sellPrice( kind, id ) ) }</button>` : '' }
		</div>${ why ? `<p class="sh-note sh-down">${ why }</p>` : '' }</div>`;

}

function detailPack( s, ui ) {

	const id = ui.sel && ui.sel.startsWith( 'pack:' ) ? ui.sel.slice( 5 ) : Object.keys( PACKS ).find( ( k ) => PACKS[ k ].species.some( ( sp ) => activeMap().species.includes( sp ) ) );
	const p = PACKS[ id ];
	if ( ! p ) return '<div class="sh-detail"></div>';
	const block = s.packBlock( id );
	const list = packItems( p ).map( ( [ k, i ] ) => `<span>${ esc( pieceName( k, i ) ) }</span><b>${ money( packPrice( k, i ) ) }</b>` ).join( '' );
	return `<div class="sh-detail">${ glyph( 'pack' ) }<h3>${ loc( 'Pack to fish', 'Paquete para pescar' ) } ${ p.species.map( fishName ).join( ', ' ).toLowerCase() }</h3>
		<div class="sh-stats">${ list }<span>${ loc( 'Total', 'Total' ) }</span><b><s>${ money( packFullPrice( p ) ) }</s></b><span>${ loc( 'Pack price (−15 %)', 'Precio del paquete (−15 %)' ) }</span><b class="sh-price">${ money( packCost( p ) ) }</b><span>${ loc( 'Level', 'Nivel' ) }</span><b>★ ${ packLevel( p ) }</b></div>
		<p class="sh-note">${ loc( 'Everything is assembled on the active rod; what it had goes back to your bag.', 'Todo se arma en la caña activa; lo que tenía vuelve a tu mochila.' ) }</p>
		<div class="sh-actions"><button class="gm-btn" data-pack="${ id }" ${ block ? 'disabled' : '' }>${ loc( 'Buy the pack', 'Comprar el paquete' ) } · ${ money( packCost( p ) ) }</button></div>
		${ block === 'level' ? `<p class="sh-note sh-down">${ loc( 'From level', 'Desde el nivel' ) } ${ packLevel( p ) }</p>` : block === 'money' ? `<p class="sh-note sh-down">${ loc( 'Not enough money', 'No te alcanza' ) }</p>` : '' }</div>`;

}

function boatRows( s ) {

	const rows = Object.entries( UPGRADES ).filter( ( [ key ] ) => key !== 'rig' ).map( ( [ key, track ] ) => {

		const cur = track.levels[ s.upgrades[ key ] | 0 ];
		const next = nextLevel( s.upgrades, key );
		const btn = next ? `<button class="gm-btn" data-up="${ key }" ${ next.cost > s.money ? 'disabled' : '' }>${ money( next.cost ) }</button>` : `<span class="gm-have">${ loc( 'Top of the line', 'Lo mejor que hay' ) }</span>`;
		return `<div class="gm-shop-row"><span>${ track.name }: ${ next ? next.label : cur.label }<small>${ loc( 'Now:', 'Actual:' ) } ${ cur.label }</small></span>${ btn }</div>`;

	} ).join( '' );
	const missing = s.stats.fuelL - s.fuelL;
	const fuel = `<div class="gm-shop-row"><span>${ loc( 'Diesel', 'Diésel' ) } · $${ FUEL_PRICE.toFixed( 2 ) } / L<small>${ loc( 'Tank:', 'Tanque:' ) } ${ s.fuelL.toFixed( 0 ) } ${ loc( 'of', 'de' ) } ${ s.stats.fuelL } L</small></span>${ missing > 0.5 ? `<button class="gm-btn" data-fuel ${ s.money < FUEL_PRICE ? 'disabled' : '' }>${ loc( 'Fill', 'Llenar' ) } · $${ s.refuelCost() }</button>` : `<span class="gm-have">${ loc( 'Full', 'Lleno' ) }</span>` }</div>`;
	return fuel + rows;

}

function licenceRows( s ) {

	const active = s.licenseTier;
	return LICENSES.filter( Boolean ).map( ( L ) => {

		const keep = activeMap().species.filter( ( id ) => licenseTierOf( id ) <= L.tier && ! FISH[ id ].protected ).map( fishName );
		const own = L.free || s.licences[ L.tier ] > s.playedSeconds;
		const left = L.free ? Infinity : ( s.licences[ L.tier ] || 0 ) - s.playedSeconds;
		const status = L.free ? loc( 'Free · no expiry', 'Gratis · sin vencimiento' ) : own ? `${ loc( 'Active', 'Activa' ) } · ${ mins( left ) }${ L.tier < active ? ' · ' + loc( 'covered by a higher one', 'cubierta por una superior' ) : '' }` : s.level < L.minLevel ? `${ loc( 'From level', 'Desde el nivel' ) } ${ L.minLevel }` : loc( 'Not bought', 'Sin comprar' );
		const buy = L.free ? '' : LICENSE_DAYS.map( ( d ) => {

			const block = s.licenseBlock( L.tier, d.days );
			return `<button class="gm-btn${ d.days > 1 ? ' is-ghost' : '' }" data-lic="${ L.tier }:${ d.days }" ${ block ? 'disabled' : '' }>${ DAYS_NAME[ d.days ] } · ${ money( licensePrice( L, d.days ) ) }</button>`;

		} ).join( '' );
		return `<div class="sh-lic${ own ? ' is-on' : '' }"><div><b>${ loc( `${ LIC_NAME[ L.tier ] } licence`, `Licencia ${ LIC_NAME[ L.tier ].toLowerCase() }` ) }</b> · ${ status }<small>${ loc( 'You may keep', 'Puedes guardar' ) }: ${ keep.join( ', ' ) }</small>${ L.free ? '' : `<small>${ loc( 'Days are game days of play (120 min each); buying again adds them', 'Los días son días del juego jugado (120 min cada uno); comprar otra vez los suma' ) }</small>` }</div><div class="sh-lic-buy">${ buy }</div></div>`;

	} ).join( '' );

}
