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

Más adelante, **varios escenarios o mapas** que se desbloquean con la progresión, en una cadena caribeña de la
montaña al mar: represa, río, manglar y la isla (D23). Mapas y niveles no tienen fin: **la isla es el punto de
referencia** (D24). Hoy es el mapa más alto; desde ella se diseña hacia abajo (mapas de inicio) y, en el futuro,
hacia arriba (mapas de nivel más alto).

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
| D15 | ~~Las licencias duran tiempo real~~ Precisada por D19 y D21 | | 2026-11-17 |
| D16 | **El día del juego es simulado:** el reloj avanza solo mientras se juega (alba, día, ocaso, noche) | El ciclo del día importa para qué pica | 2026-11-17 |
| D17 | **Se podrá viajar entre mapas** y se diseña desde la Fase 1 (qué se guarda por mapa y qué viaja con el jugador) | Evita rehacer el guardado cuando lleguen los mapas | 2026-11-17 |
| D18 | **Licencias acumulativas** (la intermedia incluye la básica; la avanzada, las dos). **La básica se regala al empezar.** **Intermedia y avanzada piden nivel mínimo** | Progresión ordenada y sin barrera al inicio | 2026-11-17 |
| D19 | **El tiempo de las licencias es tiempo jugado:** solo corre con el juego abierto | Quien juega poco no pierde sus licencias por no entrar | 2026-11-17 |
| D20 | **Viaje entre mapas aprobado** como se propuso: desde el amarre del bote (E), destinos por nivel, con costo; viajan dinero, nivel, XP y equipo; licencias, registro, récords y vendedores son de cada mapa; los peces de la nevera se venden o sueltan antes de viajar | Separa datos globales y por mapa desde el principio | 2026-11-17 |
| D21 | **Una licencia dura 1 día del juego jugado** (lo que dure un día simulado mientras se juega) | Se renueva seguido: gasto recurrente sin sentirse corto | 2026-11-17 |
| D22 | **Un día del juego dura 24 minutos reales** (1 hora del juego = 1 minuto real). Por tanto una licencia dura 24 minutos de juego | Fácil de entender; se vive el ciclo completo del día | 2026-11-17 |
| D23 | **Cadena de mapas de la montaña al mar, en ambiente caribeño:** represa o lago (inicio) → río o quebrada → manglar o estuario → la isla actual | Como en el género: se empieza en aguas tranquilas y el mar es la meta. El ambiente caribeño reutiliza vegetación y sonidos | 2026-11-17 |
| D24 | **La isla es el punto de referencia** de todo el diseño. Por ahora es el mapa más alto: los números (peces, precios, XP, licencias) se calibran en ella y se escalan **hacia abajo** para los mapas de inicio y, cuando se agreguen, **hacia arriba** para mapas de nivel más alto | Mapas y niveles son infinitos; hace falta un ancla fija desde la que medir | 2026-11-17 |
| D25 | **Hasta que exista la represa, la isla sigue siendo donde se empieza**, con su progresión interna de licencias. Cuando la represa esté lista pasa a ser el inicio, la isla se desbloquea por nivel y las partidas que ya estén en la isla se quedan ahí sin perder nada | El juego siempre es jugable mientras se construye la cadena | 2026-11-17 |
| D26 | **Orden de construcción ≠ orden del juego:** se construye primero la represa (la que más reutiliza: agua quieta), luego el manglar, y el río al final o como opcional (el agua que corre es tecnología nueva) | Empezar por lo de menor riesgo | 2026-11-17 |

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

Orden de trabajo (reordenado el 2026-11-17 según D23–D26). La isla es el ancla: primero se define en ella la
progresión y después se construyen hacia abajo los mapas de inicio.

