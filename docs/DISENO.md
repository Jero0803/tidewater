# Tidewater · Documento de diseño

Documento vivo: recoge qué queremos hacer con el juego, qué se decidió y por qué, antes de escribir código.
Se actualiza en cada conversación de trabajo. La bitácora al final registra los cambios.

**Estado:** definiendo la Fase 1. Todavía no se ha escrito código de jugabilidad nuevo.

---

## 1. El proyecto

- **Qué es:** juego de pesca en una isla tropical para el navegador (WebGPU), con motor propio. Basado en
  [dgreenheck/tidewater](https://github.com/dgreenheck/tidewater) (MIT).
- **Nuestro repo:** [Jero0803/tidewater](https://github.com/Jero0803/tidewater), rama `main`.
- **Publicado en:** https://jero0803.github.io/tidewater/ (se despliega solo al subir a `main`).
- **Remotos de git:** `origin` = nuestro repo; `upstream` = el original. Para traer novedades del autor:
  `git fetch upstream` y `git merge upstream/main`.
- **En local:** `npm install`, `npm run dev` (http://127.0.0.1:5189), `npm test`, `npm run balance`.

### Lo que ya hicimos

| Fecha | Cambio | Commit |
|---|---|---|
| 2026-11-17 | Traducción completa al español | `628f0f6` |
| 2026-11-17 | Selector de idioma español / inglés (`loc( inglés, español )` en `src/i18n.js`) | `c38b637` |
| 2026-11-17 | Simulador de equilibrio `npm run balance` (`tools/balance/`) | `1c3e0a1` |

---

## 2. Visión

Pasar de un juego relajado de ~30 minutos a uno con **progresión de varias horas**, inspirado en el **modelo de
Fishing Planet** (niveles, clases de tamaño, licencias, equipo que importa, objetivos), sin perder lo que el
juego hace bien: es bonito, se entiende rápido y no castiga de más.

Más adelante, **varios escenarios o mapas** que se desbloquean con la progresión.

### Principios

1. **No romper lo que hay.** Cada cambio se mide antes (`npm run balance`) y las partidas guardadas siguen funcionando.
2. **Medir, no adivinar.** Cada fase tiene metas numéricas que el simulador comprueba.
3. **Adaptar ideas, no copiar.** Tomamos mecánicas del género; no nombres, marcas, mapas ni arte de otros juegos.
4. **Sin monetización.** Nada de moneda premium ni licencias por tiempo real.
5. **Profundidad sin complicación.** Nada de aparejos de simulador (feeders, boilies, tamaños de anzuelo).
6. **Todo texto nuevo en los dos idiomas.**

---

## 3. Decisiones tomadas

| # | Decisión | Por qué | Fecha |
|---|---|---|---|
| D1 | El juego es bilingüe; el idioma sale de `?lang=`, de la elección guardada o del navegador. Cambiar de idioma recarga la página. | La interfaz se construye una vez al cargar; recargar es simple y conserva el progreso | 2026-11-17 |
| D2 | Antes de cambiar el equilibrio, existe una herramienta que lo mide con el código real | Evitar desequilibrar lo que el autor dejó | 2026-11-17 |
| D3 | El modelo de referencia es Fishing Planet | Le gusta al dueño del proyecto; da progresión larga | 2026-11-17 |
| D4 | Orden: **Fase 1 (progresión) antes que los mapas**, pero diseñada "por mapa" desde el inicio (especies, zonas y licencias definidas por mapa) | Cuesta lo mismo y evita rehacer trabajo | 2026-11-17 |
| D5 | No se adapta: moneda premium, licencias por tiempo real, aparejos complejos, 110 niveles (con 20–30 basta) | No aportan diversión a este juego o sobran para su contenido | 2026-11-17 |
| D6 | Cambiar de mapa recargará la página, como el idioma | Un mapa a la vez; simple y seguro | 2026-11-17 |
| D7 | Se definen las bases y los números **antes** de escribir código | Pedido del dueño del proyecto | 2026-11-17 |

---

## 4. Auditoría del juego original (2026-11-17)

Medida con `npm run balance` (semilla 1, n = 3000). Los valores absolutos son optimistas (no cuentan caminar,
navegar, vender ni fallos al clavar); las comparaciones sí son fiables.

### Lo que está bien (no tocar)

- Datos de peces realistas (relación largo-peso de FishBase, especies por zona y hora).
- Lógica del juego separada del motor en 5 archivos pequeños: `FishTable`, `Bites`, `CatchMinigame`, `Gear`, `GameState`.
- Guardado robusto (`tidewater.save.v1`): ignora especies desconocidas y completa mejoras nuevas con valores por defecto.
- Tests de lógica (`test/game-logic.mjs`) que pasan.

### Problemas de equilibrio

1. **Aguas profundas dominan desde el minuto 1.** Con equipo inicial: orilla $11/min, muelle $20, arrecife $35,
   bahía $38, **profundo $137**. El bote viene con tanque lleno y el diésel de ida y vuelta cuesta ~$12.
2. **El límite real es la nevera.** En profundo, la nevera inicial (30 kg) se llena en ~2 minutos.
3. **Las mejoras de sedal casi no importan.** Un jugador humano con el sedal inicial saca el 100 % de 13 de 18
   especies; con el de $60 casi todo. Los sedales de $180 y $450 solo sirven para el sábalo, el pez peor pagado
   ($4/kg), que además a menudo no cabe en la nevera inicial (pesa 10–45 kg).
4. **Carrete y caña aportan poco.** La caña larga sí amplía el alcance desde el muelle (de 5.4 m a 9.1 m de profundidad).
5. **Fallar no cuesta nada.** Romper sedal o perder el pez no tiene consecuencia.
6. **El juego es corto.** Todas las mejoras suman $3,875: unos 20 minutos de pesca en profundo.
7. **El combustible no limita.** El tanque inicial dura 25 min a toda máquina; las aguas profundas están a 70–770 m del amarre.

### Notas técnicas

- El autor original no ha publicado cambios desde el 2026-09-24 (48 commits en dos días): riesgo de conflictos bajo.
- `test/engine-smoke.mjs` falla en Windows porque escribe en `/tmp` (no afecta al juego).
- Comentario desactualizado en `src/game/Gear.js` (dice que la tienda no existe).
- **Cuidado con el guardado:** se guarda el número de nivel de cada mejora. Agregar niveles al final está bien;
  reordenar o quitar niveles cambia las partidas guardadas.

---

## 5. Referencia: Fishing Planet

Fuente: wiki oficial (bastante general), reseñas y foros de jugadores. Las cifras pueden estar desactualizadas;
lo que importa son las ideas.

| Sistema | Cómo funciona allí | ¿Lo adaptamos? |
|---|---|---|
| Niveles y experiencia | Cada pez da XP (más si es grande o raro), se suelte o se guarde. Curva exponencial (nivel 10 = 2,005 XP; nivel 20 = 17,430) | **Sí**, Fase 1, con 20–30 niveles |
| Desbloqueos por nivel | Equipo y lugares se abren por nivel | **Sí**, Fase 1 (tienda) y mapas |
| Clases de tamaño | Juvenil / común / trofeo / único por especie, cada una con precio propio | **Sí**, Fase 1 |
| Licencias | Por lugar; la básica prohíbe noche y bote | **Sí**, Fase 1, por zona y sin tiempo real |
| Equipo equilibrado | Caña, carrete, sedal y líder con límites; manda el más débil | **Sí**, Fase 3 (simplificado) |
| Freno (drag) | Ajustable por posiciones; deja salir sedal antes de romper | **Sí**, Fase 3 |
| Desgaste | El equipo se desgasta y se repara | **Sí**, Fase 2 |
| Carnadas y señuelos | Categorías; cada especie prefiere algunas | **Sí**, Fase 2 (pocas categorías) |
| Misiones y torneos | Misiones con premios; torneos por los 10 más pesados | **Sí**, Fase 4 |
| Moneda premium, licencias por tiempo, cuentas premium | Monetización | **No** |
| Aparejos complejos (feeders, boilies, anzuelos por número) | Simulación de pesca deportiva | **No** |

---

## 6. Hoja de ruta

| Fase | Contenido | Problemas que resuelve | Esfuerzo | Riesgo | Estado |
|---|---|---|---|---|---|
| **1. Progresión** | Clases de tamaño, nivel y XP, desbloqueos por nivel, licencias por zona | 1, 6 (y parte de 3) | Medio | Bajo (no toca la pelea) | **Definiendo** |
| 2. Consecuencias | Carnadas que se gastan y preferencias por especie; desgaste y reparación | 5, 7 | Medio | Medio | Pendiente |
| 3. Pelea profunda | Freno ajustable (rueda del mouse); equipo equilibrado | 3, 4 | Alto | Medio | Pendiente |
| 4. Objetivos | Encargos de Joe; torneo de los 10 más pesados | Variedad y metas | Medio | Bajo | Pendiente |
| M1. Preparar mapas | Convertir la isla en el primer mapa de un registro (forma, distribución, especies, vendedores por mapa). Debe verse idéntico | Habilita escenarios | Medio | Medio | Pendiente |
| M2. Primer mapa nuevo | Atolón o mar abierto, reutilizando océano, vegetación y peces | Contenido | Alto | Bajo | Pendiente |

### Mapas: lo que sabemos (2026-11-17)

- **A favor:** el relieve es procedural (código, no imágenes pesadas); las posiciones clave están en
  `src/world/WorldLayout.js`; océano, cielo, vegetación, fauna, audio y modelos son reutilizables.
- **En contra:** `WORLD` es una constante global que leen 21 archivos; `TerrainData.js` (992 líneas) está
  afinado para esta isla; Joe, Marta y el pueblo tienen posiciones fijas en su código; las olas y el agua sobre
  la arena dependen de la forma de la playa.
- **Escenarios por dificultad:** mar abierto (media-baja), otra isla tropical o atolón (media), manglar o
  laguna (media-alta), lago o río de agua dulce (alta: sin olas, especies y plantas nuevas).

---

## 7. Fase 1 · Preguntas por decidir antes de programar

Estas son las bases que hay que fijar. Cuando se decidan, pasan a la sección 3 con su número.

**Metas medibles**
- [ ] ¿Cuánto debe durar llegar al máximo? (propuesta inicial: 3–5 horas de juego)
- [ ] ¿Cuánto más debe pagar el profundo frente al muelle, contando licencia y diésel? (propuesta: como mucho 3×)

**Clases de tamaño**
- [ ] Umbrales de cada clase por especie (propuesta: por percentil del rango de peso actual)
- [ ] Precio por clase (propuesta: juvenil no se vende, común ×1, trofeo ×1.5, único ×3)
- [ ] Juveniles: ¿soltar obligatorio, multa o solo valen poco?

**Niveles y experiencia**
- [ ] Número de niveles (20–30) y forma de la curva
- [ ] XP por pez (por clase, especie, especie nueva)
- [ ] Qué desbloquea cada nivel (mejoras de Marta, licencias, más adelante mapas)

**Licencias**
- [ ] Zonas con licencia (propuesta: muelle y orilla gratis; arrecife y profundo con permiso)
- [ ] Duración (propuesta: un día del juego) y precio
- [ ] Qué pasa si se pesca sin licencia (multa, no se puede vender, o no pica)

**Compatibilidad**
- [ ] Partidas guardadas existentes: ¿con qué nivel empiezan? (propuesta: calcularlo desde el registro de pesca)

---

## 8. Reglas para trabajar sin romper nada

1. Antes de cambiar números del juego: `npm run balance > antes.md`; después, otra vez y comparar.
2. `npm test` (la parte de lógica) debe seguir pasando.
3. Todo texto visible nuevo con `loc( 'inglés', 'español' )`.
4. Guardado: solo **agregar** campos y niveles al final; nunca reordenar ni quitar. Si cambia el formato, subir la versión y migrar.
5. Los archivos del repo usan saltos de línea CRLF en Windows (git los normaliza).
6. Probar en el navegador antes de subir; subir a `main` publica en GitHub Pages.

---

## 9. Bitácora

- **2026-11-17** · Clonado el original, traducido al español, selector de idioma, publicado en GitHub Pages.
  Auditoría con simulador; guardado el simulador. Investigado Fishing Planet; propuesta de 4 fases más mapas.
  Decidido: definir bases antes de programar, Fase 1 antes que mapas pero diseñada por mapa. Creado este documento.
