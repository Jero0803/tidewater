import { defineConfig } from 'vite';

export default defineConfig( {
	// relative asset paths: the build runs from any sub-path (GitHub Pages serves it under /tidewater/)
	base: './',
	build: {
		target: 'esnext', chunkSizeWarningLimit: 4000,
		// two pages (docs/DISENO.md D55): the landing page (index.html, no 3D) and the game (juego.html)
		rollupOptions: { input: { main: 'index.html', juego: 'juego.html' } },
	},
	server: { port: 5188, strictPort: true, host: '127.0.0.1' },
} );