| Orden | Etapa | Contenido | Esfuerzo | Riesgo | Estado |
|---|---|---|---|---|---|
| 1 | **Fase 1. Progresión (en la isla)** | Clases de tamaño; nivel y XP; licencias por pez; spots con su lista de peces; desbloqueos por nivel; tienda rediseñada. Calibrada en la isla como mapa de referencia, con la escala pensada para mapas por debajo y por encima | Medio | Bajo-medio (no toca la pelea) | **Definiendo** |
| 2 | **M1. Preparar mapas** | Convertir la isla en el primer mapa de un registro (forma, distribución, especies, vendedores y licencias por mapa); guardado global + por mapa; viaje entre mapas (D20). Debe verse idéntico | Medio | Medio | Pendiente |
| 3 | **M2. Represa o lago** | Primer mapa de inicio: agua quieta (el océano sin viento ni oleaje, rodeado de tierra; por verificar), peces de agua dulce. Al terminar pasa a ser el inicio del juego (D25) | Alto | Medio | Pendiente |
| 4 | **M3. Manglar o estuario** | Agua quieta y salobre; mangles nuevos; peces de estuario | Alto | Medio | Pendiente |
| 5 | **M4. Río o quebrada** | Agua con corriente (tecnología nueva); puede quedar como opcional | Muy alto | Alto | Pendiente |
| — | Fase 2. Consecuencias | Carnadas que se gastan y preferencias por especie; desgaste y reparación | Medio | Medio | Pendiente, se puede intercalar |
| — | Fase 3. Pelea profunda | Freno ajustable (rueda del mouse); equipo equilibrado | Alto | Medio | Pendiente, se puede intercalar |
| — | Fase 4. Objetivos | Encargos de los vendedores; torneo de los 10 más pesados | Medio | Bajo | Pendiente, se puede intercalar |
| — | Mapas por encima de la isla | Mar abierto, otras islas o atolones de nivel más alto (D24) | Alto | Bajo | Futuro |

### Cadena de mapas (D23, D24)

| Orden en el juego | Mapa | Agua | Peces de ejemplo (por definir) | Banda de niveles (propuesta, por medir) |
|---|---|---|---|---|
| 1 | Represa o lago | Quieta, dulce | Tilapia, guapote, lobina negra, bagre, carpa | 1–10 |
| 2 | Río o quebrada | Con corriente, dulce | Dajao, guabina, lisa de río | 10–20 |
| 3 | Manglar o estuario | Quieta, salobre | Róbalo, pargo de manglar, mojarra, sábalo joven | 20–30 |
| 4 | **La isla (referencia)** | Mar | Las 18 especies actuales | 30–40 |
| 5+ | Mapas futuros de nivel más alto | Mar abierto y otros | Por definir | 40+ |

Cada mapa tiene sus propias licencias básica, intermedia y avanzada (D11, D20), con niveles mínimos dentro de su banda.

### Investigación: biomas acuáticos del Caribe, de la montaña al mar (2026-11-17)

Fuentes: estudios científicos (USGS, GCFI, revistas de pesca y ecología), DRNA de Puerto Rico, prensa dominicana.
Los nombres comunes varían por país; las listas son un punto de partida, no definitivas.

| Bioma (por altitud) | Características | Especies reales | Notas |
|---|---|---|---|
| **Quebrada o río de montaña** | Agua clara y corriente, pozas, rocas | Dajao o lisa de montaña (*Agonostomus monticola*), guabina (*Gobiomorus dormitor*), sirajo o tetí (*Sicydium*), gobio de río (*Awaous banana*) | Casi todos los peces nativos de los ríos de las islas son **anfídromos**: nacen en el río, sus larvas bajan al mar y vuelven de jóvenes. Peces pequeños y escurridizos |
| **Represa o embalse** | Agua quieta y profunda, hecha por el ser humano en el curso medio | Lobina negra, tucunaré (pavón), bagre de canal, tilapia, biajaca (cíclido nativo de Cuba y La Española) | La mayoría son **introducidas**: en Puerto Rico se siembran lobina y tucunaré. En República Dominicana se pesca lobina y tilapia en las presas. Hay cíclidos invasores |
| **Río bajo y estuario** | Mezcla de agua dulce y salada, turbia, raíces y jacintos | Róbalo (*Centropomus*), sábalo juvenil, guabina, lisas | Los róbalos jóvenes prefieren aguas turbias y calmas junto a raíces y plantas |
| **Manglar** | Agua salobre y quieta entre raíces | Pargo de manglar (pargo prieto), mojarra, sábalo y róbalo jóvenes, barracuda juvenil, juveniles de peces de arrecife | Es la **guardería** del arrecife: en el Caribe la mayoría de especies tiene más juveniles en el manglar que en las praderas o el arrecife |
| **Laguna costera y bajos con praderas** | Agua salada, poco profunda y clara; arena y hierba marina | Macabí (*bonefish*), palometa (*permit*), sábalo, róbalo | Los famosos "flats" del Caribe: pesca a la vista en aguas someras. Los peces se mueven entre praderas, manglar y arrecife |
| **Costa y arrecife** | Muelle, playa, coral | Las especies actuales de la isla (rabirrubia, ronco, loro, ángel, mero…) | **La isla actual** |
| **Mar abierto** | Aguas profundas, pelágicos | Atún, dorado, pargo colorado (ya en la isla); a futuro marlín, peto (wahoo), pez vela | República Dominicana es conocida por la pesca de altura. Candidato para mapas por encima de la isla |

