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
| D8 | **Progresión escalable, sin final.** No se fija cuánto dura el juego: se fija **cuánta experiencia (XP) hace falta para abrir el siguiente mapa**. Cada mapa agrega niveles y contenido sin rehacer lo anterior | El juego crece con cada mapa nuevo | 2026-11-17 |
| D9 | **Peces por spot.** Cada mapa tiene spots con nombre (muelle, arrecife, veril…) y cada spot tiene su propia lista de especies y probabilidades | Más claro para el jugador y más fácil de diseñar y equilibrar por mapa | 2026-11-17 |
| D10 | **Licencias por pez, no por spot.** Se puede pescar en cualquier spot; la licencia da derecho a quedarse con ciertas especies | Equilibra sin cerrar lugares: los peces caros (profundo) piden licencia | 2026-11-17 |
| D11 | **Tres licencias: básica, intermedia y avanzada.** Cada especie pertenece a una (reparto en la sección 7) | Claro para el jugador y escala a mapas nuevos | 2026-11-17 |
| D12 | **Las licencias duran días del juego** | Gasto recurrente que mantiene viva la economía | 2026-11-17 |
| D13 | **Sin licencia: hay que soltar el pez, pero da XP y cuenta en el registro** | Sin castigo, pero motiva comprar la licencia | 2026-11-17 |
| D14 | **Reparto de especies aprobado** (tabla en la sección 7): básica = 7 especies de orilla y muelle, intermedia = 6 de arrecife y bahía, avanzada = 5 de profundo más el sábalo | Ordena por spot, valor y dificultad | 2026-11-17 |
| D15 | **Las licencias duran tiempo real**, no horas del juego | Independiente del reloj del juego y de la velocidad del tiempo | 2026-11-17 |
| D16 | **El día del juego es simulado:** el reloj avanza solo mientras se juega (alba, día, ocaso, noche) | El ciclo del día importa para qué pica | 2026-11-17 |
| D17 | **Se podrá viajar entre mapas** y se diseña desde la Fase 1 (qué se guarda por mapa y qué viaja con el jugador) | Evita rehacer el guardado cuando lleguen los mapas | 2026-11-17 |

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
| **1. Progresión** | Clases de tamaño; nivel y XP con umbral para el siguiente mapa; desbloqueos por nivel; **spots con su lista de peces**; **licencias por pez** | 1, 6 (y parte de 3) | Medio | Bajo-medio (no toca la pelea; los spots cambian cómo se elige el pez que pica) | **Definiendo** |
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
- [x] ~~¿Cuánto debe durar llegar al máximo?~~ Reemplazada por D8: se mide la XP para abrir el siguiente mapa.
- [x] ~~¿Cuánto más debe pagar el profundo frente al muelle?~~ Reemplazada por D9 y D10: el equilibrio se
  ajusta con la lista de peces de cada spot y el precio de las licencias. La relación entre spots se sigue
  midiendo con el simulador como referencia.
- [ ] XP necesaria para abrir el mapa 2, y cómo crece para los siguientes

**Spots (D9)**
- [ ] Lista de spots de la isla actual y qué especies tiene cada uno
- [ ] ¿Qué pasa entre spots? (propuesta: el spot más cercano, o una lista genérica de "aguas abiertas")

**Licencias por pez (D10–D13)**
- [x] ~~¿Por especie o por grupo?~~ Tres licencias (D11).
- [x] ~~¿Duración?~~ Días del juego (D12).
- [x] ~~¿Sin licencia?~~ Soltar, con XP (D13).
- [x] ~~Reparto de especies~~ Aprobado (D14, tabla abajo).
- [ ] ¿Las licencias son acumulativas? (propuesta: sí, la intermedia incluye la básica y la avanzada incluye las dos)
- [ ] ¿Qué especies son libres? (propuesta: ninguna; la básica es barata y se regala al empezar)
- [ ] ¿La licencia también pide nivel mínimo? (propuesta: intermedia y avanzada sí)
- [ ] Tiempo real (D15): ¿reloj de pared (vence aunque no juegues) o tiempo jugado (solo corre con el juego abierto)?
  (propuesta: tiempo jugado; con reloj de pared, quien juega un rato cada semana pierde casi todas sus licencias)
- [ ] Precio y duración de cada una (se calcula con el simulador)

