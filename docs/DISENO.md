# Tidewater · Documento de diseño

Documento vivo: recoge qué queremos hacer con el juego, qué se decidió y por qué, antes de escribir código.
Se actualiza en cada conversación de trabajo. La bitácora al final registra los cambios.

**Estado:** **Fase 1 programada** (6 de 6 entregas, 2026-11-18): clases, XP, niveles, licencias, reloj de 120 minutos, cinco spots con nombre y tienda nueva. Siguiente: jugarla y ajustar; luego la Fase 2.

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

Más adelante, **varios escenarios o mapas** que se desbloquean con la progresión, en una cadena del Gran Caribe y
las Américas tropicales, de los Andes fríos al mar: lago de montaña, lago cálido, río tropical, ciénaga y manglar,
laguna costera y la isla (D27), en lugares inspirados en sitios reales pero ficticios (D28). Mapas y niveles no tienen fin: **la isla es el punto de
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
| D22 | ~~Un día del juego dura 24 minutos reales~~ Reemplazada por D47 | | 2026-11-17 |
| D23 | ~~Cadena represa → río → manglar → isla~~ Reemplazada por D27. **Cadena de mapas de la montaña al mar, en ambiente caribeño:** represa o lago (inicio) → río o quebrada → manglar o estuario → la isla actual | Como en el género: se empieza en aguas tranquilas y el mar es la meta. El ambiente caribeño reutiliza vegetación y sonidos | 2026-11-17 |
| D24 | **La isla es el punto de referencia** de todo el diseño. Por ahora es el mapa más alto: los números (peces, precios, XP, licencias) se calibran en ella y se escalan **hacia abajo** para los mapas de inicio y, cuando se agreguen, **hacia arriba** para mapas de nivel más alto | Mapas y niveles son infinitos; hace falta un ancla fija desde la que medir | 2026-11-17 |
| D25 | **Hasta que exista un mapa de nivel más bajo, la isla sigue siendo donde se empieza** (redactado antes de D27, que cambió la represa por la cadena de cinco), con su progresión interna de licencias. Cuando la represa esté lista pasa a ser el inicio, la isla se desbloquea por nivel y las partidas que ya estén en la isla se quedan ahí sin perder nada | El juego siempre es jugable mientras se construye la cadena | 2026-11-17 |
| D26 | ~~Represa primero~~ Reemplazada por D29. **Orden de construcción ≠ orden del juego:** se construye primero la represa (la que más reutiliza: agua quieta), luego el manglar, y el río al final o como opcional (el agua que corre es tecnología nueva) | Empezar por lo de menor riesgo | 2026-11-17 |
| D27 | **Cinco mapas por debajo de la isla**, ordenados por dificultad y tamaño de los peces: 1) lago de montaña (trucha), 2) lago cálido o represa (lobina, mojarras), 3) río tropical (pavón, payara), 4) ciénaga y manglar (róbalo, sábalo joven), 5) laguna costera y bajos (macabí, palometa), 6) la isla. Por encima, mar abierto (7+). La quebrada de isla (dajao, guabina) queda como rincón del río o mapa opcional | Investigación de biomas: cada mapa es un bioma distinto con agua, peces y forma de pescar propias | 2026-11-17 |
| D28 | **Lugares inspirados, no reales:** cada mapa se basa en sitios reales (Andes colombianos, Florida, Llanos, ciénagas, flats del Caribe) pero con nombre y geografía propios | Libertad de diseño; nadie compara con el lugar real | 2026-11-17 |
| D29 | **Orden de construcción por reutilización:** laguna costera → ciénaga y manglar → lago cálido → río tropical → lago de montaña. Mientras tanto se empieza por el mapa existente de nivel más bajo | Lo que más reutiliza (agua salada quieta) va primero; el lago de montaña pide más arte nuevo (vegetación fría) y el río, tecnología nueva (agua que corre) | 2026-11-17 |
| D30 | **Mapa 1 · Lago de montaña aprobado:** 7 especies (guapucha, carachi, pejerrey en la básica; trucha arcoíris y carpa en la intermedia; trucha café en la avanzada; capitán de la sabana protegido) y 5 spots (orilla de juncos, muelle del pueblo, desembocadura, bahía de lodo, centro profundo). Tamaños y precios aproximados, a validar | Medido contra la isla: el dinero escala al 20–40 % de la isla; todo se saca con el equipo inicial | 2026-11-17 |
| D31 | **Especies protegidas:** algunas especies (por ahora el capitán de la sabana) solo se pescan y se sueltan: dan XP y cuentan en el registro, nunca dinero | Refleja especies amenazadas reales y da variedad sin romper la economía | 2026-11-17 |
| D32 | **Modelo de bandas:** la XP de cada pez se multiplica por **1.25 por cada mapa** (lago ×1.0 … isla ×3.05) y pasar del nivel N al N+1 pide **600 × 1.03^(N − 1) XP**. Meta: **~5 horas de juego por mapa** (~30 horas hasta la isla) | La XP casi no crecía entre mapas; con la curva cuadrática la isla habría tardado ~50 h frente a ~6 h del lago | 2026-11-17 |
| D33 | **La técnica depende del pez, no del mapa.** Cada especie tiene una técnica principal y técnicas secundarias; en un mismo mapa conviven varias técnicas (en el lago, la trucha va con spinning o casting y la carpa con flotador) | Realista; elegir la técnica correcta para el pez que se busca es parte del juego | 2026-11-18 |
| D34 | **Con la técnica equivocada el pez pica mucho menos:** con la principal pica normal, con una secundaria menos, con una incompatible casi nunca (propuesta de pesos: 1 / 0.4 / 0.05, por medir) | Realista y deja margen para experimentar | 2026-11-18 |
| D35 | **Técnicas del diseño: flotador, spinning, casting, fondo y curricán.** La mosca queda como opcional futura | Cubren todas las especies de la cadena sin un catálogo enorme | 2026-11-18 |
| D36 | **Por ahora, cada técnica es un aparejo completo (caña + carrete + sedal) que sube de nivel** ("Aparejo de spinning nivel 3"). La bodega y el bote siguen siendo globales. Más adelante se evaluará separar piezas (caña, carrete, sedal, gramos del señuelo) | Pocas compras y fácil de entender para empezar; se puede refinar después | 2026-11-18 |
| D37 | **Tienda por técnicas aprobada:** aparejos de flotador, spinning, fondo, casting y curricán por grado (grado = número del mapa), bodega y bote globales; precio = precio estándar del mapa × factor de la técnica; licencias por mapa (5 / 15 / 25 % de lo ganado en un día) | El equipo de cada mapa cuesta el 30–58 % de lo ganado en él y siempre sobra dinero | 2026-11-18 |
| D38 | **La pelea profunda se une a las técnicas en una sola fase** (Fase 2): freno ajustable y equipo equilibrado llegan junto con spinning, casting, fondo y curricán | Con la pelea actual el grado del aparejo casi no importa; la pelea nueva es la que le da sentido | 2026-11-18 |
| D39 | **La Fase 1 solo implementa lo que ya existe en el código:** clases de tamaño, XP, niveles, licencias, spots y, de la tienda, el **aparejo de flotador** por grados más la bodega y el bote. Las demás técnicas llegan en la Fase 2 | La Fase 1 se puede programar y probar pronto sin depender de mecánicas nuevas | 2026-11-18 |
| D40 | **La isla empieza con 5 spots con nombre**, equivalentes a los cinco tipos de agua que ya calcula el juego: playa de la bahía (bajos), muelle, arrecife de la bahía, centro de la bahía (bahía) y mar abierto (profundo). Entre spots se usa el más cercano. **Futuros:** bajo de arena del este, farallones y la plataforma | Conserva casi igual el equilibrio actual; el sistema de spots cuesta lo mismo con 5 que con 8 y los otros se agregan barato después | 2026-11-18 |
| D41 | **La pausa con T no detiene el tiempo de la licencia:** la licencia cuenta tiempo jugado, no la hora del juego | Para que pausar no sea un truco | 2026-11-18 |
| D42 | **La hora del panel de ajustes (H) queda bloqueada en el juego:** el reloj avanza solo (D16). Solo se puede mover en el modo foto | Sacar fotos al atardecer sin hacer trampa con la hora de los peces | 2026-11-18 |
| D43 | **Mientras la isla sea el inicio (D25):** los seis grados de aparejo y de bodega se compran solo con dinero, sin nivel mínimo; las licencias intermedia y avanzada piden los niveles 4 y 7. Cuando exista la cadena, cada grado se ata a su mapa | El jugador de la isla necesita poder llegar al equipo de la isla | 2026-11-18 |
| D44 | **Guardado versión 2:** se conservan dinero, nevera y registro; cada mejora vieja pasa al grado más parecido por su valor (sedal y caña al aparejo de flotador, nevera a la bodega equivalente); el nivel inicial se calcula con la XP que habrían dado los peces del registro. Nadie pierde nada | Compatibilidad con las partidas actuales | 2026-11-18 |
| D45 | **Mientras la isla sea el mapa de inicio, su multiplicador de XP es ×1.0** (el del primer mapa de la cadena). Cuando haya mapas por debajo, pasa a ×3.05 | Coherente con D25: el multiplicador depende de la posición del mapa en la cadena | 2026-11-18 |
| D46 | **El reloj no se detiene con la tienda, el inventario ni la tarjeta de captura;** solo la pausa T lo detiene (y la licencia sigue corriendo, D41). En el modo foto la hora se puede mover, pero al salir vuelve a la del juego, que siguió corriendo por debajo | Simple y sin trucos con la hora de los peces | 2026-11-18 |
| D47 | **Un día del juego dura 120 minutos reales** (1 hora del juego = 5 minutos reales; reemplaza D22). La licencia sigue durando un día del juego (D21), o sea 120 min de juego, y **su precio sube ×5** para mantener el equilibrio medido: en la isla básica $175, intermedia $500, avanzada $1,000. El aviso de licencia por vencer salta a los 5 min. Los precios de licencias de los demás mapas (sección 6) están calculados para un día de 24 min: se multiplican ×5 | Con 24 min el día pasaba demasiado rápido | 2026-11-18 |
| D48 | **Tienda de la Fase 1:** precios de la tabla aprobada ($8,550 en total). Mientras el flotador sea la única técnica usa las estadísticas completas de su grado (×1.0; el ×0.8 de D37 entra en la Fase 2): el grado 0 es el equipo inicial de siempre y el 6 iguala o supera al mejor de antes. **Conversión de mejoras viejas (D44):** lo gastado en sedal, carrete y caña da el grado de flotador más alto que alcance y el resto se devuelve en dinero; bodega, tanque y motor pasan al primer grado de igual o mayor capacidad; sonda y luces se conservan | Nadie pierde nada y la isla sigue alcanzable con una sola técnica | 2026-11-18 |
| D49 | **Perfiles de partida:** hasta 5 partidas con nombre en el navegador, cada una con su guardado. Se eligen en la pantalla de inicio (partida actual y "Cambiar") y en el panel (H → Juego → Partidas): jugar, crear y borrar (pide confirmar). Cambiar de partida recarga la página, como el idioma. La partida que ya existía pasa a ser "Partida 1" con su guardado de siempre | Ver el avance de cada partida y empezar de cero sin perder la otra | 2026-11-18 |
| D50 | **El lago se hace como prototipo jugable primero:** preparar mapas (M1), luego un lago jugable aunque se vea básico (terreno, agua en calma, 7 especies, 5 spots, viaje) y después se pule por capas (vegetación fría, pieles de los peces, sonidos, niebla) | Saber pronto si el proyecto funciona con más de un mapa | 2026-11-18 |
| D51 | **El Mapa 1 se inspira en la Laguna de Tota** (Boyacá): playa de arena blanca, islas, laderas con cultivos y páramo, pueblo pesquero, trucha | Una referencia concreta para el terreno y el ambiente | 2026-11-18 |
| D52 | **Con solo dos mapas, el lago es el inicio y la isla queda libre:** las partidas nuevas empiezan en el lago; a la isla se puede viajar desde el principio, pero sus licencias intermedia y avanzada piden los niveles de la isla. Las partidas actuales siguen en la isla. Se ajusta cuando existan los mapas 2 a 5 | Sin mapas intermedios, el nivel 51 de las bandas dejaría la isla inalcanzable | 2026-11-18 |
| D53 | **Portada global:** una página propia desde la que se gestiona todo: partidas (continuar, crear, borrar), mapas (la cadena con abiertos, bloqueados y por llegar), progreso y registro de cada partida, y ajustes generales (idioma, calidad, sonido). Reemplaza la pantalla de inicio sobre la isla | Con varios mapas no tiene sentido cargar un mapa entero para mostrar el menú | 2026-11-18 |
| D54 | **Desde la portada se continúa donde quedó la partida:** los mapas se ven, pero "Jugar" abre el mapa de la partida; cambiar de mapa sigue siendo viajar en el juego, desde el amarre y con costo (D20) | El viaje conserva su sentido | 2026-11-18 |
| D55 | **La portada es una página ligera aparte, sin 3D:** abre al instante con el arte del juego de fondo; "Jugar" carga la página del juego con el mapa de la partida y "Salir al menú" vuelve. La dirección principal es la portada; el juego pasa a otra página | Rápida, desacoplada del motor, y no carga un mapa para mostrar un menú | 2026-11-18 |
| D56 | **Multiplicador de XP con dos mapas:** el lago y la isla quedan los dos en ×1.0 mientras falten los mapas 2 a 5 (D45, D52). El lago ya da menos XP y dinero por pez que la isla (especies más fáciles); el ×3.05 de la isla (D32) se aplica cuando exista la cadena completa | Con la isla libre, ×3.05 haría saltarse el lago | 2026-11-18 |

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