**Hallazgos útiles para el diseño:**
- El orden por altitud (quebrada → represa → estuario → manglar → laguna → arrecife → mar abierto) no es el mejor
  orden de juego: la represa, con agua quieta y peces fáciles, es mejor inicio que la quebrada.
- El ciclo de vida conecta los mapas: el sábalo y el róbalo nacen en el mar, crecen en el manglar o el estuario y
  vuelven al mar. Un mismo pez puede aparecer juvenil en un mapa bajo y adulto en uno alto.
- Las especies introducidas e invasoras son reales en las represas del Caribe (cíclidos invasores, pez gato
  africano en Cuba). Idea de juego: especies invasoras sin licencia y con recompensa por sacarlas.
- La laguna costera es agua salada, quieta y poco profunda: probablemente **el mapa más fácil de construir**
  después de la isla, porque reutiliza el océano casi tal cual.

### Investigación ampliada: trucha, lagos de Colombia, Florida y mojarras (2026-11-17)

Pedido del dueño del proyecto: no limitarse a las islas; incluir trucha, agua dulce, mojarras, Florida y los lagos de Colombia.

| Región y bioma | Características | Especies | Notas |
|---|---|---|---|
| **Lagos y embalses andinos** (Colombia: Laguna de Tota, Neusa, Tominé, Sisga, Guavio) | Agua fría de montaña, altiplano | Trucha arcoíris, carpa común, capitán de la sabana (nativo) | La trucha se introdujo hacia 1938–1939 y es parte de la identidad de Tota (hay una fiesta y un concurso nacional de pesca). Es considerada invasora: compite con el capitán por la comida. En Tominé la captura la dominan trucha, carpa y capitán |
| **Lagos y canales de Florida** | Lagos cálidos, canales, Everglades | Lobina negra (la más popular de Florida, está en casi toda el agua dulce), mojarra de agallas azules (bluegill) y otras mojarras de río, crappie negro, tucunaré mariposa (en los canales del sureste), catán o pejelagarto | El tucunaré se introdujo en los años 80 para controlar una tilapia invasora; supera los 11 kg |
| **Ciénagas y embalses cálidos de Colombia** (Ayapel, Lorica, Zapatosa, Urrá) | Humedales y represas de tierra caliente | Mojarra amarilla (*Caquetaia kraussii*, cíclido nativo), mojarra roja y tilapia (cultivo), bocachico, cachama | La mojarra amarilla es nativa de Colombia y Venezuela y muy consumida |
| **Ríos de los Llanos** (Orinoquía: Meta, Vichada, Puerto Gaitán) | Grandes ríos tropicales | Pavón o tucunaré (récord en Colombia ~11 kg), payara (~17.7 kg), bagre rayado, arawana, cachama, sardinata | Una de las regiones más ricas para la pesca deportiva de río. Hay propuestas de veda para cachama y bagres |

**Lo que cambia para el diseño:**
- El ambiente deja de ser solo de islas: es una **cadena del Gran Caribe y las Américas tropicales**, de los Andes
  fríos al mar.
- La **trucha en un lago de montaña** es un inicio clásico del género: agua quieta y clara, peces medianos, fácil.
- La **lobina** y las **mojarras** son el corazón de un lago cálido (estilo Florida o represa caribeña).
- Los **ríos de los Llanos** (pavón, payara, bagre) son un mapa de río mucho más emocionante que la quebrada de isla.
- **Costo de arte:** el lago andino necesita vegetación fría nueva (pinos, eucaliptos, páramo); Florida y los
  Llanos necesitan plantas nuevas parciales (cipreses, juncos, sabana). La laguna costera y el manglar reutilizan
  más de lo que ya hay.

