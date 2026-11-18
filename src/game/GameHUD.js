import { loc } from '../i18n.js';
import { FISH, FISH_IDS, fishLengthCm } from './FishTable.js';
import { UPGRADES, nextLevel, FUEL_PRICE } from './Gear.js';
import { FishPortrait } from './FishPortrait.js';
import { levelFromXp, LICENSES, LICENSE_WARN_SECONDS, DAY_SECONDS, licenseTierOf, dayPhase } from './Progression.js';

// DOM for the fishing game, in the look of the rest of the HUD (ui/ui.css tokens, .tw-glass):
//   top right     purse and cooler / hold load
//   bottom centre the fight: line tension with its safe band, the fish's stamina, line out
//   centre        "!" when a fish takes the bait
//   panels        inventory (I / Tab) and the fish stand's offer
//   catch card    full screen: the world dims and blurs, the fish lies side-on in its own studio light
//                 (FishPortrait) with the species above and length, weight, value, record below
const CSS = /* css */`
.gm-purse { position: absolute; top: var(--tw-edge); right: var(--tw-edge); display: flex; gap: var(--tw-3); align-items: center;
	padding: var(--tw-2) var(--tw-4); border-radius: 999px; font: 500 var(--tw-fs-lg) var(--tw-font); color: var(--tw-ink); pointer-events: none;
	transition: transform var(--tw-med) var(--tw-ease), right var(--tw-slow) var(--tw-ease); }
.tw-root[data-panel='open'] .gm-purse { right: calc(var(--tw-panel-w) + 2 * var(--tw-3)); }
.tw-root.is-photo .gm-panel { display: none; }
.gm-purse.is-bump { animation: gm-bump 420ms var(--tw-ease); }
@keyframes gm-bump { 30% { transform: scale(1.08); } }
.gm-money { font-family: var(--tw-mono); color: var(--tw-sun); font-weight: 600; }
.gm-cooler { display: flex; align-items: center; gap: var(--tw-2); color: var(--tw-ink-2); font-size: var(--tw-fs-md); }
.gm-cooler-bar { width: calc(64 * var(--tw-u)); height: calc(5 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-cooler-bar > span { display: block; height: 100%; width: 0; background: var(--tw-aqua); border-radius: inherit; transition: width var(--tw-med) var(--tw-ease); }
.gm-cooler.is-full .gm-cooler-bar > span { background: var(--tw-coral); }
.gm-fight { position: absolute; left: 50%; bottom: calc(max(calc(72 * var(--tw-u)), 13vh) + calc(58 * var(--tw-u))); transform: translateX(-50%);
	width: calc(360 * var(--tw-u)); padding: var(--tw-3) var(--tw-4); border-radius: var(--tw-r-lg); font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink);
	opacity: 0; transition: opacity var(--tw-med) var(--tw-ease); pointer-events: none; }
.gm-fight.is-on { opacity: 1; }
.gm-fight-head { display: flex; justify-content: space-between; margin-bottom: var(--tw-2); }
.gm-fight-call { font-weight: 600; letter-spacing: 0.02em; }
.gm-fight-call.is-warn { color: var(--tw-coral); }
.gm-fight-call.is-good { color: var(--tw-aqua); }
.gm-fight-dist { font-family: var(--tw-mono); color: var(--tw-ink-2); }
.gm-tension { position: relative; height: calc(12 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-band { position: absolute; top: 0; bottom: 0; background: rgba(var(--tw-aqua-rgb), 0.28); border-left: 1px solid rgba(var(--tw-aqua-rgb), 0.6); border-right: 1px solid rgba(var(--tw-aqua-rgb), 0.6); }
.gm-danger { position: absolute; top: 0; bottom: 0; right: 0; width: 8%; background: rgba(255, 122, 133, 0.35); }
.gm-needle { position: absolute; top: -2px; bottom: -2px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--tw-ink); box-shadow: 0 0 8px rgba(255,255,255,0.6); }
.gm-needle.is-hot { background: var(--tw-coral); box-shadow: 0 0 10px var(--tw-coral); }
.gm-stamina { margin-top: var(--tw-2); display: flex; align-items: center; gap: var(--tw-2); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-stamina-bar { flex: 1; height: calc(4 * var(--tw-u)); border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; }
.gm-stamina-bar > span { display: block; height: 100%; background: var(--tw-sun); }
.gm-bite { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%) scale(0.6); font: 800 calc(56 * var(--tw-u)) var(--tw-font);
	color: var(--tw-sun); text-shadow: 0 0 18px rgba(var(--tw-sun-rgb), 0.8), 0 2px 4px rgba(0,0,0,0.5); opacity: 0; pointer-events: none;
	transition: opacity 120ms, transform 200ms var(--tw-ease); }
.gm-bite.is-on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.gm-cast { position: absolute; left: 50%; top: 58%; transform: translateX(-50%); width: calc(140 * var(--tw-u)); height: calc(5 * var(--tw-u));
	border-radius: 99px; background: var(--tw-fill-2); overflow: hidden; opacity: 0; transition: opacity var(--tw-fast); pointer-events: none; }
.gm-cast.is-on { opacity: 1; }
.gm-cast > span { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--tw-aqua), var(--tw-sun)); }
.gm-dot { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: rgba(255,255,255,0.7); box-shadow: 0 0 3px rgba(0,0,0,0.6); opacity: 0; pointer-events: none; }
.gm-dot.is-on { opacity: 1; }
.gm-panel { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -48%); width: calc(420 * var(--tw-u)); max-height: 70vh; display: flex; flex-direction: column;
	padding: var(--tw-4) var(--tw-5); border-radius: var(--tw-r-lg); font: 500 var(--tw-fs-md) var(--tw-font); color: var(--tw-ink);
	opacity: 0; pointer-events: none; transition: opacity var(--tw-med) var(--tw-ease), transform var(--tw-slow) var(--tw-ease); }
.gm-panel.is-open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.gm-panel h2 { margin: 0 0 var(--tw-1); font-size: calc(17 * var(--tw-u)); font-weight: 600; }
.gm-panel p.gm-sub { margin: 0 0 var(--tw-3); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-list { overflow: auto; margin: 0 calc(-1 * var(--tw-2)); padding: 0 var(--tw-2); }
.gm-row { display: grid; grid-template-columns: 1fr auto auto auto; gap: var(--tw-3); align-items: center; padding: var(--tw-2) 0; border-bottom: 1px solid var(--tw-line); }
.gm-row .gm-kg, .gm-row .gm-val { font-family: var(--tw-mono); color: var(--tw-ink-2); }
.gm-row .gm-val { color: var(--tw-sun); }
.gm-row small { color: var(--tw-aqua); margin-left: var(--tw-1); }
.gm-empty { color: var(--tw-ink-3); padding: var(--tw-4) 0; text-align: center; }
.gm-foot { display: flex; justify-content: space-between; align-items: center; margin-top: var(--tw-3); gap: var(--tw-3); }
.gm-btn { font: 600 var(--tw-fs-md) var(--tw-font); color: #0b1418; background: var(--tw-aqua); border: 0; border-radius: 999px; padding: var(--tw-2) var(--tw-4); cursor: pointer; }
.gm-btn[disabled] { opacity: 0.4; cursor: default; }
.gm-btn.is-ghost { background: var(--tw-fill-2); color: var(--tw-ink); }
.gm-mini { font: 500 var(--tw-fs-sm) var(--tw-font); color: var(--tw-ink-2); background: var(--tw-fill); border: 1px solid var(--tw-line); border-radius: 999px; padding: 2px var(--tw-2); cursor: pointer; }
.gm-gauge { display: none; align-items: center; gap: var(--tw-2); color: var(--tw-ink-2); font-size: var(--tw-fs-md); }
.gm-gauge.is-on { display: flex; }
.gm-gauge b { font-family: var(--tw-mono); font-weight: 500; color: var(--tw-ink); }
.gm-fuel-bar > span { background: var(--tw-sun); }
.gm-fuel.is-low .gm-fuel-bar > span { background: var(--tw-coral); }
.gm-sonar-dots { letter-spacing: 1px; color: var(--tw-aqua); }
.gm-shop-row { display: grid; grid-template-columns: 1fr auto; gap: var(--tw-3); align-items: center; padding: var(--tw-2) 0; border-bottom: 1px solid var(--tw-line); }
.gm-shop-row small { display: block; color: var(--tw-ink-3); font-size: var(--tw-fs-sm); margin-top: 2px; }
.gm-shop-row .gm-have { color: var(--tw-ink-3); font-size: var(--tw-fs-sm); }
.gm-log { margin-top: var(--tw-3); color: var(--tw-ink-3); font-size: var(--tw-fs-sm); line-height: 1.5; }
.gm-row .gm-cm { font-family: var(--tw-mono); color: var(--tw-ink-3); }
.gm-row.has-cm { grid-template-columns: 1fr auto auto auto auto; }
/* level, XP and licence (Phase 1) */
.gm-level { display: flex; align-items: center; gap: var(--tw-2); color: var(--tw-ink-2); font-size: var(--tw-fs-md); }
.gm-level b { font-family: var(--tw-mono); font-weight: 600; color: var(--tw-ink); }
.gm-xp-bar { width: calc(48 * var(--tw-u)); }
.gm-xp-bar > span { background: var(--tw-sun); }
.gm-level.is-up b { animation: gm-bump 900ms var(--tw-ease) 2; color: var(--tw-sun); }
.gm-lic { color: var(--tw-ink-3); font-size: var(--tw-fs-sm); white-space: nowrap; }
.gm-lic.is-low { color: var(--tw-coral); }
.gm-row small.cls-trophy, .gm-cls.cls-trophy { color: #f0c46a; }
.gm-row small.cls-unique, .gm-cls.cls-unique { color: #d9a2ff; }
.gm-prog { display: grid; grid-template-columns: auto 1fr auto; gap: var(--tw-3); align-items: center; margin: 0 0 var(--tw-3); font-size: var(--tw-fs-sm); color: var(--tw-ink-2); }
.gm-prog b { color: var(--tw-ink); font-family: var(--tw-mono); }
.gm-shop-head { margin: var(--tw-3) 0 0; color: var(--tw-ink-3); font-size: var(--tw-fs-xs); font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
.gm-shop-row.is-active > span:first-child { color: var(--tw-aqua); }
.gm-stat.is-class b { font-family: var(--tw-font); font-size: clamp(18px, 1.9vw, 28px); }
.gm-stat.is-class.cls-trophy b { color: #f0c46a; }
.gm-stat.is-class.cls-unique b { color: #d9a2ff; }
.gm-stat.is-class.cls-juvenile b { color: rgba(244, 234, 214, 0.7); }
.gm-clock { gap: var(--tw-2); font-variant-numeric: tabular-nums; }
.gm-clock b { font-family: var(--tw-mono); font-weight: 600; color: var(--tw-ink); }
.gm-clock .gm-phase { color: var(--tw-ink-3); }
.gm-clock.is-paused b { color: var(--tw-coral); }
.gm-catch-level { margin-top: var(--tw-2); font-family: 'Kalam', var(--tw-font); font-size: clamp(16px, 1.5vw, 22px); color: #f0c46a; }

/* catch card: full screen. The world dims and blurs; the fish lies side-on in its own studio light
   (FishPortrait, a WebGPU canvas) between the name above and the numbers below */
.gm-catch-scrim { position: absolute; inset: 0; pointer-events: none; opacity: 0; visibility: hidden;
	background: radial-gradient(70% 60% at 50% 50%, rgba(10, 22, 34, 0.55) 0%, rgba(4, 9, 15, 0.86) 100%);
	-webkit-backdrop-filter: blur(10px) saturate(0.8); backdrop-filter: blur(10px) saturate(0.8);
	transition: opacity 420ms var(--tw-ease), visibility 0s linear 420ms; }
.gm-catch-scrim.is-on { opacity: 1; visibility: visible; transition: opacity 420ms var(--tw-ease), visibility 0s; }
.gm-catch { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(6px, 1.4vh, 18px);
	padding: var(--tw-6) var(--tw-edge); color: #f4ead6; font: 500 var(--tw-fs-md) var(--tw-font); text-align: center;
	pointer-events: none; opacity: 0; visibility: hidden; transition: opacity 300ms var(--tw-ease), visibility 0s linear 300ms; }
.gm-catch.is-on { opacity: 1; visibility: visible; transition: opacity 300ms var(--tw-ease), visibility 0s; }
.gm-catch-top, .gm-catch-bottom { display: flex; flex-direction: column; align-items: center; opacity: 0; }
.gm-catch.is-on .gm-catch-top { animation: gm-rise 700ms var(--tw-ease) 120ms forwards; }
.gm-catch.is-on .gm-catch-bottom { animation: gm-rise 700ms var(--tw-ease) 520ms forwards; }
@keyframes gm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.gm-catch-eyebrow { display: flex; align-items: center; justify-content: center; min-height: calc(26 * var(--tw-u)); margin-bottom: var(--tw-2);
	font-size: var(--tw-fs-sm); font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(244, 234, 214, 0.62); }
.gm-badge { display: inline-flex; align-items: center; gap: 0.5em; padding: calc(4 * var(--tw-u)) calc(12 * var(--tw-u)); border-radius: 4px;
	letter-spacing: 0.22em; font-weight: 800; transform: scale(2.4) rotate(-8deg); opacity: 0; }
.gm-catch.is-on .gm-badge { animation: gm-stamp 520ms cubic-bezier(0.3, 1.5, 0.5, 1) 900ms forwards; }
.gm-badge.is-record { color: #2a1604; background: linear-gradient(100deg, #f3cf8a 0%, #d9a441 40%, #fff0cf 50%, #d9a441 60%, #f3cf8a 100%); background-size: 250% 100%;
	box-shadow: 0 0 0 2px rgba(42, 22, 4, 0.35) inset, 0 0 26px rgba(217, 164, 65, 0.55); }
.gm-catch.is-on .gm-badge.is-record { animation: gm-stamp 520ms cubic-bezier(0.3, 1.5, 0.5, 1) 900ms forwards, gm-shine 2.6s var(--tw-ease-io) 1.6s infinite; }
.gm-badge.is-new { color: #062420; background: #6fd6c6; box-shadow: 0 0 0 2px rgba(6, 36, 32, 0.3) inset, 0 0 22px rgba(111, 214, 198, 0.45); }
.gm-badge.is-plain { color: rgba(244, 234, 214, 0.8); background: none; box-shadow: inset 0 0 0 1px rgba(244, 234, 214, 0.35); }
@keyframes gm-stamp { 0% { transform: scale(2.4) rotate(-8deg); opacity: 0; } 70% { transform: scale(0.94) rotate(-3deg); opacity: 1; } 100% { transform: scale(1) rotate(-3deg); opacity: 1; } }
@keyframes gm-shine { 0% { background-position: 100% 0; } 100% { background-position: -150% 0; } }
.gm-catch h2 { margin: 0; font-family: 'Caveat Brush', 'Kalam', var(--tw-font); font-weight: 400; font-size: clamp(38px, 6.2vw, 92px); line-height: 1; letter-spacing: 0.01em;
	color: #fbf1dc; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35), 0 8px 30px rgba(0, 0, 0, 0.45); }
.gm-catch-sci { margin-top: calc(4 * var(--tw-u)); font-family: 'Kalam', var(--tw-font); font-style: italic; color: rgba(244, 234, 214, 0.66); font-size: clamp(13px, 1.3vw, 19px); }
.gm-catch-stage { position: relative; width: min(94vw, 1400px, calc(46vh * 2.4)); aspect-ratio: 2.4 / 1; }
.gm-catch-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%;
	-webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%); }
/* the card owns the screen: the minimap and the settings rail step aside */
.tw-root:has(.gm-catch.is-on) .gm-map, .tw-root:has(.gm-catch.is-on) .tw-rail { opacity: 0; pointer-events: none; transition: opacity 300ms; }
.gm-catch-stage::before { content: ''; position: absolute; left: 12%; right: 12%; bottom: 6%; height: 16%; border-radius: 50%;
	background: radial-gradient(closest-side, rgba(0, 0, 0, 0.5), transparent); opacity: 0; }
.gm-catch.is-on .gm-catch-stage::before { animation: gm-fade 900ms var(--tw-ease) 350ms forwards; }
@keyframes gm-fade { to { opacity: 1; } }
.gm-splash { position: absolute; left: 50%; top: 52%; width: 0; height: 0; pointer-events: none; }
.gm-splash i { position: absolute; left: 0; top: 0; width: var(--s); height: var(--s); margin: calc(var(--s) / -2); border-radius: 50%;
	background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(190, 235, 245, 0.55) 55%, transparent 72%); opacity: 0; }
.gm-catch.is-on .gm-splash i { animation: gm-drop 1100ms cubic-bezier(0.2, 0.7, 0.3, 1) var(--d) forwards; }
@keyframes gm-drop { 0% { opacity: 0; transform: translate(0, 0) scale(0.4); } 12% { opacity: 1; }
	100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1); } }
.gm-catch-stats { display: flex; justify-content: center; gap: clamp(8px, 1.6vw, 22px); margin-top: var(--tw-2); }
.gm-stat { min-width: clamp(96px, 11vw, 150px); padding: calc(10 * var(--tw-u)) calc(16 * var(--tw-u)) calc(9 * var(--tw-u)); border-radius: 6px;
	background: linear-gradient(180deg, rgba(232, 220, 192, 0.12), rgba(232, 220, 192, 0.05)); box-shadow: inset 0 0 0 1px rgba(214, 180, 110, 0.38), 0 10px 30px rgba(0, 0, 0, 0.25); }
.gm-stat span { display: block; font-size: var(--tw-fs-xs); font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(222, 190, 125, 0.9); }
.gm-stat b { display: block; margin-top: calc(4 * var(--tw-u)); font: 600 clamp(20px, 2.2vw, 32px) var(--tw-mono); color: #fbf1dc; white-space: nowrap; }
.gm-stat b small { font-size: 0.55em; font-weight: 500; color: rgba(244, 234, 214, 0.7); margin-left: 0.2em; }
.gm-stat i { display: block; white-space: nowrap; font-style: normal; font-family: var(--tw-mono); font-size: var(--tw-fs-sm); color: rgba(244, 234, 214, 0.5); margin-top: 2px; }
.gm-stat.is-value b { color: #f0c46a; }
.gm-catch-note { margin-top: var(--tw-3); min-height: 1.4em; color: rgba(244, 234, 214, 0.78); font-family: 'Kalam', var(--tw-font); font-size: clamp(14px, 1.25vw, 19px); line-height: 1.4; }
.gm-catch-note b { color: #f0c46a; font-weight: 700; }
.gm-catch-note.is-warn { color: #ff9a8a; }
.gm-catch-foot { display: flex; align-items: center; justify-content: center; gap: var(--tw-2); margin-top: var(--tw-3); color: rgba(244, 234, 214, 0.5); font-size: var(--tw-fs-sm); }
.gm-catch-foot kbd { font: 600 var(--tw-fs-xs) var(--tw-mono); color: #f4ead6; padding: 2px calc(6 * var(--tw-u)); border-radius: 4px; border: 1px solid rgba(244, 234, 214, 0.3); background: rgba(244, 234, 214, 0.08); }
.gm-catch-timer { width: calc(80 * var(--tw-u)); height: 2px; margin-left: var(--tw-2); border-radius: 2px; background: rgba(244, 234, 214, 0.15); overflow: hidden; }
.gm-catch-timer > span { display: block; height: 100%; width: 100%; background: rgba(244, 234, 214, 0.55); transform-origin: 0 50%; }
.gm-catch.is-on .gm-catch-timer > span { animation: gm-timer var(--gm-catch-ms, 9000ms) linear forwards; }
@keyframes gm-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) {
	.gm-catch.is-on .gm-catch-top, .gm-catch.is-on .gm-catch-bottom { animation: none; opacity: 1; }
	.gm-catch.is-on .gm-badge, .gm-catch.is-on .gm-badge.is-record { animation: none; transform: rotate(-3deg); opacity: 1; }
	.gm-catch.is-on .gm-splash i { animation: none; }
}
@media (max-width: 640px) {
	.gm-catch-stage { width: 96vw; }
	.gm-catch-stats { gap: 6px; }
	.gm-stat { min-width: 0; padding: 8px 10px; }
}
`;