Orden de trabajo (reordenado el 2026-11-17 según D24, D27–D29). La isla es el ancla: primero se define en ella
la progresión y después se construyen hacia abajo los mapas de inicio, empezando por los que más reutilizan.

| Orden | Etapa | Contenido | Esfuerzo | Riesgo | Estado |
|---|---|---|---|---|---|
| 1 | **Fase 1. Progresión (en la isla)** | Clases de tamaño; nivel y XP; licencias por pez; spots con su lista de peces; desbloqueos por nivel; tienda rediseñada. Calibrada en la isla como mapa de referencia, con la escala pensada para mapas por debajo y por encima | Medio | Bajo-medio (no toca la pelea) | **Programada** (2026-11-18) |
| 2 | **M1. Preparar mapas** | Convertir la isla en el primer mapa de un registro (forma, distribución, especies, vendedores y licencias por mapa); guardado global + por mapa; viaje entre mapas (D20). Debe verse idéntico | Medio | Medio | Pendiente |
| 3 | **M2. Laguna costera y bajos** (mapa 5 del juego) | Agua salada, quieta y poco profunda; praderas de hierba marina y arena; macabí, palometa, sábalo. Reutiliza el océano casi tal cual | Medio-alto | Bajo | Pendiente |
| 4 | **M3. Ciénaga y manglar** (mapa 4) | Agua salobre y quieta; mangles nuevos; róbalo, sábalo joven, pargo de manglar, pejelagarto | Alto | Medio | Pendiente |
| 5 | **M4. Lago cálido o represa** (mapa 2) | Agua dulce quieta (el océano sin viento ni oleaje, rodeado de tierra; por verificar); juncos y cipreses; lobina, mojarras, crappie, bagre | Alto | Medio | Pendiente |
| 6 | **M5. Río tropical** (mapa 3) | Agua con corriente (tecnología nueva); bosque de galería y sabana; pavón, payara, bagre rayado | Muy alto | Alto | Pendiente |
| 7 | **M6. Lago de montaña** (mapa 1, inicio) | Agua fría y clara; vegetación fría nueva (pinos, eucaliptos, páramo); trucha, carpa, capitán | Alto | Medio | Pendiente |
| — | Fase 2. Técnicas, pelea y consecuencias | Técnicas (D33–D35): spinning y casting, fondo y curricán, cada una con su aparejo por grados (D36, D37); **pelea profunda** (D38): freno ajustable con la rueda del mouse y equipo equilibrado, para que el grado del aparejo importe; carnadas y señuelos que se gastan; desgaste y reparación. **El spinning hace falta antes del lago de montaña** (su pez estrella es la trucha) | Muy alto | Medio-alto (cambia el corazón del juego) | Pendiente; spinning antes de M6 |
| — | ~~Fase 3. Pelea profunda~~ | Unida a la Fase 2 (D38) | | | |
| — | Fase 4. Objetivos | Encargos de los vendedores; torneo de los 10 más pesados | Medio | Bajo | Pendiente, se puede intercalar |
| — | Mapas por encima de la isla | Mar abierto, otras islas o atolones de nivel más alto (D24) | Alto | Bajo | Futuro |