### Mapas: lo que sabemos (2026-11-17)

- **A favor:** el relieve es procedural (código, no imágenes pesadas); las posiciones clave están en
  `src/world/WorldLayout.js`; océano, cielo, vegetación, fauna, audio y modelos son reutilizables.
- **En contra:** `WORLD` es una constante global que leen 21 archivos; `TerrainData.js` (992 líneas) está
  afinado para esta isla; Joe, Marta y el pueblo tienen posiciones fijas en su código; las olas y el agua sobre
  la arena dependen de la forma de la playa.
- **Escenarios por dificultad:** mar abierto (media-baja), otra isla tropical o atolón (media), manglar o
  laguna (media-alta), lago o río de agua dulce (alta: sin olas, especies y plantas nuevas).
- **Idea a verificar para la represa:** el agua es un plano a nivel 0 con olas que dependen del viento. Un lago
  podría ser el mismo océano sin viento, sin oleaje ni olas en la orilla, rodeado de tierra. No está probado.

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
- [x] ~~¿Acumulativas? ¿Libres? ¿Nivel mínimo?~~ Sí, la básica se regala al empezar, intermedia y avanzada con nivel (D18).
- [x] ~~¿Reloj de pared o tiempo jugado?~~ Tiempo jugado (D19).
- [x] ~~Duración~~ 1 día del juego jugado (D21).
- [ ] Precio de cada licencia (se calcula con el simulador, según lo que se gana en un día del juego)
- [ ] Nivel mínimo de la intermedia y la avanzada (se decide con la curva de niveles)
- [ ] ¿La pausa T detiene el tiempo de la licencia? (propuesta: no; la licencia cuenta tiempo jugado aunque el
  reloj visual esté en pausa, para que pausar no sea un truco)

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

Aprobado (D20):

| Tema | Decisión |
|---|---|
| Cómo se viaja | Desde el amarre del bote, con E se abre un mapa de viaje con los destinos desbloqueados |
| Qué lo desbloquea | La XP (D8): cada mapa pide un nivel mínimo |
| Costo | Un pasaje o diésel según la distancia (gasto que ordena la progresión) |
| Qué viaja contigo | Dinero, nivel y XP, equipo y mejoras (caña, carrete, sedal, bote) |
| Qué es de cada mapa | Licencias (cada mapa tiene sus especies y sus tres licencias), registro de pesca y récords por mapa, vendedores |
| Peces en la nevera | Hay que venderlos o soltarlos antes de viajar (o se pierden al viajar) |
| Técnico | Cambiar de mapa recarga la página (D6); el guardado se organiza en datos globales + datos por mapa |

- [ ] Costo de cada viaje (se decide al diseñar el mapa 2)

**Clases de tamaño**
- [ ] Umbrales de cada clase por especie (propuesta: por percentil del rango de peso actual)
- [ ] Precio por clase (propuesta: juvenil no se vende, común ×1, trofeo ×1.5, único ×3)
- [ ] Juveniles: ¿soltar obligatorio, multa o solo valen poco?

**Niveles y experiencia**
- [ ] Número de niveles (20–30) y forma de la curva
- [ ] XP por pez (por clase, especie, especie nueva)
- [ ] Qué desbloquea cada nivel (mejoras de Marta, licencias, más adelante mapas)

### Mediciones de la propuesta (2026-11-17)

Script: `node --no-warnings tools/balance/fase1-propuesta.mjs` (semilla 1; jugador humano; nevera de 30 kg con
viajes a vender: orilla y muelle 1 min, bahía 2, arrecife 2.5, profundo 5).

**Clases de tamaño:** la frecuencia medida coincide con la propuesta: juvenil 42 %, común 43 %, trofeo 11 %,
único 4 %. El valor medio por especie casi no cambia: lo que se pierde con los juveniles lo compensan los únicos ×3.

**XP:** con XP solo por clase y dificultad, el profundo era el spot que menos XP daba (382 XP/h frente a ~900),
porque premia la cantidad de peces. Sumando **3 XP por kilo**, todos los spots quedan parejos (~1,100–1,600 XP/h
con equipo inicial) y mejorar el equipo da más XP (~2,200 XP/h con equipo medio en bahía y profundo).