// names shown for licences and size classes
export const licenseName = ( tier ) => [ loc( 'No', 'Sin' ), loc( 'Basic', 'Básica' ), loc( 'Intermediate', 'Intermedia' ), loc( 'Advanced', 'Avanzada' ) ][ tier ] ?? '';
export const className = ( id ) => ( { juvenile: loc( 'Juvenile', 'Juvenil' ), common: loc( 'Common', 'Común' ), trophy: loc( 'Trophy', 'Trofeo' ), unique: loc( 'Unique', 'Único' ) } )[ id ] ?? '';
// time left: "1 h 35 min" / "12 min"
const minutes = ( sec ) => {

	const m = Math.ceil( sec / 60 );
	return m >= 60 ? `${ Math.floor( m / 60 ) } h${ m % 60 ? ` ${ m % 60 } min` : '' }` : `${ m } min`;

};

// why a catch went back in the water (GameState.lastCatch.reason), as one short line
export function releaseText( info, state ) {

	switch ( info.reason ) {

		case 'juvenile': return loc( 'Juvenile · back in the water to grow', 'Juvenil · de vuelta al agua para que crezca' );
		case 'protected': return loc( 'Protected species · catch and release', 'Especie protegida · captura y suelta' );
		case 'license': return loc( `Needs the ${ licenseName( info.tier ).toLowerCase() } licence · you let it go`, `Necesitas la licencia ${ licenseName( info.tier ).toLowerCase() } · lo soltaste` );
		case 'full': {

			const hold = state && state.upgrades.hold > 0;
			return loc( `No room in the ${ hold ? 'hold' : 'cooler' } · you let it go`, `No cabe en la ${ hold ? 'bodega' : 'nevera' } · lo soltaste` );

		}

		default: return '';

	}

}