Reparto aprobado (D14):

| Licencia | Especies | Dónde | $/kg |
|---|---|---|---|
| Básica | Pejerrey cabezón, Lisa rayada, Agujón, Sargento mayor, Ronco amarillo, Cromis azul, Cirujano azul | Orilla, muelle, arrecife (pequeños) | $3–8 |
| Intermedia | Rabirrubia, Pez perro, Loro brilloso, Ángel reina, Jurel común, Barracuda | Arrecife y bahía | $5–16 |
| Avanzada | Pargo colorado, Mero de Nassau, Atún aleta negra, Dorado, Sábalo | Aguas profundas, bahía de noche (sábalo) | $4–18 |

**Reloj del juego (necesario para D12)**

Hallazgo: el reloj viene detenido (empieza a las 16:12; la tecla T lo pone a 0.05 h/s, un día = 8 min reales)
y el panel de ajustes deja mover la hora a mano. Con eso una licencia por días se puede estirar (pausando) o
gastar (adelantando), y las preferencias de hora de los peces se pueden forzar.
- [x] ~~¿Cómo se cuenta el tiempo?~~ Licencias en tiempo real (D15); día del juego simulado (D16).
- [ ] Duración de un día del juego en minutos reales (hoy 8 min cuando corre; propuesta: 20–30 min)
- [ ] ¿Qué pasa con el control de hora del panel de ajustes? (propuesta: en el juego queda bloqueado y solo se
  puede mover en el modo foto, para no forzar la hora de los peces)
- [ ] ¿El reloj se pausa con el menú, la tienda o la tarjeta de captura? (propuesta: no se pausa, salvo con la pausa explícita T)

**Viaje entre mapas (D17)**

Propuesta inicial, para discutir:

| Tema | Propuesta |
|---|---|
| Cómo se viaja | Desde el amarre del bote, con E se abre un mapa de viaje con los destinos desbloqueados |
| Qué lo desbloquea | La XP (D8): cada mapa pide un nivel mínimo |
| Costo | Un pasaje o diésel según la distancia (gasto que ordena la progresión) |
| Qué viaja contigo | Dinero, nivel y XP, equipo y mejoras (caña, carrete, sedal, bote) |
| Qué es de cada mapa | Licencias (cada mapa tiene sus especies y sus tres licencias), registro de pesca y récords por mapa, vendedores |
| Peces en la nevera | Hay que venderlos o soltarlos antes de viajar (o se pierden al viajar) |
| Técnico | Cambiar de mapa recarga la página (D6); el guardado se organiza en datos globales + datos por mapa |

- [ ] ¿Se viaja desde el bote, desde un muelle o desde un menú?
- [ ] ¿El viaje cuesta? ¿Cuánto?
- [ ] ¿Las licencias son por mapa o globales?
- [ ] ¿Qué pasa con los peces en la nevera al viajar?
- [ ] ¿El equipo y las mejoras del bote son globales?

**Clases de tamaño**
- [ ] Umbrales de cada clase por especie (propuesta: por percentil del rango de peso actual)
- [ ] Precio por clase (propuesta: juvenil no se vende, común ×1, trofeo ×1.5, único ×3)
- [ ] Juveniles: ¿soltar obligatorio, multa o solo valen poco?

**Niveles y experiencia**
- [ ] Número de niveles (20–30) y forma de la curva
- [ ] XP por pez (por clase, especie, especie nueva)
- [ ] Qué desbloquea cada nivel (mejoras de Marta, licencias, más adelante mapas)

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
- **2026-11-17** · Decididos D8 (progresión escalable medida en XP por mapa), D9 (peces por spot) y D10
  (licencias por pez). Reemplazadas las metas de duración y de relación profundo/muelle.
- **2026-11-17** · Decididos D11 (tres licencias), D12 (duran días del juego) y D13 (sin licencia: soltar con XP).
  Propuesto reparto de especies. Hallazgo: el reloj del juego viene detenido y la hora se puede mover desde el
  panel, lo que hay que resolver para que las licencias por días funcionen.
- **2026-11-17** · Decididos D14 (reparto aprobado), D15 (licencias en tiempo real), D16 (día del juego simulado)
  y D17 (viajar entre mapas, diseñado desde la Fase 1). Agregada la propuesta de viaje entre mapas.
