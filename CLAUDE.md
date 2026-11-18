# Tidewater (fork de Jero0803)

Juego de pesca en una isla tropical, WebGPU con motor propio. Fork de dgreenheck/tidewater (MIT).

**Leer primero [docs/DISENO.md](docs/DISENO.md):** visión, decisiones, auditoría, hoja de ruta y preguntas
abiertas. Mantenerlo al día: cada decisión nueva va a su sección 3 y a la bitácora.

## Comunicación

- Hablar siempre en español con el dueño del proyecto.
- Definir y medir antes de programar; no escribir código de jugabilidad nuevo sin que la fase esté decidida en el documento.

## Comandos

- `npm run dev`: servidor local en http://127.0.0.1:5189
- `npm test`: `test/game-logic.mjs` debe pasar (`engine-smoke` falla en Windows por escribir en `/tmp`, conocido)
- `npm run balance`: simulador de equilibrio (`tools/balance/`); compararlo antes y después de tocar números

## Reglas del código

- Textos visibles: `loc( 'inglés', 'español' )` de `src/i18n.js`. El inglés queda idéntico al original.
- Lógica del juego en `src/game/` (`FishTable`, `Bites`, `CatchMinigame`, `Gear`, `GameState`, `Progression`, `Spots`); se puede importar en Node.
- Guardado (`tidewater.save.v3`; v1 y v2 se leen y convierten, sus claves no se tocan): solo agregar campos y niveles al final; no reordenar ni quitar. Si cambia el formato, subir la versión y convertir.
- Saltos de línea CRLF en los archivos del repo.
- Git: `origin` = Jero0803/tidewater (subir a `main` publica en GitHub Pages); `upstream` = original.