const h = ( tag, cls, html ) => {

	const e = document.createElement( tag );
	if ( cls ) e.className = cls;
	if ( html !== undefined ) e.innerHTML = html;
	return e;

};

export class GameHUD {

	constructor( ui, game ) {

		this.ui = ui;
		this.game = game;
		const style = h( 'style' );
		style.textContent = CSS;
		document.head.append( style );

		this.purse = h( 'div', 'gm-purse tw-glass', `<span class="gm-level"><b class="gm-level-n">${ loc( 'Lv', 'Nv' ) } 1</b><span class="gm-cooler-bar gm-xp-bar"><span></span></span><span class="gm-lic"></span></span><span class="gm-money">$0</span><span class="gm-cooler"><span class="gm-cooler-label">${ loc( 'Cooler', 'Nevera' ) }</span><span class="gm-cooler-bar"><span></span></span><span class="gm-cooler-kg">0 / 30 kg</span></span><span class="gm-gauge gm-fuel"><span>${ loc( 'Fuel', 'Diésel' ) }</span><span class="gm-cooler-bar gm-fuel-bar"><span></span></span><b class="gm-fuel-l">40 L</b></span><span class="gm-gauge gm-sonar"><span>${ loc( 'Sonar', 'Sonda' ) }</span><b class="gm-sonar-d">0 m</b><span class="gm-sonar-dots"></span></span>` );
		this.fuelEl = this.purse.querySelector( '.gm-fuel' );
		this.fuelBar = this.purse.querySelector( '.gm-fuel-bar > span' );
		this.fuelL = this.purse.querySelector( '.gm-fuel-l' );
		this.sonarEl = this.purse.querySelector( '.gm-sonar' );
		this.sonarD = this.purse.querySelector( '.gm-sonar-d' );
		this.sonarDots = this.purse.querySelector( '.gm-sonar-dots' );
		this.moneyEl = this.purse.querySelector( '.gm-money' );
		this.levelEl = this.purse.querySelector( '.gm-level' );
		this.levelN = this.purse.querySelector( '.gm-level-n' );
		this.xpBar = this.purse.querySelector( '.gm-xp-bar > span' );
		this.licEl = this.purse.querySelector( '.gm-lic' );
		// the game clock, next to the mode chip (top left): hour, part of the day, paused
		this.clockEl = h( 'div', 'tw-mode gm-clock', `<b>16:12</b><span class="gm-phase"></span>` );
		this.clockEl.title = loc( 'Game clock · one game hour every 5 real minutes · T pauses it', 'Reloj del juego · una hora del juego cada 5 minutos reales · T lo pausa' );
		this.clockTime = this.clockEl.querySelector( 'b' );
		this.clockPhase = this.clockEl.querySelector( '.gm-phase' );
		if ( ui.modeEl ) ui.modeEl.after( this.clockEl );
		this.coolerEl = this.purse.querySelector( '.gm-cooler' );
		this.coolerBar = this.purse.querySelector( '.gm-cooler-bar > span' );
		this.coolerKg = this.purse.querySelector( '.gm-cooler-kg' );
		this.coolerLabel = this.purse.querySelector( '.gm-cooler-label' );

		this.fight = h( 'div', 'gm-fight tw-glass', `
			<div class="gm-fight-head"><span class="gm-fight-call">${ loc( 'Fish on!', '¡Pez enganchado!' ) }</span><span class="gm-fight-dist">0 m</span></div>
			<div class="gm-tension"><span class="gm-band"></span><span class="gm-danger"></span><span class="gm-needle"></span></div>
			<div class="gm-stamina"><span>${ loc( 'Fish', 'Pez' ) }</span><span class="gm-stamina-bar"><span></span></span></div>` );
		this.fCall = this.fight.querySelector( '.gm-fight-call' );
		this.fDist = this.fight.querySelector( '.gm-fight-dist' );
		this.fBand = this.fight.querySelector( '.gm-band' );
		this.fNeedle = this.fight.querySelector( '.gm-needle' );
		this.fStam = this.fight.querySelector( '.gm-stamina-bar > span' );

		this.bite = h( 'div', 'gm-bite', '!' );
		this.cast = h( 'div', 'gm-cast', '<span></span>' );
		this.castBar = this.cast.firstChild;
		this.dot = h( 'div', 'gm-dot' );
		this.catchScrim = h( 'div', 'gm-catch-scrim' );
		this.catchCard = h( 'div', 'gm-catch tw-glass' );
		this.catchOpen = false;
		const hud = ui.hud || ui.root;
		hud.append( this.catchScrim, this.purse, this.fight, this.bite, this.cast, this.dot, this.catchCard );

		// panels (interactive)
		this.inv = h( 'div', 'gm-panel tw-glass tw-interactive' );
		this.stand = h( 'div', 'gm-panel tw-glass tw-interactive' );
		ui.root.append( this.inv, this.stand );
		this.invOpen = false;
		this.standOpen = false;
		this._last = {};
		game.state.onChange( () => this.refresh() );
		this.refresh();

	}

