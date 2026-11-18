// Language: English or Spanish, chosen once per page load.
//   loc( 'Cooler', 'Nevera' )  -> the string for the current language
//   setLang( 'en' )            -> saves the choice and reloads (the UI is built once at startup)
// The language comes from ?lang=en|es, else the saved choice (localStorage 'tidewater.lang'),
// else the browser's language (Spanish browsers get Spanish, everyone else English).
// Safe in Node (the headless tests): no window there, so it falls back to English.

const KEY = 'tidewater.lang';
const LANGS = [ 'en', 'es' ];

function detect() {

	try {

		const q = typeof location !== 'undefined' ? new URLSearchParams( location.search ).get( 'lang' ) : null;
		if ( LANGS.includes( q ) ) return q;

	} catch ( e ) { /* no URL */ }

	try {

		const s = typeof localStorage !== 'undefined' ? localStorage.getItem( KEY ) : null;
		if ( LANGS.includes( s ) ) return s;

	} catch ( e ) { /* storage blocked */ }

	if ( typeof window === 'undefined' ) return 'en';
	const nav = typeof navigator !== 'undefined' ? ( navigator.languages && navigator.languages[ 0 ] ) || navigator.language || '' : '';
	return nav.toLowerCase().startsWith( 'es' ) ? 'es' : 'en';

}

export const LANG = detect();

export function loc( en, es ) {

	return LANG === 'es' ? es : en;

}

export function setLang( lang ) {

	if ( ! LANGS.includes( lang ) || lang === LANG ) return;
	try {

		localStorage.setItem( KEY, lang );

	} catch ( e ) { /* storage blocked: the URL parameter still carries it */ }

	const url = new URL( location.href );
	if ( url.searchParams.has( 'lang' ) ) url.searchParams.set( 'lang', lang );
	location.replace( url.href );

}

// The loading screen is static HTML (juego.html, in English): translate it and wire its ES | EN switch.
const LOADER_ES = {
	kicker: 'Un juego de pesca en una isla',
	tagline: 'Saca el bote, recorre el arrecife y las aguas profundas, y véndele tu pesca a Joe antes de que oscurezca.',
	status: 'Iniciando…',
	note: 'La primera vez se compilan los shaders y puede tardar uno o dos minutos. Las siguientes visitas cargan mucho más rápido.',
	tipLabel: 'Consejo',
	tips: [
		'Pulsa <kbd>R</kbd> para sacar la caña. Mantén el clic izquierdo para cargar y suelta para lanzar: cuanto más lo mantengas, más lejos llega.',
		'Vigila la boya. Primero unos piquitos, luego se hunde: haz clic izquierdo en ese momento para clavar el anzuelo.',
		'En la pelea, mantén para recoger pero deja la tensión del sedal en el verde. Afloja cuando el pez corra, o se rompe el sedal.',
		'Lo que pica depende de dónde pesques: los bajos, el arrecife, las aguas profundas pasado el veril, y la hora del día.',
		'Joe, en el puesto de pescado junto al muelle, compra tu pesca. Se paga por peso, así que trae los grandes.',
		'Marta, junto al cobertizo de botes, vende mejoras: sedal más fuerte, carrete más rápido, bodega más grande, más combustible y una sonda de pesca.',
		'Pulsa <kbd>E</kbd> junto al bote para subir, en el timón para manejar, y otra vez para soltarlo y caminar por la cubierta.',
		'Pulsa <kbd>I</kbd> para ver tu nevera y el registro de pesca. Con los focos de cubierta de Marta puedes pescar de noche.',
	],
};

export function localizeLoader() {

	if ( typeof document === 'undefined' ) return;
	document.documentElement.lang = LANG;
	const L = document.getElementById( 'loader' );
	if ( ! L ) return;
	const set = ( sel, text ) => {

		const e = L.querySelector( sel );
		if ( e ) e.textContent = text;

	};

	if ( LANG === 'es' ) {

		L.setAttribute( 'aria-label', 'Cargando Tidewater' );
		set( '.loader-kicker', LOADER_ES.kicker );
		set( '.loader-tagline', LOADER_ES.tagline );
		set( '.loader-status', LOADER_ES.status );
		set( '.loader-note', LOADER_ES.note );
		set( '.loader-tip-label', LOADER_ES.tipLabel );
		L.querySelectorAll( '.loader-tip' ).forEach( ( e, i ) => {

			if ( LOADER_ES.tips[ i ] ) e.innerHTML = LOADER_ES.tips[ i ];

		} );

	}

	for ( const b of L.querySelectorAll( '[data-lang]' ) ) {

		const on = b.dataset.lang === LANG;
		b.classList.toggle( 'is-on', on );
		b.setAttribute( 'aria-pressed', String( on ) );
		b.addEventListener( 'click', () => setLang( b.dataset.lang ) );

	}

}