### Cadena de mapas (D24, D27, D28)

| Orden en el juego | Mapa (nombre por definir) | Inspiración | Agua | Peces estrella (por definir) | Banda de niveles (propuesta, por medir) |
|---|---|---|---|---|---|
| 1 | Lago de montaña (inicio) | Lagos andinos de Colombia | Dulce, fría, quieta | Trucha arcoíris, carpa, capitán | 1–10 |
| 2 | Lago cálido o represa | Lagos de Florida, presas del Caribe, embalses de Colombia | Dulce, cálida, quieta | Lobina negra, mojarras (bluegill, mojarra amarilla), crappie, bagre, tilapia | 10–20 |
| 3 | Río tropical | Ríos de los Llanos | Dulce, con corriente | Pavón, payara, bagre rayado, cachama, arawana | 20–30 |
| 4 | Ciénaga y manglar | Ciénagas de Colombia, Everglades, manglar caribeño | Salobre, quieta | Róbalo, sábalo joven, pargo de manglar, mojarra, pejelagarto | 30–40 |
| 5 | Laguna costera y bajos | Flats del Caribe | Salada, somera, clara | Macabí, palometa, sábalo, róbalo | 40–50 |
| 6 | **La isla (referencia)** | La isla actual | Mar | Las 18 especies actuales | 50–60 |
| 7+ | Mar abierto y otros | Pesca de altura del Caribe | Mar abierto | Marlín, peto, pez vela | 60+ |

Cada mapa tiene sus propias licencias básica, intermedia y avanzada (D11, D20), con niveles mínimos dentro de su banda.

### Mapa 1 · Lago de montaña (aprobado, D30, 2026-11-17)

Inspirado en los lagos andinos (Tota, Neusa, Tominé en Colombia; Titicaca en Perú y Bolivia). Agua dulce, fría,
quieta y clara. Medido contra la isla con `node --no-warnings tools/balance/mapa1-propuesta.mjs`.

**Especies** (tamaños, precios y relación largo-peso **aproximados, por validar**):

| Especie | Licencia | kg | $/kg | Fuerza | Hora | $/pez medio | XP/pez medio |
|---|---|---|---|---|---|---|---|
| Guapucha | Básica | 0.005–0.02 | 2 | Mínima | Día | $0 | 4.5 |
| Carachi | Básica | 0.02–0.15 | 3 | Mínima | Día | $0.1 | 4.6 |
| Pejerrey | Básica | 0.1–1.2 | 4 | Baja | Día | $2.1 | 7.2 |
| Capitán de la sabana | **Protegida** (solo XP) | 0.1–0.8 | — | Baja | Noche | — | 7.8 |
| Trucha arcoíris | Intermedia | 0.2–4 | 6 | Media | Alba y ocaso | $10.4 | 12.7 |
| Carpa común | Intermedia | 0.5–12 | 2 | Media-alta | Siempre | $10.1 | 21.2 |
| Trucha café | Avanzada | 0.5–6 | 8 | Media-alta | Alba y ocaso | $21.4 | 16.1 |

**Spots:** orilla de juncos (guapucha, carachi, capitán), muelle del pueblo (pejerrey, carachi, trucha pequeña),
desembocadura de la quebrada (trucha arcoíris, algo de trucha café), bahía de lodo (carpa, capitán), centro
profundo en bote (truchas grandes, trucha café, carpa).

**Resultados frente a la isla** (equipo inicial, nevera de 30 kg, jugador humano):

| | Lago: XP/h | Isla: XP/h | Lago: $/día | Isla: $/día |
|---|---|---|---|---|
| Licencia básica | 760–2,160 | 1,360–2,540 | $3–55 | $70–216 |
| Licencia intermedia | 660–1,580 | 1,320–2,190 | $19–259 | $89–554 |
| Licencia avanzada | 710–1,550 | 1,190–1,410 | $21–294 | $294–1,382 |

**Hallazgos:**
- **El dinero escala bien:** el lago da ~20–40 % de lo que da la isla con la misma licencia.
- **La XP casi no escala:** el lago da ~70–85 % de la XP de la isla, porque la XP depende sobre todo de la
  cantidad de peces (en los dos mapas salen ~100–140 por hora). Hace falta que la XP crezca con el mapa.
- **La carpa da la XP más alta del lago** (pesa mucho) pero pide licencia intermedia: con la básica conviene
  pescar carpa y soltarla para subir de nivel (efecto de D13). Aceptable, pero hay que tenerlo en cuenta.
- **Guapucha y carachi no valen dinero** (son del tamaño de una carnada). Idea para la Fase 2: que sirvan como
  **carnada viva** en lugar de venderse.
- **Todo se saca con el sedal inicial:** correcto para el mapa de inicio.
- **Idea nueva: especies protegidas.** El capitán de la sabana es vulnerable en la vida real: en el juego solo
  se puede pescar y soltar (da XP, no dinero). Lo mismo podría aplicarse a otras especies amenazadas.

### Bandas de niveles (aprobado, D32, 2026-11-17)

Con la XP actual, una curva global 100 × (N − 1)² haría que la banda de la isla (50–60) tarde ~50 horas frente
a ~6 horas de la banda del lago. Propuesta para que cada mapa dure parecido:

| Pieza | Propuesta |
|---|---|
| **Multiplicador de XP por mapa** | ×1.25 por cada mapa: lago ×1.0, lago cálido ×1.25, río ×1.56, ciénaga ×1.95, laguna ×2.44, isla ×3.05 |
| **XP para pasar del nivel N al N+1** | 600 × 1.03^(N − 1): nivel 10 ≈ 6,100 XP acumulados; nivel 50 ≈ 65,100; nivel 60 ≈ 94,400 |
| **Resultado estimado** | ~5 horas de juego por mapa (lago: ~6,100 XP a ~1,200 XP/h; isla: ~30,000 XP a ~5,500 XP/h) y ~30 horas hasta la isla. Mejorar el equipo dentro de cada mapa lo acorta |

### Tienda por técnicas, calculada desde las bandas (aprobada, D37, 2026-11-18)

Script: `node --no-warnings tools/balance/tienda-propuesta.mjs`. Reemplaza la versión del 2026-11-17 (una sola
caña que subía de nivel), que quedó obsoleta con D33–D36.

**Regla:** todo escala ×1.25 por mapa (D32). Lo ganado en una banda (~5 h; lago ~$600/h medido) se reparte:
40 % equipo (70 % aparejos, 30 % bodega), 10 % bote, 20 % licencias, 5 % combustible, 25 % margen.
Precio de un aparejo en el mapa k = **precio estándar del mapa k × factor de la técnica**, para que cada técnica
siempre suba de precio de un mapa al siguiente.

**El "grado" de un aparejo es el número del mapa:** todos los aparejos de grado 3 se compran en el río, aunque la
técnica haya aparecido antes o después. Una técnica que aparece tarde no nace más débil que las demás.

| Técnica | Aparece en | Para | Factor de precio | Sedal y lance respecto a la base |
|---|---|---|---|---|
| Flotador | Lago de montaña (grado inicial gratis) | Carpa, pejerrey, peces pequeños | ×0.7 | Sedal ×0.8 |
| Spinning | Lago de montaña | Trucha, barracuda, macabí | ×1.0 | Lance ×1.15 |
| Fondo | Lago de montaña | Capitán, bagres, peces de arrecife | ×0.9 | Sedal ×1.1, lance ×1.2 |
| Casting | Lago cálido | Lobina, pavón, payara, sábalo | ×1.2 | Sedal ×1.3, lance ×1.1 |
| Curricán | La isla | Atún, dorado (arrastre desde el bote) | ×1.5 | Sedal ×1.6, sin lance |