	toast( text, ms ) {

		this.ui.toast( text, ms );

	}

	refresh() {

		const s = this.game.state;
		const st = s.stats;
		this.moneyEl.textContent = `$${ s.money.toLocaleString() }`;
		const kg = s.holdKg;
		this.coolerLabel.textContent = s.upgrades.hold > 0 ? loc( 'Hold', 'Bodega' ) : loc( 'Cooler', 'Nevera' );
		this.coolerKg.textContent = `${ kg.toFixed( 1 ) } / ${ st.holdKg } kg`;
		this.coolerBar.style.width = `${ Math.min( 100, kg / st.holdKg * 100 ) }%`;
		this.coolerEl.classList.toggle( 'is-full', kg > st.holdKg * 0.9 );
		if ( this._last.money !== undefined && this._last.money !== s.money ) {

			this.purse.classList.remove( 'is-bump' );
			void this.purse.offsetWidth;
			this.purse.classList.add( 'is-bump' );

		}

		this._last.money = s.money;
		const lv = levelFromXp( s.xp );
		this.levelN.textContent = `${ loc( 'Lv', 'Nv' ) } ${ lv.level }`;
		this.xpBar.style.width = `${ lv.into / lv.need * 100 }%`;
		this.levelEl.title = `${ lv.into } / ${ lv.need } XP`;
		if ( this._last.level !== undefined && lv.level > this._last.level ) {

			this.levelEl.classList.remove( 'is-up' );
			void this.levelEl.offsetWidth;
			this.levelEl.classList.add( 'is-up' );

		}

		this._last.level = lv.level;
		this._last.lic = null; // redraw the licence on the next frame
		if ( this.invOpen ) this.renderInventory();
		if ( this.standOpen ) this.vendor && this.vendor.kind === 'shop' ? this.renderShop() : this.renderStand();

	}

