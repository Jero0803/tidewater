import { loc } from '../i18n.js';
import { RODS, isLure, rigStats } from './Tackle.js';
import { TABLES, DURABLE, KINDS, count, free, inUse, canSell, sellPrice, rigIssues, rigCastable, RIG_SLOTS } from './TackleBag.js';
import { pieceName, ensureStyle as ensureShopStyle, confirmSell } from './ShopPanel.js';

// The gear tab of the inventory (docs/DISENO.md 7h, E4, D65): the three assembled rods side by side, each slot a list
// of what the bag holds for it, the active rod, and the bag with what is left of everything (sell spare rods, reels and
// spools for half their price, D68). Also the rig chip of the HUD (the active rod and its bait, as in Fishing Planet).

const CSS = /* css */`
.gm-panel.eq-wide { width: min(calc(860 * var(--tw-u)), 94vw); max-height: 84vh; }
.eq-tabs { display: flex; gap: var(--tw-1); margin: 0 0 var(--tw-3); border-bottom: 1px solid var(--tw-line); }
.eq-rigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--tw-3); }
.eq-rig { padding: var(--tw-3); border-radius: var(--tw-r-md); background: var(--tw-fill); border: 1px solid var(--tw-line); font-size: var(--tw-fs-sm); }
.eq-rig.is-on { border-color: var(--tw-aqua); }
.eq-rig h4 { margin: 0 0 var(--tw-2); display: flex; justify-content: space-between; align-items: center; font-size: var(--tw-fs-md); }
.eq-rig label { display: block; color: var(--tw-ink-3); font-size: var(--tw-fs-xs); letter-spacing: 0.08em; text-transform: uppercase; margin: var(--tw-2) 0 2px; }
.eq-rig select { width: 100%; font: 500 var(--tw-fs-sm) var(--tw-font); color: var(--tw-ink); background: rgba(10, 16, 24, 0.7); border: 1px solid var(--tw-line-2); border-radius: var(--tw-r-sm); padding: 3px var(--tw-1); }
.eq-rig .is-ok { color: var(--tw-aqua); } .eq-rig .is-bad { color: var(--tw-coral); }
.eq-stats { margin-top: var(--tw-2); color: var(--tw-ink-2); font-family: var(--tw-mono); font-size: var(--tw-fs-xs); }
.eq-bag { margin-top: var(--tw-4); display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(200 * var(--tw-u)), 1fr)); gap: 2px var(--tw-4); font-size: var(--tw-fs-sm); }
.eq-bag div { display: flex; justify-content: space-between; align-items: center; gap: var(--tw-2); padding: 2px 0; border-bottom: 1px solid var(--tw-line); }
.eq-bag b { font-family: var(--tw-mono); font-weight: 500; color: var(--tw-ink-2); }
.gm-rigchip { position: absolute; top: calc(var(--tw-edge) + 46 * var(--tw-u)); right: var(--tw-edge); display: flex; align-items: center; gap: var(--tw-2); padding: var(--tw-1) var(--tw-3); border-radius: 999px; font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink-2); pointer-events: none; transition: right var(--tw-slow) var(--tw-ease); }
.tw-root[data-panel='open'] .gm-rigchip { right: calc(var(--tw-panel-w) + 2 * var(--tw-3)); }
.gm-rigchip b { display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; border-radius: 50%; border: 1px solid var(--tw-line-2); color: var(--tw-ink); font-family: var(--tw-mono); }
.gm-rigchip .is-bad { color: var(--tw-coral); }
.gm-rigchip small { color: var(--tw-ink-3); }
.tw-root.is-photo .gm-rigchip { display: none; }
`;

let styled = false;
export function ensureEquipStyle() {

	if ( styled || typeof document === 'undefined' ) return;
	ensureShopStyle(); // the tab look (.sh-tab) is shared with the shop
	const st = document.createElement( 'style' );
	st.textContent = CSS;
	document.head.appendChild( st );
	styled = true;

}