| Mapa | Flotador | Spinning | Fondo | Casting | Curricán | Bodega | Bote |
|---|---|---|---|---|---|---|---|
| Lago de montaña (1–10) | $150 (nv 3) | $200 (nv 2) | $200 (nv 6) | — | — | 45 kg $350 (nv 4) | — |
| Lago cálido (11–20) | $200 | $250 | $250 | $300 (nv 14) | — | 60 kg $450 | — |
| Río tropical (21–30) | $250 | $350 | $300 | $400 | — | 80 kg $550 | Tanque 60 L $200 · motor ×1.1 $300 · sonda $250 |
| Ciénaga y manglar (31–40) | $300 | $400 | $350 | $500 | — | 110 kg $700 | Tanque 80 L $250 · luces $250 |
| Laguna costera (41–50) | $350 | $500 | $450 | $600 | — | 140 kg $900 | Tanque 110 L $300 · motor ×1.2 $450 |
| La isla (51–60) | $450 | $650 | $600 | $750 | $950 (nv 55) | 180 kg $1,000 | Tanque 150 L $350 · motor ×1.3 $550 |

En cada mapa: spinning en el nivel de entrada + 1, flotador + 2, bodega y casting + 3, curricán + 4, fondo + 5.
Las estadísticas de cada grado (sedal, lance, recogida) están en el script; son provisionales hasta la Fase 2.

**Comprobación de bandas:**

| Mapa | Ganado en la banda | Costo de todo su equipo | % de lo ganado | Licencias (20 %) | Queda libre |
|---|---|---|---|---|---|
| Lago de montaña | $3,000 | $900 | 30 % | $600 | $1,350 |
| Lago cálido | $3,750 | $1,450 | 39 % | $750 | $1,363 |
| Río tropical | $4,688 | $2,600 | 55 % | $938 | $916 |
| Ciénaga y manglar | $5,859 | $2,750 | 47 % | $1,172 | $1,645 |
| Laguna costera | $7,324 | $3,550 | 48 % | $1,465 | $1,943 |
| La isla | $9,155 | $5,300 | 58 % | $1,831 | $1,566 |

Todo el equipo hasta la isla: ~$16,550.

**Licencias por mapa** (por día del juego; básica 5 %, intermedia 15 %, avanzada 25 % de un día):

| Mapa | Básica | Intermedia (nivel) | Avanzada (nivel) |
|---|---|---|---|
| Lago de montaña | Regalada el primer día; luego $10 | $35 (4) | $60 (7) |
| Lago cálido | $15 | $45 (14) | $75 (17) |
| Río tropical | $20 | $55 (24) | $95 (27) |
| Ciénaga y manglar | $25 | $70 (34) | $100 (37) |
| Laguna costera | $30 | $90 (44) | $150 (47) |
| La isla | $35 | $100 (54) | $200 (57) |

**Hallazgos:**
- **Todo cabe en las bandas:** el equipo de cada mapa cuesta entre el 30 % y el 58 % de lo que se gana en él, y
  siempre queda dinero libre ($900–1,950 por mapa). El río y la isla son los más caros porque traen mejoras del bote.
- **Con la pelea actual el sedal sigue sin importar:** con su técnica, la carpa, la trucha café, la barracuda, el
  atún, el dorado y el pargo salen al 100 % con cualquier grado. Solo el sábalo depende del grado (50 % con casting
  de grado 2, 100 % con grado 6). La Fase 3 (pelea profunda) es la que hará que el grado importe.
- **El inicio del lago es lento:** con la licencia básica se ganan ~$55–140 por hora. El camino natural es subir
  al nivel 4 (~1.5 h), comprar la intermedia ($35), pescar carpa con flotador y después comprar el spinning ($200)
  para la trucha. Hay que vigilar que la primera hora no aburra.
- **La licencia avanzada del lago no se paga sola** (sigue pendiente: solo agrega la trucha café).
- **Guardado:** el formato de mejoras cambia por completo (aparejos por técnica); habrá que subir la versión del
  guardado y convertir el equipo actual (por ejemplo, la caña y el sedal actuales pasan al aparejo de flotador
  del grado más parecido).

### Técnica por especie (propuesta, 2026-11-18)

**Lago de montaña**

| Especie | Técnica principal | También pica con |
|---|---|---|
| Guapucha, carachi | Flotador (carnada pequeña) | — |
| Pejerrey | Flotador | Spinning |
| Capitán de la sabana | Fondo (de noche) | — |
| Trucha arcoíris | Spinning | Casting, flotador |
| Carpa común | Flotador | Fondo |
| Trucha café | Spinning | Casting |

**La isla**

| Especie | Técnica principal | También pica con |
|---|---|---|
| Pequeños de orilla y muelle (pejerrey cabezón, lisa, agujón, sargento, ronco, cromis, cirujano) | Flotador | Fondo |
| Arrecife (rabirrubia, pez perro, loro, ángel, mero) | Fondo | Flotador |
| Barracuda, jurel | Spinning | Casting |
| Sábalo | Casting | Spinning |
| Atún aleta negra, dorado | Curricán | Spinning |
| Pargo colorado | Fondo (aguas profundas) | — |

| Técnica | Cómo se juega | Estado en el código |
|---|---|---|
| Flotador | Lanzar, esperar, la boya se hunde, clavar | Ya existe |
| Spinning | Lanzar un señuelo y recogerlo; el pez ataca durante la recogida | Nueva; la más cercana (la caña actual ya es de spinning) |
| Casting | Como el spinning, con señuelos y peces más pesados y otro carrete | Variante del spinning |
| Fondo | Plomo sin boya; la picada se ve en la punta de la caña | Nueva, moderada |
| Curricán | Señuelo arrastrado detrás del bote en marcha | Nueva, la más compleja |

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
- [x] ~~XP para abrir el mapa 2 y cómo crece~~ Resuelto con D32: cada mapa abre 10 niveles después (~5 h por mapa).

**Spots (D9, D40)**
- [x] ~~Lista de spots de la isla~~ Cinco spots (D40, tabla abajo).
- [x] ~~¿Qué pasa entre spots?~~ Se usa el spot más cercano (D40).
- [x] ~~Probabilidades exactas de cada especie por spot~~ En la Fase 1 son las mismas que ya tenía cada tipo de agua (entrega 5): el equilibrio medido no cambia. Se ajustan cuando lleguen los spots futuros.

| Spot | Equivale a (tipo de agua actual) | Profundidad medida | Cómo se llega | Especies (frecuente → rara) |
|---|---|---|---|---|
| Playa de la bahía | Bajos | 0.5–2 m | A pie | Lisa, agujón, pejerrey cabezón → jurel (alba y ocaso) |
| Muelle | Muelle | ~4 m en la punta | A pie | Sargento mayor, ronco → rabirrubia, agujón → sábalo (noche) |
| Arrecife de la bahía | Arrecife | 2–9 m | A pie desde la playa oeste o en bote | Ronco, sargento, cirujano, cromis → rabirrubia, ángel, loro, pez perro |
| Centro de la bahía | Bahía | 10–17 m | Bote | Barracuda, jurel, rabirrubia → ronco → sábalo (noche) |
| Mar abierto | Profundo | 22 m a 800 m al sur; 90 m a 1,100 m | Bote (gasta diésel) | Pargo colorado, atún, dorado → mero, barracuda |

Spots futuros (medidos): **bajo de arena del este** (~1.5 m, dentro de la bahía al este), **farallones** (0.5–2 m entre
las rocas de las puntas de los cabos) y **la plataforma** (13–22 m, 300–800 m al sur, afuera de la bahía).

**Licencias por pez (D10–D13)**
- [x] ~~¿Por especie o por grupo?~~ Tres licencias (D11).
- [x] ~~¿Duración?~~ Días del juego (D12).
- [x] ~~¿Sin licencia?~~ Soltar, con XP (D13).
- [x] ~~Reparto de especies~~ Aprobado (D14, tabla abajo).
- [x] ~~¿Acumulativas? ¿Libres? ¿Nivel mínimo?~~ Sí, la básica se regala al empezar, intermedia y avanzada con nivel (D18).
- [x] ~~¿Reloj de pared o tiempo jugado?~~ Tiempo jugado (D19).
- [x] ~~Duración~~ 1 día del juego jugado (D21).
- [x] ~~Precio de cada licencia~~ Tabla por mapa (D37).
- [x] ~~Nivel mínimo~~ Entrada + 3 y entrada + 6 de cada mapa; en la isla como inicio, niveles 4 y 7 (D43).
- [x] ~~¿La pausa T detiene la licencia?~~ No (D41).

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
- [x] ~~Duración de un día~~ ~~24 minutos (D22)~~ 120 minutos (D47).
- [x] ~~Control de hora del panel~~ Bloqueado en el juego, libre en el modo foto (D42).
- [x] ~~¿El reloj se pausa con el menú, la tienda o la tarjeta de captura?~~ No; solo con la pausa T (D46).

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

