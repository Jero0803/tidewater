import { loc, LANG, setLang } from '../i18n.js';
import * as THREE from '../engine/index.js';
import { UI } from './UI.js';
import { G } from '../core/Globals.js';
import { GroundBounce } from '../materials/GroundBounce.js';

// Binds the Tidewater UI (panel + HUD) to the running app.
const SEA = {
	Calm: { wind: 3.5, fetch: 40, chop: 0.75, swell: 0.28, surf: 0.18, period: 11, whitecaps: 0.2 },
	Breezy: { wind: 7, fetch: 120, chop: 0.9, swell: 0.48, surf: 0.34, period: 9, whitecaps: 0.5 },
	Choppy: { wind: 12, fetch: 300, chop: 1.05, swell: 0.68, surf: 0.56, period: 8.5, whitecaps: 0.75 },
	Storm: { wind: 20, fetch: 900, chop: 1.2, swell: 1.0, surf: 0.9, period: 12, whitecaps: 1 },
};

const SEA_ES = { Calm: 'Calma', Breezy: 'Brisa', Choppy: 'Picado', Storm: 'Tormenta' };

export class AppUI {

	constructor( app, ui = new UI() ) {

		this.app = app;
		this.ui = ui;
		const fft = app.fft;
		const shore = app.shore;

		// ---- plain values the controls bind to; onChange pushes them into the simulation
		const s = this.s = {
			wind: fft.local.windSpeed,
			windDir: fft.local.windDirection,
			fetch: fft.local.fetch,
			chop: fft.choppiness.value,
			swell: fft.swell.scale,
			whitecaps: 0.5,
			clarity: 1,
			surf: shore.amplitude.value,
			period: shore.period.value,
			gamma: shore.gamma.value,
			curl: shore.curl.value,
			caustics: app.caustics ? app.caustics.strength.value : 1,
			time: app.settings.timeOfDay,
			advance: app.settings.timeSpeed !== 0,
			timeSpeed: app.settings.timeSpeed || 0.05,
			clouds: app.clouds ? app.clouds.coverage.value : 0.45,
			cirrus: app.clouds && app.clouds.cirrus ? app.clouds.cirrus.value : 0.5,
			exposure: 0,
			fov: app.camera.fov,
			camMode: 'third',
			ao: app.post.params.aoStrength.value,
			bloom: app.post.params.bloom.value,
			flare: app.post.flare ? app.post.flare.strength.value : 1,
			vignette: app.post.params.vignette.value,
			saturation: app.post.params.saturation.value,
			contrast: app.post.params.contrast.value,
			grain: app.post.params.grain.value,
			renderScale: app.settings.renderScale,
			shadows: true,
		};

		const spectrum = () => {

			fft.local.windSpeed = s.wind;
			fft.local.windDirection = s.windDir;
			fft.local.fetch = s.fetch;
			fft.swell.scale = s.swell;
			fft.updateSpectrumUniforms();
			const a = THREE.MathUtils.degToRad( s.windDir );
			G.windDir.value.set( Math.cos( a ), Math.sin( a ) );
			G.windSpeed.value = s.wind;

		};

		const whitecaps = () => {

			// more whitecaps: foam starts at less compression (and more of it in fresh wind), lasts longer.
			// Only crests near breaking (strong compression) foam: a laxer threshold paints every crest line
			// with a white streak, which real open water at these wind speeds doesn't have.
			fft.foamBias.value = 0.5 + 0.16 * s.whitecaps + 0.01 * THREE.MathUtils.clamp( s.wind - 7, - 5, 12 );
			fft.foamDecay.value = 0.6 - 0.35 * s.whitecaps;

		};

		const clarity = () => {

			// scale absorption/scattering around the tropical defaults
			const k = 1 / Math.max( 0.2, s.clarity );
			G.waterAbsorption.value.set( 0.42, 0.075, 0.035 ).multiplyScalar( 0.6 + 0.4 * k );
			G.waterScattering.value.set( 0.012, 0.018, 0.024 ).multiplyScalar( k * k );

		};

		// ---------------------------------------------------------------- Ocean
		const ocean = ui.addTab( 'ocean', loc( 'Ocean', 'Océano' ), 'ocean' );
		const sea = ocean.addFolder( loc( 'Sea state', 'Estado del mar' ), { icon: 'wind' } );
		sea.addPresets( {
			label: loc( 'Conditions', 'Condiciones' ), active: loc( 'Breezy', 'Brisa' ),
			presets: Object.keys( SEA ).map( ( k ) => ( {
				label: loc( k, SEA_ES[ k ] ), icon: k.toLowerCase(),
				apply: () => {

					const p = SEA[ k ];
					Object.assign( s, p );
					spectrum();
					whitecaps();
					fft.choppiness.value = s.chop;
					shore.amplitude.value = s.surf;
					shore.period.value = s.period;

				},
			} ) ),
		} );
		sea.addSlider( { label: loc( 'Wind speed', 'Velocidad del viento' ), object: s, key: 'wind', min: 0.5, max: 30, step: 0.1, unit: 'm/s', tooltip: loc( 'Wind 10 m above the sea. Drives the local wind waves, whitecaps and spray.', 'Viento a 10 m sobre el mar. Genera el oleaje local, las crestas blancas y la espuma.' ), onChange: () => {

			spectrum();
			whitecaps();

		} } );
		sea.addSlider( { label: loc( 'Wind direction', 'Dirección del viento' ), object: s, key: 'windDir', min: 0, max: 360, step: 1, unit: '°', onChange: spectrum } );
		sea.addSlider( { label: loc( 'Fetch', 'Alcance del viento' ), object: s, key: 'fetch', min: 5, max: 2000, log: true, unit: 'km', tooltip: loc( 'Distance the wind has blown over open water: longer fetch, longer and higher waves.', 'Distancia que el viento ha soplado sobre mar abierto: a más alcance, olas más largas y altas.' ), onChange: spectrum } );
		sea.addSlider( { label: loc( 'Choppiness', 'Picado' ), object: s, key: 'chop', min: 0, max: 1.6, step: 0.01, tooltip: loc( 'Horizontal displacement: sharp crests, wide troughs.', 'Desplazamiento horizontal: crestas afiladas, senos anchos.' ), onChange: ( v ) => { fft.choppiness.value = v; } } );
		sea.addSlider( { label: loc( 'Ocean swell', 'Mar de fondo' ), object: s, key: 'swell', min: 0, max: 2, step: 0.01, onChange: spectrum } );
		sea.addSlider( { label: loc( 'Whitecaps', 'Crestas blancas' ), object: s, key: 'whitecaps', min: 0, max: 1, step: 0.01, onChange: whitecaps } );
		const water = ocean.addFolder( loc( 'Water', 'Agua' ), { icon: 'droplet' } );
		water.addSlider( { label: loc( 'Clarity', 'Claridad' ), object: s, key: 'clarity', min: 0.3, max: 2, step: 0.01, tooltip: loc( 'Lower = more suspended sediment and plankton (greener, murkier).', 'Menos = más sedimento y plancton en suspensión (más verde y turbia).' ), onChange: clarity } );

		// ---------------------------------------------------------------- Shore
		const shoreTab = ui.addTab( 'shore', loc( 'Shore', 'Costa' ), 'shore' );
		const surf = shoreTab.addFolder( loc( 'Surf', 'Rompiente' ), { icon: 'wave' } );
		surf.addSlider( { label: loc( 'Wave height', 'Altura de ola' ), object: s, key: 'surf', min: 0, max: 1.4, step: 0.01, unit: 'm', format: ( v ) => `${ ( v * 2 ).toFixed( 2 ) } m`, onChange: ( v ) => { shore.amplitude.value = v; } } );
		surf.addSlider( { label: loc( 'Wave period', 'Periodo de ola' ), object: s, key: 'period', min: 5, max: 16, step: 0.1, unit: 's', onChange: ( v ) => { shore.period.value = v; } } );
		surf.addSlider( { label: loc( 'Breaking depth ratio', 'Profundidad de rompiente' ), object: s, key: 'gamma', min: 0.5, max: 1.1, step: 0.01, tooltip: loc( 'Waves break when height exceeds this fraction of the depth.', 'Las olas rompen cuando su altura supera esta fracción de la profundidad.' ), onChange: ( v ) => { shore.gamma.value = v; } } );
		surf.addSlider( { label: loc( 'Curl', 'Rizo' ), object: s, key: 'curl', min: 0, max: 1.5, step: 0.01, onChange: ( v ) => { shore.curl.value = v; } } );
		if ( app.breakers ) {

			s.spray = app.breakers.params.spray.value;
			s.lip = app.breakers.params.sheet.value;
			surf.addSlider( { label: loc( 'Spray', 'Rocío' ), object: s, key: 'spray', min: 0, max: 2, step: 0.01, tooltip: loc( 'Droplets and mist thrown off breaking crests.', 'Gotas y bruma que saltan de las crestas al romper.' ), onChange: ( v ) => { app.breakers.params.spray.value = v; } } );
			surf.addSlider( { label: loc( 'Lip sheet', 'Labio de la ola' ), object: s, key: 'lip', min: 0, max: 1.5, step: 0.01, tooltip: loc( 'The thin sheet of water thrown forward by plunging breakers.', 'La lámina fina de agua que lanzan hacia delante las olas al romper en tubo.' ), onChange: ( v ) => { app.breakers.params.sheet.value = v; } } );

		}

		if ( app.wake ) {

			const boat = shoreTab.addFolder( loc( 'Boat wake', 'Estela del bote' ), { icon: 'wave', open: false } );
			s.wakeHeight = app.wake.amplitude.value;
			s.wakeFoam = app.wake.foamGain.value;
			boat.addSlider( { label: loc( 'Wake height', 'Altura de la estela' ), object: s, key: 'wakeHeight', min: 0, max: 2, step: 0.01, onChange: ( v ) => { app.wake.amplitude.value = v; } } );
			boat.addSlider( { label: loc( 'Wake foam', 'Espuma de la estela' ), object: s, key: 'wakeFoam', min: 0, max: 1.5, step: 0.01, onChange: ( v ) => { app.wake.foamGain.value = v; } } );

		}
		if ( app.caustics ) {

			const light = shoreTab.addFolder( loc( 'Caustics', 'Cáusticas' ), { icon: 'sun', open: false } );
			light.addSlider( { label: loc( 'Intensity', 'Intensidad' ), object: s, key: 'caustics', min: 0, max: 2, step: 0.01, onChange: ( v ) => { app.caustics.strength.value = v; } } );

		}

		// ---------------------------------------------------------------- Sky
		const sky = ui.addTab( 'sky', loc( 'Sky', 'Cielo' ), 'sky' );
		const sun = sky.addFolder( loc( 'Sun', 'Sol' ), { icon: 'clock' } );
		const clockInfo = sun.addInfo( { label: loc( 'Clock', 'Reloj' ), get: () => loc( 'free in photo mode (P)', 'libre en modo foto (P)' ), tooltip: loc( 'The day runs by itself, one game hour every 5 real minutes; T pauses it. The hour can only be moved in photo mode, and it goes back when you leave it.', 'El día avanza solo, una hora del juego cada 5 minutos reales; T lo pausa. La hora solo se mueve en el modo foto, y vuelve a la del juego al salir.' ) } );
		const timeCtl = sun.addTimeOfDay( { object: app.settings, key: 'timeOfDay' } );
		sun.addSlider( { label: loc( 'Sun azimuth', 'Azimut del sol' ), object: app.settings, key: 'sunAzimuth', min: - 180, max: 180, step: 1, format: ( v ) => `${ Math.round( v ) }°`, tooltip: loc( 'Turns the sun\'s path around the island (0 = the real path: rises in the east, sets in the west).', 'Gira la trayectoria del sol alrededor de la isla (0 = la real: sale por el este y se pone por el oeste).' ) } );
		let speed = null;
		sun.addToggle( { label: loc( 'Advance time', 'Avanzar el tiempo' ), object: s, key: 'advance', onChange: ( v ) => {

			app.settings.timeSpeed = v ? s.timeSpeed : 0;
			speed.setVisible( v );

		} } );
		speed = sun.addSlider( { label: loc( 'Time speed', 'Velocidad del tiempo' ), object: s, key: 'timeSpeed', min: 0.002, max: 1, log: true, unit: 'h/s', onChange: ( v ) => { if ( s.advance ) app.settings.timeSpeed = v; } } ).setVisible( s.advance );
		// D42: the hour, the toggle and the speed are locked while playing and free in photo mode
		const advanceCtl = sun.controls().find( ( c ) => c.key === 'advance' );
		const lockClock = ( locked ) => {

			for ( const c of [ timeCtl, advanceCtl, speed ] ) if ( c ) c.setEnabled( ! locked );
			clockInfo.setVisible( locked );
			speed.setVisible( s.advance );
			sun.refresh();

		};
		lockClock( true );
		const prevPhoto = ui.onPhotoMode;
		ui.onPhotoMode = ( on ) => {

			if ( prevPhoto ) prevPhoto( on );
			app.photoClock( on );
			lockClock( ! on );

		};
		const atmo = sky.addFolder( loc( 'Atmosphere', 'Atmósfera' ), { icon: 'cloud' } );
		if ( app.clouds ) atmo.addSlider( { label: loc( 'Cloud cover', 'Nubosidad' ), object: s, key: 'clouds', min: 0, max: 1, step: 0.01, format: ( v ) => `${ Math.round( v * 100 ) }%`, onChange: ( v ) => { app.clouds.coverage.value = v; } } );
		if ( app.clouds && app.clouds.cirrus ) atmo.addSlider( { label: loc( 'Cirrus', 'Cirros' ), object: s, key: 'cirrus', min: 0, max: 1, step: 0.01, format: ( v ) => `${ Math.round( v * 100 ) }%`, onChange: ( v ) => { app.clouds.cirrus.value = v; } } );
		if ( app.haze ) {

			s.haze = app.haze.density.value;
			s.shafts = app.haze.shafts.value;
			atmo.addSlider( { label: loc( 'Haze', 'Bruma' ), object: s, key: 'haze', min: 0, max: 4, step: 0.05, tooltip: loc( 'Aerial perspective and marine haze density (1 = about 20 km visibility at sea level, 0 = clear air).', 'Densidad de la perspectiva aérea y la bruma marina (1 = unos 20 km de visibilidad a nivel del mar, 0 = aire limpio).' ), onChange: ( v ) => { app.haze.density.value = v; } } );
			atmo.addSlider( { label: loc( 'Sun shafts', 'Rayos de sol' ), object: s, key: 'shafts', min: 0, max: 3, step: 0.05, tooltip: loc( 'Volumetric light shafts and crepuscular rays in the haze (shadows of palms, the pier, hills and clouds). 0 turns them off.', 'Haces de luz volumétricos y rayos crepusculares en la bruma (sombras de palmeras, el muelle, las colinas y las nubes). 0 los apaga.' ), onChange: ( v ) => { app.haze.shafts.value = v; } } );

		}
		if ( app.airMotes ) {

			s.air = app.airMotes.intensity.value;
			atmo.addSlider( { label: loc( 'Air particles', 'Partículas en el aire' ), object: s, key: 'air', min: 0, max: 2, step: 0.01, tooltip: loc( 'Dust, pollen, salt haze, seed fluff and the odd gnat drifting in the air: they catch the light when backlit by the sun. 0 turns them off.', 'Polvo, polen, salitre, pelusa de semillas y algún mosquito flotando en el aire: brillan a contraluz. 0 los apaga.' ), onChange: ( v ) => { app.airMotes.intensity.value = v; } } );

		}

		atmo.addSlider( { label: loc( 'Exposure', 'Exposición' ), object: s, key: 'exposure', min: - 3, max: 3, step: 0.1, unit: 'EV', onChange: ( v ) => { app.settings.exposure = 0.55 * Math.pow( 2, v ); } } );

		// ---------------------------------------------------------------- Camera
		const cam = ui.addTab( 'camera', loc( 'Camera', 'Cámara' ), 'camera' );
		const view = cam.addFolder( loc( 'View', 'Vista' ), { icon: 'camera' } );
		view.addSelect( { label: loc( 'Boat camera', 'Cámara del bote' ), object: s, key: 'camMode', options: [ { label: loc( '1st person', '1.ª persona' ), value: 'first' }, { label: loc( '3rd person', '3.ª persona' ), value: 'third' } ], onChange: ( v ) => { app.player.camMode = v; } } );
		view.addSlider( { label: loc( 'Field of view', 'Campo de visión' ), object: s, key: 'fov', min: 35, max: 100, step: 1, unit: '°', onChange: ( v ) => {

			app.camera.fov = v;
			app.camera.updateProjectionMatrix();

		} } );
		view.addButton( { label: loc( 'Free camera (F)', 'Cámara libre (F)' ), icon: 'camera', onClick: () => app.setFreeCam( ! app.freeCam ) } );

		// ---------------------------------------------------------------- Effects
		const fx = ui.addTab( 'effects', loc( 'Effects', 'Efectos' ), 'effects' );
		const post = fx.addFolder( loc( 'Post-processing', 'Posprocesado' ), { icon: 'sparkles' } );
		const P = app.post.params;
		post.addSlider( { label: loc( 'Ambient occlusion', 'Oclusión ambiental' ), object: s, key: 'ao', min: 0, max: 1.5, step: 0.01, onChange: ( v ) => { P.aoStrength.value = v; } } );
		s.bounce = GroundBounce.strength.value;
		post.addSlider( { label: loc( 'Bounce light', 'Luz rebotada' ), object: s, key: 'bounce', min: 0, max: 2, step: 0.01, tooltip: loc( 'Sunlight reflected off the ground (bright sand) onto undersides and shaded faces: pier, eaves, hulls, trunks. 0 = off.', 'Luz del sol reflejada por el suelo (arena clara) hacia las partes inferiores y en sombra: muelle, aleros, cascos, troncos. 0 = apagada.' ), onChange: ( v ) => { GroundBounce.strength.value = v; } } );
		s.sharpen = P.sharpen.value;
		post.addSlider( { label: loc( 'Sharpen', 'Nitidez' ), object: s, key: 'sharpen', min: 0, max: 1, step: 0.01, tooltip: loc( 'Contrast-adaptive sharpening after the temporal anti-aliasing.', 'Enfoque adaptativo al contraste después del antialiasing temporal.' ), onChange: ( v ) => { P.sharpen.value = v; } } );
		if ( app.post.motionBlur ) {

			const mb = app.post.motionBlur.shutter;
			s.motionBlur = mb.value;
			post.addSlider( { label: loc( 'Motion blur', 'Desenfoque de movimiento' ), object: s, key: 'motionBlur', min: 0, max: 1, step: 0.05, format: ( v ) => v > 0 ? `${ Math.round( v * 360 ) }°` : loc( 'Off', 'Apagado' ), tooltip: loc( 'Camera and object motion blur, as a shutter angle (180° = film look). 0 turns it off.', 'Desenfoque de movimiento de cámara y objetos, como ángulo de obturación (180° = aspecto de cine). 0 lo apaga.' ), onChange: ( v ) => { mb.value = v; } } );

		}

		post.addSlider( { label: loc( 'Bloom', 'Resplandor' ), object: s, key: 'bloom', min: 0, max: 0.3, step: 0.005, onChange: ( v ) => { P.bloom.value = v; } } );
		if ( app.post.flare ) post.addSlider( { label: loc( 'Lens flare', 'Destello de lente' ), object: s, key: 'flare', min: 0, max: 2, step: 0.05, onChange: ( v ) => { app.post.flare.strength.value = v; } } );
		post.addSlider( { label: loc( 'Saturation', 'Saturación' ), object: s, key: 'saturation', min: 0.5, max: 1.5, step: 0.01, onChange: ( v ) => { P.saturation.value = v; } } );
		post.addSlider( { label: loc( 'Contrast', 'Contraste' ), object: s, key: 'contrast', min: 0.8, max: 1.3, step: 0.01, onChange: ( v ) => { P.contrast.value = v; } } );
		post.addSlider( { label: loc( 'Vignette', 'Viñeta' ), object: s, key: 'vignette', min: 0, max: 1, step: 0.01, onChange: ( v ) => { P.vignette.value = v; } } );
		post.addSlider( { label: loc( 'Film grain', 'Grano de película' ), object: s, key: 'grain', min: 0, max: 0.06, step: 0.001, onChange: ( v ) => { P.grain.value = v; } } );

		// ---------------------------------------------------------------- Performance
		const perf = ui.addTab( 'performance', loc( 'Performance', 'Rendimiento' ), 'performance' );
		const live = perf.addFolder( loc( 'Live', 'En vivo' ), { icon: 'gauge' } );
		live.addInfo( { label: loc( 'Frame rate', 'Cuadros por segundo' ), get: () => `${ ( app.fps || 0 ).toFixed( 0 ) } fps` } );
		live.addInfo( { label: loc( 'CPU per frame', 'CPU por cuadro' ), get: () => `${ ( app.cpuMs || 0 ).toFixed( 2 ) } ms` } );
		live.addInfo( { label: loc( 'Render size', 'Resolución de render' ), get: () => `${ app.sceneRenderer.width } × ${ app.sceneRenderer.height }` } );
		const quality = perf.addFolder( loc( 'Quality', 'Calidad' ), { icon: 'layers' } );
		quality.addSlider( { label: loc( 'Render scale', 'Escala de render' ), object: s, key: 'renderScale', min: 0.5, max: 1, step: 0.05, format: ( v ) => `${ Math.round( v * 100 ) }%`, tooltip: loc( 'Internal resolution; the temporal upscaler reconstructs the full output resolution.', 'Resolución interna; el escalado temporal reconstruye la resolución completa de salida.' ), onChange: ( v ) => app.setRenderScale( v ) } );
		// anti-aliasing: the TAA with 2..16 jitter positions averaged per pixel, or none
		s.aa = app.post.aaMode === 'none' ? 0 : app.post.taau.jitterPhaseOverride;
		quality.addSelect( { label: loc( 'Anti-aliasing', 'Antialiasing' ), object: s, key: 'aa', tooltip: loc( 'Temporal anti-aliasing: each pixel averages this many sub-pixel sample positions over successive frames (it also smooths dithered fades and shadow noise). More samples cost nothing per frame but take a few more frames to settle.', 'Antialiasing temporal: cada píxel promedia este número de posiciones de muestreo subpíxel a lo largo de varios cuadros (también suaviza los fundidos tramados y el ruido de las sombras). Más muestras no cuestan nada por cuadro, pero tardan unos cuadros más en estabilizarse.' ), options: [ { label: loc( 'Off', 'Apagado' ), value: 0 }, { label: '2x', value: 2 }, { label: '4x', value: 4 }, { label: '8x', value: 8 }, { label: '16x', value: 16 } ], onChange: ( v ) => {

			const n = Number( v );
			app.post.aaMode = n > 0 ? 'taa' : 'none';
			if ( n > 0 ) app.post.taau.jitterPhaseOverride = n;

		} } );
		quality.addToggle( { label: loc( 'Shadows', 'Sombras' ), object: s, key: 'shadows', onChange: ( v ) => { app.shadows.enabled = v; } } );
		s.ssr = true;
		quality.addToggle( { label: loc( 'Water reflections', 'Reflejos en el agua' ), object: s, key: 'ssr', tooltip: loc( 'Screen-space reflections of the pier, boats and hills on the water.', 'Reflejos en espacio de pantalla del muelle, los botes y las colinas sobre el agua.' ), onChange: ( v ) => { app.waterMaterial.params.ssr.value = v ? 1 : 0; } } );

		// ---------------------------------------------------------------- Game: language
		const gameTab = ui.addTab( 'game', loc( 'Game', 'Juego' ), 'settings' );
		const language = gameTab.addFolder( loc( 'Language', 'Idioma' ), { icon: 'compass' } );
		s.lang = LANG;
		language.addSelect( { label: 'Idioma / Language', object: s, key: 'lang', tooltip: loc( 'Changing the language reloads the page. Your progress is kept.', 'Cambiar el idioma recarga la página. Tu progreso se conserva.' ), options: [ { label: 'Español', value: 'es' }, { label: 'English', value: 'en' } ], onChange: ( v ) => setLang( v ) } );

		this._t = 0;

	}