**Dinero por día del juego (24 min), equipo inicial:**

| Licencia | Mejor spot | $/día | Spot más rentable con equipo medio |
|---|---|---|---|
| Básica | Orilla | ~$200 | Muelle ~$125 |
| Intermedia | Bahía | ~$565 | Bahía ~$813 |
| Avanzada | Profundo | ~$1,170 | Profundo ~$2,640 |

**Propuesta de números (pendiente de aprobar):**

| Tema | Propuesta | Efecto medido |
|---|---|---|
| XP por pez | clase (juvenil 1, común 3, trofeo 10, único 40) × dificultad (1 + 2 × fuerza, de 1 a 3) + **3 por kilo** + 20 por especie nueva | XP pareja entre spots |
| Curva de niveles | XP total para el nivel N = **100 × (N − 1)²** (nivel 3 = 400, nivel 6 = 2,500, nivel 10 = 8,100, nivel 20 = 36,100) | Nivel 3 ≈ 17 min, nivel 6 ≈ 1.7 h, nivel 10 ≈ 4.5 h (estimado) |
| Licencia básica | Regalada el primer día; después **$20** por día | ~10–15 % de lo que se gana con ella |
| Licencia intermedia | **Nivel de entrada + 3**, **$100** por día | Neto ~$300–465/día, mejor que la básica |
| Licencia avanzada | **Nivel de entrada + 6**, **$300** por día | Neto ~$870/día en profundo: ~1.9× la intermedia |
| Siguiente mapa | **Nivel de entrada + 10** | |

Desde D24 los niveles de las licencias son **relativos a la banda del mapa**. Mientras la isla sea el inicio
(D25), su nivel de entrada es 1 (intermedia 4, avanzada 7). Cuando exista la cadena completa, la isla entra en
el nivel 30 (intermedia 33, avanzada 36, siguiente mapa 40).

- [ ] **Curva por banda o global.** Con una curva global 100 × (N − 1)², cada banda de 10 niveles pide más XP
  que la anterior (niveles 1→10: 8,100 XP; 30→40: 68,000 XP). Como los peces de cada mapa son más grandes, también
  dan más XP por kilo; hay que medir que el tiempo por banda quede razonable. Alternativa: curva por banda,
  calibrada para que cada mapa dure lo mismo.

**Consecuencia a resolver en el siguiente bloque:** con licencia intermedia se ganan ~$1,000–2,000 por hora, y
todas las mejoras actuales de Marta suman $3,875. Hay que reajustar los precios de la tienda y decidir qué
mejora se desbloquea en cada nivel.

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
- **2026-11-17** · Decididos D18 (acumulativas, básica regalada, nivel mínimo), D19 (tiempo jugado), D20 (viaje
  aprobado) y D21 (licencia de 1 día del juego jugado). Licencias cerradas salvo precios y niveles.
- **2026-11-17** · Decidido D22 (día = 24 min). Medidas las clases de tamaño, la XP y las licencias
  (`tools/balance/fase1-propuesta.mjs`). Propuestos: XP con 3 por kilo, curva 100 × (N − 1)², licencias
  $20 / $100 (nivel 3) / $300 (nivel 6), mapa 2 en el nivel 10. Detectado que la tienda necesita nuevos precios.
- **2026-11-17** · Decididos D23 (cadena de mapas represa → río → manglar → isla), D24 (la isla es el punto de
  referencia: se diseña hacia abajo y, en el futuro, hacia arriba), D25 (la isla sigue siendo el inicio hasta que
  exista la represa) y D26 (se construye primero la represa, luego el manglar, el río al final). Reordenada la hoja
  de ruta; niveles de licencias pasan a ser relativos a la banda de cada mapa.
- **2026-11-17** · Investigados los biomas acuáticos del Caribe de la montaña al mar, con sus especies reales
  (sección 6). Pendiente decidir cuántos mapas van por debajo de la isla.
- **2026-11-17** · Ampliada la investigación: trucha y lagos andinos de Colombia, lagos y canales de Florida,
  ciénagas y mojarras de Colombia, ríos de los Llanos. Propuesta de cadena de cinco mapas por debajo de la isla.