	// per frame
	update( { fight, casting, power, bite, aiming, fuel = null, sonar = null } ) {

		// the game clock
		const set = this.game.app.settings, hr = ( ( set.timeOfDay % 24 ) + 24 ) % 24;
		const clock = `${ String( Math.floor( hr ) ).padStart( 2, '0' ) }:${ String( Math.floor( ( hr % 1 ) * 60 ) ).padStart( 2, '0' ) }`;
		const paused = set.timeSpeed === 0;
		if ( clock !== this._last.clock || paused !== this._last.paused ) {

			this._last.clock = clock;
			this._last.paused = paused;
			this.clockTime.textContent = clock;
			const phase = { dawn: loc( 'dawn', 'alba' ), day: loc( 'day', 'día' ), dusk: loc( 'dusk', 'ocaso' ), night: loc( 'night', 'noche' ) }[ dayPhase( hr ) ];
			this.clockPhase.textContent = paused ? `${ phase } · ${ loc( 'paused', 'en pausa' ) }` : phase;
			this.clockEl.classList.toggle( 'is-paused', paused );

		}

		// the licence and its time left (changes every second of play)
		const s = this.game.state, tier = s.licenseTier, left = s.licenseSecondsLeft;
		const lic = tier ? `${ licenseName( tier ) } · ${ minutes( left ) }` : loc( 'No licence', 'Sin licencia' );
		if ( lic !== this._last.lic ) {

			this._last.lic = lic;
			this.licEl.textContent = lic;
			this.licEl.classList.toggle( 'is-low', ! tier || left < LICENSE_WARN_SECONDS );
			this.licEl.title = loc( 'Fishing licence of this map · counts down while you play', 'Licencia de pesca de este mapa · se descuenta mientras juegas' );
			if ( this.standOpen && this.vendor && this.vendor.kind === 'shop' ) this.renderShop();

		}

		// boat instruments in the purse: fuel while aboard, the fish finder when fitted
		this.fuelEl.classList.toggle( 'is-on', !! fuel );
		if ( fuel ) {

			this.fuelBar.style.width = `${ fuel.litres / fuel.tank * 100 }%`;
			this.fuelL.textContent = `${ fuel.litres.toFixed( 0 ) } L`;
			this.fuelEl.classList.toggle( 'is-low', fuel.litres < fuel.tank * 0.15 );

		}

		this.sonarEl.classList.toggle( 'is-on', !! sonar );
		if ( sonar ) {

			this.sonarD.textContent = `${ sonar.depth.toFixed( 1 ) } m`;
			const n = Math.round( sonar.fish * 4 );
			this.sonarDots.textContent = '●'.repeat( n ) + '○'.repeat( 4 - n );

		}


		this.fight.classList.toggle( 'is-on', !! fight );
		if ( fight ) {

			const T = Math.min( fight.tension, 1.05 );
			this.fNeedle.style.left = `${ T / 1.05 * 100 }%`;
			this.fNeedle.classList.toggle( 'is-hot', fight.tension > fight.band[ 1 ] );
			this.fBand.style.left = `${ fight.band[ 0 ] / 1.05 * 100 }%`;
			this.fBand.style.width = `${ ( fight.band[ 1 ] - fight.band[ 0 ] ) / 1.05 * 100 }%`;
			this.fStam.style.width = `${ fight.stamina * 100 }%`;
			this.fDist.textContent = `${ fight.distance.toFixed( 1 ) } m`;
			let call = loc( 'Reel in', 'Recoge' ), cls = '';
			if ( fight.tension > 0.88 ) { call = loc( 'Ease off!', '¡Afloja!' ); cls = 'is-warn'; }
			else if ( fight.surge > 0.55 ) { call = loc( 'It\'s running!', '¡Está corriendo!' ); cls = 'is-warn'; }
			else if ( fight.tension < 0.15 ) { call = loc( 'Slack line!', '¡Sedal flojo!' ); cls = 'is-warn'; }
			else if ( fight.tension >= fight.band[ 0 ] && fight.tension <= fight.band[ 1 ] ) { call = loc( 'Good pressure', 'Buena presión' ); cls = 'is-good'; }
			this.fCall.textContent = call;
			this.fCall.className = 'gm-fight-call ' + cls;

		}

		this.bite.classList.toggle( 'is-on', !! bite );
		this.cast.classList.toggle( 'is-on', !! casting );
		if ( casting ) this.castBar.style.width = `${ power * 100 }%`;
		this.dot.classList.toggle( 'is-on', !! aiming && ! this.invOpen && ! this.standOpen );

	}