const esc = ( t ) => String( t ).replace( /[&<>"]/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } )[ c ] );
const ISSUE = {
	rod: loc( 'no rod', 'falta la caña' ), reel: loc( 'no reel', 'falta el carrete' ), line: loc( 'no line', 'falta el sedal' ),
	bait: loc( 'no bait or lure', 'falta el cebo' ), hook: loc( 'no hook', 'falta el anzuelo' ), float: loc( 'no float', 'falta la boya' ),
	sinker: loc( 'no sinker', 'falta el plomo' ), lureTech: loc( 'bait and rod don\'t match', 'el cebo no va con la caña' ),
	noBait: loc( 'out of bait', 'se acabó el cebo' ), noHook: loc( 'out of hooks', 'se acabaron los anzuelos' ),
	noFloat: loc( 'out of floats', 'se acabaron las boyas' ), noSinker: loc( 'out of sinkers', 'se acabaron los plomos' ),
	lineHeavy: loc( 'line too strong for the rod', 'sedal muy fuerte para la caña' ), lineLight: loc( 'line too weak for the rod', 'sedal muy débil para la caña' ),
	castHeavy: loc( 'too heavy to cast', 'muy pesado para la caña' ), castLight: loc( 'too light to cast far', 'muy liviano para lanzar lejos' ),
};
export const issueText = ( i ) => ISSUE[ i ] || i;

// the options a rig slot can take: what the bag holds (durable pieces still free, or already on this rig)
function slotOptions( t, slot, kind ) {

	const r = t.rigs[ slot ] || {};
	const key = kind === 'lure' ? 'bait' : kind;
	const out = [];
	for ( const id of Object.keys( t.bag[ kind ] ) ) {

		const v = kind === 'hook' || kind === 'float' || kind === 'sinker' ? Number( id ) : id;
		const mine = r[ key ] === v;
		if ( DURABLE.has( kind ) && ! mine && free( t, kind, v, slot ) < 1 ) continue;
		const n = count( t.bag, kind, v );
		out.push( { kind, id: v, mine, label: `${ pieceName( kind, v ) }${ DURABLE.has( kind ) ? '' : ` (${ n })` }` } );

	}

	return out;

}

function select( t, slot, slotKey, kinds, label ) {

	const r = t.rigs[ slot ] || {};
	const opts = kinds.flatMap( ( k ) => slotOptions( t, slot, k ) );
	const cur = r[ slotKey ];
	const hasCur = opts.some( ( o ) => o.mine );
	const body = `<option value="">—</option>${ ! hasCur && cur != null ? `<option value="" selected>${ esc( pieceName( slotKey === 'bait' ? ( isLure( cur ) ? 'lure' : 'bait' ) : slotKey, cur ) ) } (0)</option>` : '' }${ opts.map( ( o ) => `<option value="${ o.kind }:${ o.id }"${ o.mine ? ' selected' : '' }>${ esc( o.label ) }</option>` ).join( '' ) }`;
	return `<label>${ label }</label><select data-slot="${ slot }" data-key="${ slotKey }">${ body }</select>`;

}

export function renderEquipment( s ) {

	const t = s.tackle;
	const rigs = Array.from( { length: RIG_SLOTS }, ( _, i ) => {

		const r = t.rigs[ i ];
		const tech = r && r.rod ? RODS[ r.rod ].tech : null;
		const ready = rigCastable( t, i );
		const issues = r && r.rod ? rigIssues( t, i ) : [];
		const st = r && r.rod && r.reel && r.line ? rigStats( r ) : null;
		return `<div class="eq-rig${ t.active === i ? ' is-on' : '' }">
			<h4>${ loc( 'Rod', 'Caña' ) } ${ i + 1 } <span class="${ ready ? 'is-ok' : r && r.rod ? 'is-bad' : '' }">${ ready ? loc( 'ready', 'lista' ) : r && r.rod ? loc( 'not ready', 'incompleta' ) : loc( 'empty', 'vacía' ) }</span></h4>
			${ select( t, i, 'rod', [ 'rod' ], loc( 'Rod', 'Caña' ) ) }
			${ select( t, i, 'reel', [ 'reel' ], loc( 'Reel', 'Carrete' ) ) }
			${ select( t, i, 'line', [ 'line' ], loc( 'Line', 'Sedal' ) ) }
			${ tech && tech !== 'spin' ? select( t, i, 'hook', [ 'hook' ], loc( 'Hook', 'Anzuelo' ) ) : '' }
			${ tech === 'float' ? select( t, i, 'float', [ 'float' ], loc( 'Float', 'Boya' ) ) : '' }
			${ tech === 'bottom' ? select( t, i, 'sinker', [ 'sinker' ], loc( 'Sinker', 'Plomo' ) ) : '' }
			${ tech ? select( t, i, 'bait', [ tech === 'spin' ? 'lure' : 'bait' ], tech === 'spin' ? loc( 'Lure', 'Señuelo' ) : loc( 'Bait', 'Carnada' ) ) : '' }
			${ st ? `<div class="eq-stats">${ loc( 'line', 'sedal' ) } ${ st.lineKg } kg · ${ st.lineCap } m · ${ loc( 'drag', 'freno' ) } ${ st.dragMax } kg · ${ loc( 'cast', 'lance' ) } ${ st.castM } m</div>` : '' }
			${ issues.length ? `<div class="eq-stats ${ ready ? '' : 'is-bad' }">${ issues.map( issueText ).join( ' · ' ) }</div>` : '' }
			${ t.active === i ? `<div class="eq-stats is-ok">${ loc( 'Active rod', 'Caña activa' ) }</div>` : `<button class="gm-mini" data-active="${ i }" style="margin-top:var(--tw-2)">${ loc( 'Use this rod', 'Usar esta caña' ) } (${ i + 1 })</button>` }
		</div>`;

	} ).join( '' );
	const bag = KINDS.flatMap( ( k ) => Object.keys( t.bag[ k ] ).map( ( id ) => {

		const v = k === 'hook' || k === 'float' || k === 'sinker' ? Number( id ) : id;
		const n = count( t.bag, k, v ), used = DURABLE.has( k ) ? inUse( t, k, v ) : 0;
		return `<div><span>${ esc( pieceName( k, v ) ) }</span><span><b>${ n }${ used ? ` · ${ loc( 'on a rod', 'en caña' ) } ${ used }` : '' }</b>${ canSell( t, k, v ) ? ` <button class="gm-mini" data-sell="${ k }:${ v }">${ loc( 'Sell', 'Vender' ) } $${ sellPrice( k, v ) }</button>` : '' }</span></div>`;

	} ) ).join( '' );
	return `<p class="gm-sub">${ loc( 'Assemble your three rods from what is in your bag; switch between them with 1, 2 and 3 while fishing. Buy more at the shop.', 'Arma tus tres cañas con lo que hay en tu mochila; cámbialas con 1, 2 y 3 mientras pescas. Compra más en la tienda.' ) }</p>
		<div class="eq-rigs">${ rigs }</div>
		<div class="eq-bag">${ bag || `<div>${ loc( 'Your bag is empty', 'Tu mochila está vacía' ) }</div>` }</div>`;

}

// wire the gear tab's controls (after its HTML is in place)
export function bindEquipment( root, s, redraw ) {

	for ( const el of root.querySelectorAll( 'select[data-slot]' ) ) el.onchange = () => {

		const slot = Number( el.dataset.slot ), key = el.dataset.key;
		if ( ! el.value ) {

			const r = s.tackle.rigs[ slot ];
			if ( r ) { r[ key ] = null; s.save(); s.emit(); }

		} else {

			const [ kind, id ] = el.value.split( ':' );
			s.equipPiece( kind, kind === 'hook' || kind === 'float' || kind === 'sinker' ? Number( id ) : id, slot );

		}

		redraw();

	};
	for ( const b of root.querySelectorAll( '[data-active]' ) ) b.onclick = () => { s.setActiveRig( Number( b.dataset.active ) ); redraw(); };
	for ( const b of root.querySelectorAll( '[data-sell]' ) ) b.onclick = () => confirmSell( b, () => { const [ k, id ] = b.dataset.sell.split( ':' ); s.sellPiece( k, id ); redraw(); } );

}

// the HUD chip: the active rod's number, its bait or lure and how many are left (red when it can't be cast)
export function rigChipText( s ) {

	const t = s.tackle, r = t.rigs[ t.active ];
	const ready = rigCastable( t );
	let what;
	if ( ! r || ! r.rod ) what = loc( 'empty rod', 'caña vacía' );
	else if ( ! r.bait ) what = `${ pieceName( 'rod', r.rod ) } · ${ loc( 'no bait', 'sin cebo' ) }`;
	else {

		const k = isLure( r.bait ) ? 'lure' : 'bait';
		what = `${ pieceName( k, r.bait ) } <small>×${ count( t.bag, k, r.bait ) }</small>`;

	}

	return `<b>${ t.active + 1 }</b><span class="${ ready ? '' : 'is-bad' }">${ what }</span>`;

}

export { TABLES };