**Dinero por día del juego (24 min, medido antes de D47; con 120 min es ×5), equipo inicial:**

| Licencia | Mejor spot | $/día | Spot más rentable con equipo medio |
|---|---|---|---|
| Básica | Orilla | ~$200 | Muelle ~$125 |
| Intermedia | Bahía | ~$565 | Bahía ~$813 |
| Avanzada | Profundo | ~$1,170 | Profundo ~$2,640 |

**Propuesta de números (pendiente de aprobar):**

| Tema | Propuesta | Efecto medido |
|---|---|---|
| XP por pez | (clase (juvenil 1, común 3, trofeo 10, único 40) × dificultad (1 + 2 × fuerza, de 1 a 3) + **3 por kilo** + 20 por especie nueva) × multiplicador del mapa (D32) | XP pareja entre spots |
| Curva de niveles | ~~100 × (N − 1)²~~ Reemplazada por D32: 600 × 1.03^(N − 1) XP por nivel | ~5 h por mapa |
| Licencia básica | Regalada el primer día; después **$20** por día | ~10–15 % de lo que se gana con ella |
| Licencia intermedia | **Nivel de entrada + 3**, **$100** por día | Neto ~$300–465/día, mejor que la básica |
| Licencia avanzada | **Nivel de entrada + 6**, **$300** por día | Neto ~$870/día en profundo: ~1.9× la intermedia |
| Siguiente mapa | **Nivel de entrada + 10** | |

Desde D24 los niveles de las licencias son **relativos a la banda del mapa**. Mientras la isla sea el inicio
(D25), su nivel de entrada es 1 (intermedia 4, avanzada 7). Cuando exista la cadena completa (D27), la isla entra
en el nivel 50 (intermedia 53, avanzada 56, siguiente mapa 60).

- [x] ~~Curva por banda o global~~ Resuelto con D32 (multiplicador por mapa y curva 600 × 1.03^(N − 1)).

**Consecuencia a resolver en el siguiente bloque:** con licencia intermedia se ganan ~$1,000–2,000 por hora, y
todas las mejoras actuales de Marta suman $3,875. Hay que reajustar los precios de la tienda y decidir qué
mejora se desbloquea en cada nivel.

**Compatibilidad**
- [x] ~~Partidas guardadas existentes~~ Guardado versión 2 con conversión (D44).

---

## 7b. Plan de programación de la Fase 1

Entregas pequeñas; cada una se prueba y se sube por separado y el juego queda jugable entre una y otra.

| # | Entrega | Contenido | Estado |
|---|---|---|---|
| 1 | Datos y reglas, sin interfaz | `src/game/Progression.js` (clases de tamaño, valor por clase, XP, curva de niveles, licencias acumulativas de un día jugado, especies protegidas); licencia de cada especie en `FishTable.js`; tests en `test/game-logic.mjs`; sección `fase1` en `npm run balance`. No cambia el comportamiento del juego | **Hecha** (2026-11-18) |
| 2 | Guardado versión 2 | XP, licencias, tiempo jugado; conversión de partidas viejas (D44); tests | **Hecha** (2026-11-18) |
| 3 | Interfaz y conexión | Conectar las reglas al juego; nivel y XP en el HUD; clase en la tarjeta de captura; motivo al soltar; licencias en la tienda | **Hecha** (2026-11-18) |
| 4 | Reloj | Día que avanza solo (120 min, D47); hora del panel bloqueada salvo en el modo foto (D16, D41, D42) | **Hecha** (2026-11-18) |
| 5 | Spots | Cinco zonas con nombre en la isla; nombre al caer la boya; minimapa (D40) | **Hecha** (2026-11-18) |
| 6 | Tienda nueva | Aparejo de flotador por grados, bodega y bote (D37, D39, D43) | **Hecha** (2026-11-18) |

**Medición de la entrega 1** (`npm run balance -- --solo=fase1`, reglas reales, isla como inicio): básica ~$220 por
día en la orilla; intermedia ~$470–490 en el arrecife y la bahía; avanzada ~$1,190 en el profundo (~$990 neto).
Con la XP de la isla (×1.0, D45), el nivel 4 llega en ~0.9 h, el 7 en ~1.8 h y el 10 en ~2.9 h: más rápido que las
~5 h de la meta, porque la curva se calibró con la XP del lago y la isla da más XP por hora. Es aceptable mientras la
isla sea el inicio; se recalibra cuando exista el lago. Con la básica, el profundo es el spot que más XP da (se
sueltan todos sus peces y no hay viajes a vender): efecto conocido de D13.

**Entrega 2, cómo quedó el guardado** (`src/game/GameState.js`):

- Clave nueva `tidewater.save.v2`. Si no existe, se lee `tidewater.save.v1`, se convierte y se escribe como v2; la
  partida v1 queda intacta (volver a una versión vieja del juego la sigue encontrando).
- **Viaja con el jugador (D20):** dinero, XP, tiempo jugado, equipo, combustible y la nevera. **Por mapa:** registro
  con récords y licencias (`maps.island`). Un mapa nuevo empieza con registro vacío y la básica regalada por un día.
- **Conversión (D44):** se conservan dinero, nevera, mejoras, combustible y registro (pasa a la isla). XP inicial: el
  mejor pez de cada especie con su peso real y el bono de especie nueva, y cada captura restante como un pez típico
  (mitad de la clase común). Tiempo jugado desde cero y básica regalada por un día.
- **Equipo:** se guarda igual que en v1. Pasar las mejoras viejas a grados (la otra parte de D44) se hace en la
  entrega 6, cuando cambie el formato de la tienda.
- El tiempo jugado se guarda cada 10 s de juego, no en cada cuadro; una pausa larga (pestaña en segundo plano)
  cuenta como mucho 1 s.
- Métodos nuevos, todavía sin usar en el juego: `addXp`, `level`, `licenseTier`, `licenseSecondsLeft`,
  `licenseBlock`, `buyLicense`, `addPlayed`. 24 tests nuevos. Probado en el navegador: una partida v1 se convierte.

**Entrega 3, qué cambió en el juego:**

- **Cada captura** se valora por su clase (juvenil $0, común ×1, trofeo ×1.5, único ×3) y da XP aunque se suelte
  (D13). Se suelta, con el motivo en la tarjeta, si es juvenil, protegida, sin la licencia de su especie o si no
  cabe (en ese orden).
- **HUD (arriba a la derecha):** nivel, barra de XP y licencia activa con los minutos que le quedan (en rojo con
  menos de 2 min o sin licencia).
- **Tarjeta de captura:** cuarta casilla "Clase" con la XP ganada; "¡Nivel N!" cuando se sube.
- **Inventario (I) y tienda:** línea con nivel, barra de XP y licencia.
- **Tienda de Marta:** sección de licencias arriba (básica $35, intermedia $100 desde el nivel 4, avanzada $200
  desde el nivel 7), con las especies que suma cada una; comprar de nuevo agrega un día.
- **Avisos:** licencia con 2 min restantes, licencia vencida, subida de nivel (y qué licencia se abre).
- El tiempo jugado corre en cada cuadro, también con el día en pausa (T) (D41).
- La guía de bienvenida menciona las licencias.
- Probado en el navegador: compra de licencia, tarjeta de juvenil, pez sin licencia con subida de nivel,
  vencimiento de licencias, inventario. 9 tests nuevos de capturas.

**Entrega 4, cómo quedó el reloj:**

- El día avanza solo desde el arranque: 1 hora del juego cada 5 minutos reales (D47; `CLOCK_HOURS_PER_SECOND` en
  `Progression.js`). T lo pausa y lo reanuda a esa velocidad; las licencias siguen corriendo (D41).
- **Reloj en el HUD**, arriba a la izquierda junto al modo: hora y parte del día (alba 5–8, día 8–17, ocaso 17–20,
  noche), "en pausa" en rojo.
- **Panel de ajustes (H), Cielo → Sol:** hora, "Avanzar el tiempo" y velocidad bloqueados, con la nota "Reloj:
  libre en modo foto (P)". En el modo foto se liberan; al salir, la hora vuelve a la del juego más el tiempo pasado
  (D46). El azimut del sol sigue libre (no afecta a los peces).
- La hora se guarda con la partida (campo `hour` del guardado v2, agregado sin cambiar de versión) y el día sigue
  donde quedó al volver. Con `?bench` el reloj sigue detenido para las capturas de referencia.