	// ---- catch card
	// info: GameState.lastCatch ({ species, kg, cm, value, newSpecies, record, prevBestKg, prevBestCm, kept, cls, xp,
	// level, levelUp, reason, tier })
	showCatch( info, ms = 9000 ) {

		const f = FISH[ info.species ];
		const inch = info.cm / 2.54, lb = info.kg * 2.20462;
		const badge = info.record ? '<span class="gm-badge is-record">' + loc( '★ New record', '★ Nuevo récord' ) + '</span>'
			: info.newSpecies ? '<span class="gm-badge is-new">' + loc( 'New species', 'Especie nueva' ) + '</span>' : '<span class="gm-badge is-plain">' + loc( 'Catch', 'Captura' ) + '</span>';
		let note;
		if ( ! info.kept ) note = `<div class="gm-catch-note is-warn">${ releaseText( info, this.game.state ) }</div>`;
		else if ( info.record ) note = `<div class="gm-catch-note">${ loc( 'Previous best', 'Mejor anterior' ) } <b>${ info.prevBestKg.toFixed( 2 ) } kg</b> · ${ info.prevBestCm } cm. ${ loc( 'Beaten by', 'Superado por' ) } ${ ( info.kg - info.prevBestKg ).toFixed( 2 ) } kg.</div>`;
		else if ( info.newSpecies ) note = '<div class="gm-catch-note">' + loc( 'First one in your fish log.', 'El primero en tu registro de pesca.' ) + '</div>';
		else note = `<div class="gm-catch-note">${ loc( 'Your best:', 'Tu mejor:' ) } ${ info.prevBestKg.toFixed( 2 ) } kg · ${ info.prevBestCm } cm</div>`;
		// splash burst around the fish as it lands in view
		let drops = '';
		for ( let i = 0; i < 26; i ++ ) {

			const a = ( i / 26 ) * Math.PI * 2 + Math.random() * 0.3, r = 90 + Math.random() * 260;
			drops += `<i style="--s:${ ( 4 + Math.random() * 12 ).toFixed( 1 ) }px;--x:${ ( Math.cos( a ) * r * 1.8 ).toFixed( 0 ) }px;--y:${ ( Math.sin( a ) * r * 0.55 - 40 ).toFixed( 0 ) }px;--d:${ ( 250 + Math.random() * 220 ).toFixed( 0 ) }ms"></i>`;

		}

		const c = this.catchCard;
		c.style.setProperty( '--gm-catch-ms', `${ ms }ms` );
		c.innerHTML = `
			<div class="gm-catch-top">
				<div class="gm-catch-eyebrow">${ badge }</div>
				<h2>${ f.name }</h2>
				<div class="gm-catch-sci">${ f.sci || '' }</div>
			</div>
			<div class="gm-catch-stage"><canvas></canvas><div class="gm-splash">${ drops }</div></div>
			<div class="gm-catch-bottom">
				<div class="gm-catch-stats">
					<div class="gm-stat"><span>${ loc( 'Length', 'Largo' ) }</span><b>${ info.cm }<small>cm</small></b><i>${ inch.toFixed( 1 ) } in</i></div>
					<div class="gm-stat"><span>${ loc( 'Weight', 'Peso' ) }</span><b>${ info.kg < 1 ? info.kg.toFixed( 2 ) : info.kg.toFixed( 1 ) }<small>kg</small></b><i>${ lb.toFixed( 1 ) } lb</i></div>
					<div class="gm-stat is-class cls-${ info.cls }"><span>${ loc( 'Class', 'Clase' ) }</span><b>${ className( info.cls ) }</b><i>+${ info.xp } XP</i></div>
					<div class="gm-stat is-value"><span>${ loc( 'Value', 'Valor' ) }</span><b>$${ info.value }</b><i>${ info.kept ? ( this.game.state.upgrades.hold > 0 ? loc( 'in the hold', 'en la bodega' ) : loc( 'in the cooler', 'en la nevera' ) ) : loc( 'let go', 'soltado' ) }</i></div>
				</div>
				${ note }
				${ info.levelUp ? `<div class="gm-catch-level">${ loc( `Level ${ info.level }!`, `¡Nivel ${ info.level }!` ) }</div>` : '' }
				<div class="gm-catch-foot"><kbd>${ loc( 'Click', 'Clic' ) }</kbd> ${ loc( 'or', 'o' ) } <kbd>E</kbd> ${ loc( 'to continue', 'para continuar' ) }<span class="gm-catch-timer"><span></span></span></div>
			</div>`;
		// restart the entrance even when a card is already up
		c.classList.remove( 'is-on' );
		void c.offsetWidth;
		c.classList.add( 'is-on' );
		this.catchScrim.classList.add( 'is-on' );
		this.catchOpen = true;
		// the fish itself: the real model in a studio, drawn live into the stage canvas
		try {

			if ( ! this.portrait ) this.portrait = new FishPortrait();
			if ( this.portrait.attach( c.querySelector( '.gm-catch-stage canvas' ) ) ) this.portrait.show( info.species, info.kg );

		} catch ( e ) {

			console.warn( 'fish portrait unavailable', e );

		}

	}