	// per-frame HUD
	update( dt ) {

		const app = this.app;
		const ui = this.ui;
		ui.setStats( { fps: app.fps, frameMs: dt * 1000 } );
		this.s.renderScale = app.post.scale;

		const p = app.player;
		if ( app.freeCam ) {

			ui.setMode( loc( 'Free camera', 'Cámara libre' ) );
			ui.setPrompt( 'F', loc( 'Walk', 'Caminar' ) );
			ui.setBoatGauges( { visible: false } );
			ui.setDepth( { visible: false } );
			return;

		}

		const mode = p.mode === 'boat' ? loc( `Boat · ${ p.camMode === 'first' ? '1st' : '3rd' } person`, `Bote · ${ p.camMode === 'first' ? '1.ª' : '3.ª' } persona` )
			: p.mode === 'deck' ? loc( 'On deck', 'En cubierta' )
			: p.mode === 'swim' ? ( app.camera.position.y < ( app.cameraWaterHeight ?? 0 ) - 0.3 ? loc( 'Diving', 'Buceando' ) : loc( 'Swimming', 'Nadando' ) ) : loc( 'Walking', 'Caminando' );
		ui.setMode( mode );
		if ( p.prompt ) ui.setPrompt( p.prompt.key, p.prompt.text );
		else ui.setPrompt( null );

		const b = app.boatCtl;
		if ( p.mode === 'boat' ) {

			const f = b.forward( new THREE.Vector3() );
			ui.setBoatGauges( {
				visible: true,
				throttle: b.throttle,
				rpm: b.rpm,
				speedKnots: b.speed * 1.94384,
				heading: ( THREE.MathUtils.radToDeg( Math.atan2( f.x, - f.z ) ) + 360 ) % 360,
			} );

		} else ui.setBoatGauges( { visible: false } );

		const depth = ( app.cameraWaterHeight ?? 0 ) - app.camera.position.y;
		ui.setDepth( { visible: p.mode === 'swim' && depth > 0.3, meters: depth } );

	}

}