- 5 tests nuevos. Probado en el navegador: velocidad, bloqueo, modo foto, pausa con T, hora guardada.

**Entrega 5, cómo quedaron los spots** (`src/game/Spots.js`):

- Cada spot es uno de los cinco tipos de agua que ya calculaba el juego; el spot bajo la boya es el tipo de agua que
  más pesa ahí (entre spots gana el más cercano, D40). Las picadas y las especies no cambian, así que el equilibrio
  medido se conserva.
- **Al caer la boya** en un spot distinto al del lance anterior aparece su nombre y la profundidad ("Arrecife de la
  bahía · 5.5 m"); lanzar otra vez al mismo spot no repite el aviso.
- **Minimapa:** el nombre de cada spot sobre el mapa (solo los que caben en la ventana) y, encima del minimapa, el
  spot que se está pescando (el de la boya) o sobre el que se está (bote, nadando, vadeando, muelle), en dorado.
- 4 tests nuevos. Probado en el navegador: muelle, playa, arrecife al lanzar.

**Entrega 6, cómo quedó la tienda** (`src/game/Gear.js`):

| Mejora | Grados (se compran en orden) | Total |
|---|---|---|
| Aparejo de flotador (sedal · lance · recogida) | 0: 7 kg · 22 m · 1.1 m/s (inicial) · 1: 10 · 25 · 1.3 $150 · 2: 13 · 29 · 1.5 $200 · 3: 18 · 33 · 1.7 $250 · 4: 26 · 38 · 1.9 $300 · 5: 36 · 43 · 2.1 $350 · 6: 50 · 48 · 2.3 $450 | $1,700 |
| Bodega | 30 kg (nevera) · 45 $350 · 60 $450 · 80 $550 · 110 $700 · 140 $900 · 180 $1,000 | $3,950 |
| Tanque | 40 L · 60 $200 · 80 $250 · 110 $300 · 150 $350 | $1,100 |
| Motor | ×1 · ×1.1 $300 · ×1.2 $450 · ×1.3 $550 | $1,300 |
| Sonda / luces de cubierta | $250 / $250 | $500 |

- Todo: **$8,550** (la tienda original: $3,875); en la isla, unas 4–6 h de juego.
- **Guardado versión 3** (`tidewater.save.v3`): convierte v2 (y v1 pasando por v2) con D48; las claves viejas no se
  tocan. Un aviso único cuenta la conversión ("tu sedal, carrete y caña ahora son un aparejo de flotador grado N ·
  te devolvimos $X").
- El simulador muestra la tienda nueva al final de `--solo=progreso`; las secciones 1–6 siguen auditando el juego
  original (con sus mejoras viejas, `LEGACY_UPGRADES`).
- La guía de bienvenida y el saludo de Marta mencionan los aparejos y las licencias.
- 10 tests nuevos. Probado en el navegador: tienda, conversión de una partida v2 (sedal de 30 lb y cajón de hielo →
  aparejo grado 1 + $90 y bodega de 80 kg), aviso de conversión.

## 7c. Perfiles de partida (D49)

- **Datos** (`src/game/Profiles.js`): índice en `tidewater.profiles` (partida activa y, por cada una, nombre, nivel,
  dinero, tiempo jugado y última vez jugada, que se actualizan en cada guardado). La Partida 1 (`p1`) usa la clave
  de siempre (`tidewater.save.v3`) y es la única que lee y convierte los guardados viejos; las demás usan
  `tidewater.save.v3.pN`. Los ids no se reutilizan; si se borran todas queda una partida nueva.
- **Interfaz** (`src/game/ProfilesUI.js`): en la pantalla de inicio, bajo "Haz clic para explorar", la partida actual
  con "Cambiar", que abre la lista; en el panel, H → Juego → Partidas. Cada fila: nombre, "actual", nivel, dinero,
  tiempo jugado, última vez; Jugar y Borrar (el segundo clic confirma, "¿Borrar del todo?"). Nueva partida con nombre
  (en blanco: "Partida N"); con 5, avisa que hay que borrar una.
- Borrar la partida que se está jugando deja de guardarla y carga la siguiente.
- La guía de primeras veces (`tidewater.guide`) es común a todas las partidas: la bienvenida sale solo la primera
  vez que se abre el juego, no en cada partida nueva (decidido; se puede repetir con F1).
- 10 tests nuevos. Probado en el navegador: crear "Prueba" (empieza en nivel 1, $0, básica regalada), volver a la
  Partida 1 con su progreso, borrar con confirmación desde la pantalla de inicio (corregido: el clic de borrar
  arrancaba el juego), panel, escribir el nombre sin activar atajos.

## 7d. Plan del Mapa 1 · Lago (D50–D52)

**Lo que encontramos en el motor (2026-11-18):**
- **Sirve tal cual:** el agua (el océano en preajuste "Calma", sin oleaje de fondo ni rompiente, se comporta como
  lago), los peces procedurales (cada especie es anatomía en números + patrón de piel: no hacen falta modelos 3D),
  la vegetación procedural, el pueblo, el muelle, los vendedores, el bote, los perfiles, la Fase 1 y el sonido de
  bosque (`bird_forest.ogg`).
- **Cuesta:** el terreno de la isla es un generador escrito a mano para un volcán con bahía (~1,000 líneas): el
  lago necesita el suyo. Además 21 archivos leen la distribución de la isla (`WorldLayout.js`: muelle, arrecife,
  pueblo…), así que primero la isla tiene que pasar a ser "un mapa de un registro".

**Entregas:**

| # | Entrega | Contenido | Estado |
|---|---|---|---|
| L1 | Registro de mapas (M1) | La isla pasa a ser un mapa del registro (distribución, spots, especies, licencias, vendedores); el mapa activo viene de la partida; cambiar de mapa recarga la página (D6). Debe verse idéntico | **Hecha** (2026-11-18) |
| L2 | Viaje | Desde el amarre del bote (E): destinos y costo; vender o soltar la nevera antes de viajar (D20) | Pendiente |
| L3 | Terreno del lago | Cuenca inspirada en Tota: playa de arena, laderas, una o dos islas, desembocadura, bahía de lodo, centro profundo; agua en calma; sin arrecife, rompiente ni aves marinas | **Hecha** (2026-11-18, prototipo) |
| L4 | Peces y spots del lago | Las 7 especies (D30) con anatomía básica, sus 5 spots, licencias del lago (precios ×5 por el día de 120 min, D47), multiplicador de XP | **Hecha** (2026-11-18) |
| L5 | Pueblo y arranque | Pueblo, muelle y vendedores en el lago; las partidas nuevas empiezan ahí (D52) | Pendiente |
| Pulido | Por capas | Vegetación fría (pinos, eucaliptos, frailejones, juncos), pieles de peces de agua dulce, sonido de montaña, niebla y cielo de altura | Después |

**Entrega L1, cómo quedó el registro:**

- `src/maps/island.js` reúne todo lo propio de la isla: nombre, índice de XP, generador de terreno (se carga al
  arrancar), distribución (`layout`: muelle, amarre, pueblo, arrecife, inicio, oleaje), vendedores, sus 18
  especies, sus 5 spots, sus licencias y qué sistemas tiene (`features`: arrecife, rompiente, aves marinas,
  ballena, palmeras; se usarán desde L3).
- `src/maps/registry.js`: `activeMap()` decide el mapa de esta carga: `?map=<id>` en la dirección (para probar),
  el mapa guardado en la partida activa o el mapa por defecto. Seguro en Node (isla).
- Leen el mapa activo: `WorldLayout.js` (los 21 archivos que lo usan no cambiaron), los puestos de Joe y Marta, los
  spots, las licencias, las especies que pican (`Bites`), la lista de la tienda, el guardado (mapa de la partida y
  multiplicador de XP) y el terreno (`App`).
- Las partidas muestran su mapa en el menú ("Partida 1 · La isla · Nv 5 · …").
- 6 tests nuevos. Probado en el navegador: la isla se ve y rinde igual (168 fps), la partida carga igual; el
  simulador (incluido el terreno en Node) da lo mismo.

**Entrega L3, cómo quedó el lago** (`src/world/LakeTerrainData.js`, `src/maps/lake.js`; se entra con
`juego.html?map=lake`):

- **Terreno propio** con los mismos datos que la isla (alturas y máscaras), así que todo el motor lo usa sin cambios.
  Se genera en ~1 s.
- **Orilla norte = la playa de la isla:** el pueblo, el muelle, los puestos y el bote quedan donde están; la playa
  es de arena blanca ("Playa Blanca") y la punta del muelle queda sobre ~4.5 m de agua.
- **El lago:** una isla grande y una chica, un brazo al oeste con la desembocadura de un río (cauce bajo el nivel
  del agua), una bahía de lodo poco profunda al este (~3 m), un centro de ~37 m y praderas de algas en los bajos.
- **Montañas** alrededor (250–390 m en los bordes del mapa): tapan el mar que hay más allá (el plano del agua es
  infinito). Picos con roca desnuda en lo alto.
- **Agua en calma:** brisa de 2.5 m/s, sin mar de fondo ni rompiente (la simulación de la orilla y las olas que
  rompen se apagan en los mapas sin rompiente). Sin ballena, sin arrecife, sin palmeras, plátanos ni monsteras.
- **Visita de prueba:** `?map=lake` no mueve la partida al lago (el guardado sigue apuntando a su mapa; el lago
  guarda su registro aparte).
- **Licencias del lago** ya definidas (básica $50, intermedia $175 en nivel 4, avanzada $300 en nivel 7). Las
  especies y los spots del lago llegan en L4: mientras tanto se pesca como en la isla.
- 7 tests nuevos. Probado en el navegador: carga sin errores, 180 fps, vistas desde el aire y desde el agua.

**Pulido visual, primera pasada (2026-11-18, con la foto de referencia):**
- **Agua de Tota:** absorbe más el azul que el Caribe (`water.absorption` / `water.scattering` del mapa): los bajos de
  arena frente a la playa se ven verde claro y el agua profunda azul oscuro, como en la foto.
- **Cielo de páramo:** más nubes (72 %) y más bruma (`sky` del mapa).
- **Cerros redondeados:** lomas suaves y anchas en vez de picos de serrucho, más altas hacia el borde; la
  cordillera del borde empieza cerca del límite del mapa para no levantar una pared desde la orilla sur.
- **El río nace en una quebrada** antes del borde del mapa (antes su valle dejaba ver el mar infinito de más allá).

**Pendientes del pulido:** pinos, eucaliptos y frailejones (hoy son los árboles de la isla); sonidos de mar
(rompiente, gaviotas) en la orilla; peces del arrecife nadando; laderas algo lisas.

**Referencia visual para el pulido (foto de la Playa Blanca de Tota, compartida el 2026-11-18):** agua azul
petróleo oscura (no turquesa); una franja verde clara muy marcada sobre los bajos de arena frente a la playa;
cerros redondeados y bajos con capas de montañas al fondo (no picos empinados); pinos y eucaliptos en la orilla;
cielo nublado de páramo; muelles de madera con lanchas de colores. (La foto no se guarda en el repositorio.)

**Mapa grande (N) y minimapa por mapa (2026-11-18):** cada mapa define el área que cubren el minimapa y el mapa
grande (`minimap` en `maps/*.js`; el lago cubre todo el valle). La tecla **N** abre el mapa entero, con el norte
arriba: tu posición y hacia dónde miras, los nombres de los spots (el actual en dorado), Joe, Marta y el bote.

**Entrega L4, cómo quedó la pesca en el lago:**
- **7 especies** en `FishTable.js` (datos de D30): guapucha, carachi y pejerrey (básica), trucha arcoíris y carpa
  (intermedia), trucha café (avanzada) y el capitán de la sabana (protegido: captura y suelta).
- **Modelos:** el pejerrey usa el modelo del pejerrey de mar (es de la misma familia); las otras 6 son especies
  nuevas del generador de peces (`FishSpecies.js`, `FishMaterial.js`): trucha arcoíris (lomo oliva, banda rosada,
  puntos negros), trucha café (dorada con puntos oscuros y rojos), carpa (bronce, escamas grandes, dorsal larga),
  capitán (bagre alargado, sin escamas, manchado; todavía sin bigotes), guapucha y carachi (pequeños y pardos).
- **El agua del lago** tiene sus propios tipos (`habitat` en `maps/lake.js`): juncos (bajos), muelle,
  desembocadura (brazo oeste), bahía de lodo (este) y profundo. Cada uno es un spot: Orilla de juncos, Muelle del
  pueblo, Desembocadura, Bahía de lodo y Centro profundo. Lo que pica en cada uno sigue el diseño (juncos: guapucha,
  carachi, capitán; muelle: pejerrey y truchas pequeñas; desembocadura: trucha arcoíris y algo de café; bahía: carpa
  y capitán; centro: truchas grandes, café y carpa).
- XP: los dos mapas en ×1.0 (D56).
- 6 tests nuevos. Probado en el navegador: tarjetas de captura de las especies nuevas, especies por spot, mapa grande.

**Resuelto en L4:** el multiplicador de XP (D56). con el lago como inicio la isla pasaría a XP ×3.05 (D32) en vez de ×1.0
(D45); como la isla queda libre (D52), eso dejaría saltarse el lago. Hay que medir y decidir.

## 7e. Plan de la portada (D53–D55)

**Cómo encaja:** la portada (`index.html`, la dirección principal) no importa el motor ni WebGPU: solo el idioma,
las partidas (`Profiles`), un catálogo ligero de mapas y las reglas de progreso para leer los guardados. El juego
pasa a `juego.html` (lo que hoy es `index.html`, con su cargador). Las dos páginas comparten el almacenamiento del
navegador, así que las partidas son las mismas.

| # | Entrega | Contenido | Estado |
|---|---|---|---|
| P1 | Portada y juego separados | Portada con "Continuar" (partida activa · mapa · nivel) y Partidas (crear, borrar, elegir; lo de D49 se muda aquí); selector de idioma; el juego en `juego.html`; "Salir al menú" en el juego; la pantalla de inicio del juego queda solo con "Haz clic para explorar". Vite y GitHub Pages con las dos páginas | **Hecha** (2026-11-18) |
| P2 | Mapas y progreso | La cadena de mapas (lago → … → isla) con abierto / por llegar y dónde está la partida; progreso de la partida: nivel y XP, dinero, tiempo, licencias y especies capturadas por mapa con sus récords | **Hecha** (2026-11-18) |
| P3 | Ajustes generales | Idioma, calidad gráfica y volumen guardados desde la portada y leídos por el juego al cargar | Pendiente |

**Entrega P1, cómo quedó:**

- **Fondo:** una toma del propio juego, la punta del muelle al atardecer con el bote amarrado, las cañas apoyadas
  en la baranda y una gaviota (`public/ui/portada.jpg` y `portada-720.jpg`, sacada en el modo foto).
- **Portada** (`index.html`, `src/portada/`): marca y ES | EN arriba; "Un juego de pesca", el título y una frase;
  tarjeta **Continuar / Empezar** con la partida elegida (mapa, nivel, dinero, tiempo, última vez) y el botón
  **Jugar**; a la derecha **Partidas**: elegir (clic en el nombre), Jugar, Borrar (con confirmación), Nueva partida.
  En el teléfono todo va en una columna. Pesa ~13 KB de código: no carga el motor.
- **Piezas compartidas sin el motor:** `src/maps/catalog.js` (los 6 mapas de la cadena con su estado: la isla
  abierta, el lago en construcción, los demás planeados) y `src/game/Levels.js` (la curva de niveles).
- **Juego** (`juego.html`): la pantalla de inicio muestra la partida y **Menú**; el panel (H → Juego → Partida)
  muestra la partida y **Salir al menú**. Las partidas ya no se administran dentro del juego (D53 reemplaza esa
  parte de D49).
- Vite compila las dos páginas para GitHub Pages.
- Probado en el navegador: portada en escritorio y teléfono, Jugar → juego con la partida, Menú → portada, crear y
  borrar desde la portada, compilación.

**Entrega P2, cómo quedó:** el panel derecho de la portada tiene tres pestañas (se recuerda la última):
- **Partidas:** lo de P1.
- **Mapas:** los 6 mapas de la cadena en orden, con inspiración, banda de niveles y estado (abierto, en
  construcción, planeado); el mapa de la partida elegida resaltado ("tu partida está aquí") y cuántas especies lleva
  en cada mapa que ha pescado.
- **Progreso** de la partida elegida: nivel con barra de XP, dinero, tiempo jugado, licencia activa del mapa con su
  tiempo restante, equipo (grado del aparejo, bodega, sonda, luces) y el registro por mapa: cada especie con sus
  capturas y su récord (kg · cm), o "sin capturar".
- La lista de especies de cada mapa pasó al catálogo ligero (`src/maps/catalog.js`); la isla la toma de ahí.
- Las dos páginas tienen ícono de pestaña.

**Orden propuesto:** P1 → P2 → P3, y después el lago (L3 terreno → L4 peces y spots → L2 viaje → L5 pueblo y
arranque).

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
- **2026-11-17** · Decididos D27 (cinco mapas por debajo de la isla), D28 (lugares inspirados, no reales) y D29
  (orden de construcción: laguna costera, manglar, lago cálido, río, lago de montaña). La isla pasa a la banda
  50–60. Hoja de ruta y cadena de mapas actualizadas.
- **2026-11-17** · Diseñado y medido el Mapa 1 · Lago de montaña (`tools/balance/mapa1-propuesta.mjs`):
  7 especies, 5 spots, especie protegida. El dinero escala bien frente a la isla, la XP no. Propuesto un modelo de
  bandas: multiplicador de XP ×1.25 por mapa y curva 600 × 1.03^(N − 1) por nivel (~5 horas por mapa).
- **2026-11-17** · Decididos D30 (lago de montaña aprobado), D31 (especies protegidas) y D32 (modelo de bandas:
  ×1.25 de XP por mapa, curva 600 × 1.03^(N − 1), ~5 h por mapa). Resuelta la pregunta de la curva.
- **2026-11-17** · Calculada la tienda desde las bandas (`tools/balance/tienda-propuesta.mjs`): 4 mejoras con un
  nivel por mapa más mejoras del bote; licencias por mapa. Hallazgos: el sedal casi no importa hasta la Fase 3,
  la licencia avanzada del lago no se paga sola, el guardado necesitará conversión.
- **2026-11-18** · Rediseño del equipo: decididos D33 (técnica por especie), D34 (con la técnica equivocada pica
  mucho menos), D35 (flotador, spinning, casting, fondo, curricán) y D36 (aparejo completo por niveles por técnica).
  Propuesta de técnica por especie para el lago y la isla. La tienda queda por recalcular por técnicas; la Fase 2
  pasa a ser "técnicas, carnadas y consecuencias".
- **2026-11-18** · Recalculada la tienda por técnicas: aparejos de flotador, spinning, fondo, casting y curricán por
  grado (= número del mapa), bodega y bote globales. El equipo de cada mapa cuesta el 30–58 % de lo ganado en él.
  Pendientes: la licencia avanzada del lago y la lentitud de la primera hora.
- **2026-11-18** · Decididos D37 (tienda por técnicas aprobada) y D38 (pelea profunda unida a las técnicas en la
  Fase 2). Hoja de ruta actualizada.
- **2026-11-18** · Decididos D39 (la Fase 1 solo implementa lo que ya existe: flotador, bodega y bote) y D40
  (cinco spots en la isla, equivalentes a los tipos de agua actuales; tres spots futuros anotados). Medidas las
  profundidades reales de la isla para ubicar los spots.
- **2026-11-18** · Decididos D41 (la pausa no detiene la licencia), D42 (hora bloqueada salvo en el modo foto),
  D43 (en la isla como inicio, grados por dinero y licencias en los niveles 4 y 7) y D44 (guardado versión 2 con
  conversión). **La Fase 1 queda definida.**
- **2026-11-18** · Empieza la programación de la Fase 1. **Entrega 1 hecha:** reglas en `src/game/Progression.js`,
  licencia por especie en `FishTable.js`, 31 tests nuevos (todos pasan), sección `fase1` en el simulador. Decidido
  D45 (la isla como inicio usa XP ×1.0). El juego todavía no usa estas reglas.
- **2026-11-18** · **Entrega 2 hecha:** guardado versión 2 con datos globales y por mapa, XP, licencias y tiempo
  jugado; conversión de partidas v1 sin perder nada (D44). La conversión del equipo a grados queda para la entrega 6.
  24 tests nuevos (todos pasan). El juego se ve igual.
- **2026-11-18** · **Entrega 3 hecha:** las reglas de la Fase 1 ya funcionan en el juego: valor por clase, XP en
  cada captura, motivo al soltar, nivel y licencia en el HUD, licencias a la venta con Marta, avisos de
  vencimiento. 9 tests nuevos (todos pasan).
- **2026-11-18** · **Entrega 4 hecha:** reloj de 24 minutos que avanza solo, reloj en el HUD, hora del panel
  bloqueada salvo en el modo foto, hora guardada con la partida. Decidido D46 (el reloj solo se detiene con T).
  5 tests nuevos (todos pasan).
- **2026-11-18** · Decidido D47: el día de 24 min era muy corto; ahora dura 120 min (1 hora del juego = 5 min
  reales). La licencia sigue durando un día y su precio sube ×5 (básica $175, intermedia $500, avanzada $1,000).
  Medido con `npm run balance -- --solo=fase1`: mismas proporciones (básica ~$1,100 por día en la orilla, avanzada
  ~$4,900 netos en el profundo); los niveles no cambian (se miden en horas de juego).
- **2026-11-18** · **Entrega 5 hecha:** cinco spots con nombre (playa de la bahía, muelle, arrecife de la bahía,
  centro de la bahía, mar abierto); nombre al caer la boya y en el minimapa. Mismas picadas que antes. 4 tests
  nuevos (todos pasan).
- **2026-11-18** · Aprobada la tabla de la tienda nueva y decidido D48 (flotador ×1.0 en la Fase 1; conversión por
  valor con devolución). **Entrega 6 hecha:** aparejo de flotador por grados, bodega y bote; guardado versión 3.
  **La Fase 1 queda programada.** 10 tests nuevos (todos pasan).
- **2026-11-18** · Decidido D49 y programados los **perfiles de partida**: hasta 5 partidas con nombre, en la
  pantalla de inicio y en el panel (jugar, crear, borrar). 10 tests nuevos (todos pasan).
- **2026-11-18** · Decidido: la bienvenida sale solo la primera vez que se abre el juego, no en cada partida nueva
  (así funciona ya; sin cambios de código).
- **2026-11-18** · Empieza el Mapa 1. Revisado el motor (agua, peces y vegetación sirven; el terreno y la
  distribución de la isla hay que generalizarlos). Decididos D50 (prototipo jugable primero), D51 (inspirado en la
  Laguna de Tota) y D52 (lago como inicio, isla libre). Plan de 5 entregas (L1–L5) más pulido.
- **2026-11-18** · **L1 hecha:** registro de mapas; la isla es el primer mapa (`src/maps/island.js`) y todo lo
  propio de ella se lee del mapa activo. Se ve y juega idéntico. 6 tests nuevos (todos pasan).
- **2026-11-18** · Decididos D53 (portada global: partidas, mapas, progreso, ajustes), D54 (se continúa donde
  quedó; el mapa se cambia viajando) y D55 (portada como página ligera aparte, el juego en otra página). Plan de 3
  entregas (P1–P3) antes de seguir con el lago.
- **2026-11-18** · **P1 hecha:** portada propia (`index.html`) con fondo de pesca sacado del juego, Continuar y
  Partidas; el juego pasa a `juego.html` con "Menú" / "Salir al menú".
- **2026-11-18** · **P2 hecha:** pestañas Mapas (la cadena con su estado y dónde está la partida) y Progreso (nivel,
  dinero, tiempo, licencia, equipo y registro de especies con récords) en la portada.
- **2026-11-18** · **L3 hecha (prototipo):** el lago existe y se puede recorrer (`juego.html?map=lake`): cuenca con
  playa blanca, dos islas, río, bahía de lodo, centro profundo y montañas; agua en calma, sin rompiente ni ballena.
- **2026-11-18** · Anotada la referencia visual de la Playa Blanca de Tota para el pulido del lago (agua oscura,
  franja verde de los bajos, cerros redondeados, pinos y eucaliptos, cielo nublado).
- **2026-11-18** · Pulido visual del lago (primera pasada): agua de Tota con la franja verde de los bajos, cielo
  nublado de páramo, cerros redondeados, río que nace en una quebrada.
- **2026-11-18** · Mapa grande con la tecla N y minimapa que cubre todo el mapa. **L4 hecha:** las 7 especies del
  lago con modelo y sus 5 spots; ya se pesca en el lago. Decidido D56 (XP ×1.0 en los dos mapas por ahora).