	hideCatch() {

		this.catchCard.classList.remove( 'is-on' );
		this.catchScrim.classList.remove( 'is-on' );
		this.catchOpen = false;
		if ( this.portrait ) this.portrait.detach();

	}

	// ---- inventory
	toggleInventory( force ) {

		this.invOpen = force ?? ! this.invOpen;
		if ( this.invOpen ) {

			this.closeStand();
			this.renderInventory();
			releaseMouse();

		}

		this.inv.classList.toggle( 'is-open', this.invOpen );

	}

	renderInventory() {

		const s = this.game.state;
		const tag = ( f ) => ( f.cls === 'trophy' || f.cls === 'unique' ? `<small class="cls-${ f.cls }">${ className( f.cls ).toLowerCase() }</small>` : '' );
		const rows = s.inventory.map( ( f ) => `<div class="gm-row has-cm"><span>${ FISH[ f.species ].name }${ tag( f ) }${ f.record ? '<small>' + loc( 'record', 'récord' ) + '</small>' : '' }</span><span class="gm-cm">${ f.cm ?? Math.round( fishLengthCm( f.species, f.kg ) ) } cm</span><span class="gm-kg">${ f.kg.toFixed( 2 ) } kg</span><span class="gm-val">$${ f.value }</span><button class="gm-mini" data-release="${ f.id }">${ loc( 'Release', 'Soltar' ) }</button></div>` ).join( '' );
		const logged = Object.entries( s.log ).filter( ( [ k ] ) => FISH[ k ] ).map( ( [ k, v ] ) => `${ FISH[ k ].name }: ${ v.count } ${ loc( 'caught, best', 'capturados, mejor' ) } ${ v.bestKg.toFixed( 2 ) } kg · ${ v.bestCm ?? Math.round( fishLengthCm( k, v.bestKg ) ) } cm` ).join( '<br>' );
		this.inv.innerHTML = `
			<h2>${ s.upgrades.hold > 0 ? loc( 'Fish hold', 'Bodega' ) : loc( 'Cooler', 'Nevera' ) }</h2>
			<p class="gm-sub">${ s.inventory.length } ${ s.inventory.length === 1 ? loc( 'fish', 'pez' ) : loc( 'fish', 'peces' ) } · ${ s.holdKg.toFixed( 1 ) } ${ loc( 'of', 'de' ) } ${ s.stats.holdKg } kg · ${ loc( 'worth', 'valor' ) } $${ s.holdValue }</p>
			${ this.progressLine() }
			<div class="gm-list">${ rows || '<div class="gm-empty">' + loc( 'Nothing yet. Cast from the pier, the beach or the boat.', 'Nada todavía. Lanza desde el muelle, la playa o el bote.' ) + '</div>' }</div>
			${ logged ? `<div class="gm-log"><b>${ loc( 'Fish log', 'Registro de pesca' ) }</b><br>${ logged }</div>` : '' }
			<div class="gm-foot"><span class="gm-sub">${ loc( 'Sell at the fish stand by the pier', 'Vende en el puesto de pescado junto al muelle' ) }</span><button class="gm-btn is-ghost" data-close>${ loc( 'Close (I)', 'Cerrar (I)' ) }</button></div>`;
		this.inv.querySelector( '[data-close]' ).onclick = () => this.toggleInventory( false );
		for ( const b of this.inv.querySelectorAll( '[data-release]' ) ) b.onclick = () => s.release( Number( b.dataset.release ) );

	}

	// level, XP and licence, one line (inventory and shop)
	progressLine() {

		const s = this.game.state, lv = levelFromXp( s.xp ), tier = s.licenseTier;
		const lic = tier ? `${ loc( 'Licence', 'Licencia' ) } ${ licenseName( tier ).toLowerCase() } · ${ minutes( s.licenseSecondsLeft ) }` : loc( 'No licence', 'Sin licencia' );
		return `<div class="gm-prog"><b>${ loc( 'Level', 'Nivel' ) } ${ lv.level }</b><span class="gm-cooler-bar gm-xp-bar" style="width:100%" title="${ lv.into } / ${ lv.need } XP"><span style="width:${ lv.into / lv.need * 100 }%"></span></span><span>${ lic }</span></div>`;

	}

	// ---- fish stand
	openStand( vendor ) {

		this.standOpen = true;
		this.vendor = vendor;
		this.toggleInventory( false );
		if ( vendor.kind === 'shop' ) this.renderShop();
		else this.renderStand();
		this.stand.classList.add( 'is-open' );
		releaseMouse();

	}

	closeStand() {

		this.standOpen = false;
		this.stand.classList.remove( 'is-open' );

	}

	renderStand() {

		const s = this.game.state;
		const v = this.vendor || { name: loc( 'Fish buyer', 'Comprador de pescado' ) };
		const rows = s.inventory.map( ( f ) => `<div class="gm-row has-cm"><span>${ FISH[ f.species ].name }</span><span class="gm-cm">${ f.cm ?? Math.round( fishLengthCm( f.species, f.kg ) ) } cm</span><span class="gm-kg">${ f.kg.toFixed( 2 ) } kg</span><span class="gm-val">$${ f.value }</span><button class="gm-mini" data-sell="${ f.id }">${ loc( 'Sell', 'Vender' ) }</button></div>` ).join( '' );
		this.stand.innerHTML = `
			<h2>${ v.name }</h2>
			<p class="gm-sub">${ s.inventory.length ? v.greeting || loc( 'Let\'s see what you caught.', 'A ver qué pescaste.' ) : v.idle || loc( 'Come back when you\'ve got fish.', 'Vuelve cuando tengas pescado.' ) }</p>
			<div class="gm-list">${ rows || '<div class="gm-empty">' + loc( 'Your cooler is empty.', 'Tu nevera está vacía.' ) + '</div>' }</div>
			<div class="gm-foot"><button class="gm-btn is-ghost" data-close>${ loc( 'Leave (E)', 'Salir (E)' ) }</button><button class="gm-btn" data-all ${ s.inventory.length ? '' : 'disabled' }>${ loc( 'Sell all', 'Vender todo' ) } · $${ s.holdValue }</button></div>`;
		this.stand.querySelector( '[data-close]' ).onclick = () => this.closeStand();
		this.stand.querySelector( '[data-all]' ).onclick = () => this.game.sellAll();
		for ( const b of this.stand.querySelectorAll( '[data-sell]' ) ) b.onclick = () => this.game.sell( [ Number( b.dataset.sell ) ] );

	}

}

GameHUD.prototype.renderShop = function () {

	const s = this.game.state;
	const v = this.vendor;
	const rows = Object.entries( UPGRADES ).map( ( [ key, track ] ) => {

		const cur = track.levels[ s.upgrades[ key ] | 0 ];
		const next = nextLevel( s.upgrades, key );
		const btn = next
			? `<button class="gm-btn" data-buy="${ key }" ${ next.cost > s.money ? 'disabled' : '' }>$${ next.cost }</button>`
			: '<span class="gm-have">' + loc( 'Top of the line', 'Lo mejor que hay' ) + '</span>';
		return `<div class="gm-shop-row"><span>${ track.name }: ${ next ? next.label : cur.label }<small>${ loc( 'Now:', 'Actual:' ) } ${ cur.label }</small></span>${ btn }</div>`;

	} ).join( '' );
	// licences of this map (D18: cumulative, one game day of play each; buying again adds a day)
	const active = s.licenseTier;
	const licRows = LICENSES.filter( Boolean ).map( ( L ) => {

		const names = FISH_IDS.filter( ( id ) => licenseTierOf( id ) === L.tier && ! FISH[ id ].protected ).map( ( id ) => FISH[ id ].name ).join( ', ' );
		const own = s.licences[ L.tier ] > s.playedSeconds;
		const block = s.licenseBlock( L.tier );
		const status = own ? `${ loc( 'Active', 'Activa' ) } · ${ minutes( s.licences[ L.tier ] - s.playedSeconds ) }${ L.tier < active ? ' · ' + loc( 'covered by a higher one', 'cubierta por una superior' ) : '' }`
			: block === 'level' ? `${ loc( 'From level', 'Desde el nivel' ) } ${ L.minLevel }` : '';
		const btn = block === 'level'
			? `<span class="gm-have">${ loc( 'Level', 'Nivel' ) } ${ L.minLevel }</span>`
			: `<button class="gm-btn" data-lic="${ L.tier }" ${ block ? 'disabled' : '' }>${ own ? loc( '+1 day', '+1 día' ) : loc( 'Buy', 'Comprar' ) } · $${ L.price }</button>`;
		return `<div class="gm-shop-row${ own ? ' is-active' : '' }"><span>${ loc( `${ licenseName( L.tier ) } licence`, `Licencia ${ licenseName( L.tier ).toLowerCase() }` ) }${ status ? ` · ${ status }` : '' }<small>${ L.tier > 1 ? loc( 'Adds: ', 'Suma: ' ) : '' }${ names }</small></span>${ btn }</div>`;

	} ).join( '' );
	const missing = s.stats.fuelL - s.fuelL;
	const fuelRow = `<div class="gm-shop-row"><span>${ loc( 'Diesel', 'Diésel' ) } · $${ FUEL_PRICE.toFixed( 2 ) } / L<small>${ loc( 'Tank:', 'Tanque:' ) } ${ s.fuelL.toFixed( 0 ) } ${ loc( 'of', 'de' ) } ${ s.stats.fuelL } L</small></span>${ missing > 0.5 ? `<button class="gm-btn" data-fuel ${ s.money < FUEL_PRICE ? 'disabled' : '' }>${ loc( 'Fill', 'Llenar' ) } · $${ s.refuelCost() }</button>` : '<span class="gm-have">' + loc( 'Full', 'Lleno' ) + '</span>' }</div>`;
	this.stand.innerHTML = `
		<h2>${ v.name }</h2>
		<p class="gm-sub">${ v.greeting } · ${ loc( 'You have', 'Tienes' ) } $${ s.money.toLocaleString() }</p>
		${ this.progressLine() }
		<div class="gm-list"><div class="gm-shop-head">${ loc( `Licences · one game day of play (${ DAY_SECONDS / 60 } min)`, `Licencias · un día del juego jugado (${ DAY_SECONDS / 60 } min)` ) }</div>${ licRows }<div class="gm-shop-head">${ loc( 'Gear and boat', 'Equipo y bote' ) }</div>${ fuelRow }${ rows }</div>
		<div class="gm-foot"><span class="gm-sub">${ loc( 'Upgrades take effect at once', 'Las mejoras se aplican al instante' ) }</span><button class="gm-btn is-ghost" data-close>${ loc( 'Leave (E)', 'Salir (E)' ) }</button></div>`;
	this.stand.querySelector( '[data-close]' ).onclick = () => this.closeStand();
	for ( const b of this.stand.querySelectorAll( '[data-buy]' ) ) b.onclick = () => this.game.buy( b.dataset.buy );
	for ( const b of this.stand.querySelectorAll( '[data-lic]' ) ) b.onclick = () => this.game.buyLicense( Number( b.dataset.lic ) );
	const f = this.stand.querySelector( '[data-fuel]' );
	if ( f ) f.onclick = () => this.game.refuel();

};

function releaseMouse() {

	try {

		if ( document.pointerLockElement && document.exitPointerLock ) document.exitPointerLock();

	} catch ( e ) { /* ignore */ }

}
