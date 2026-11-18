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
| D57 | **Viaje entre mapas desde el amarre (confirma D54):** junto al bote amarrado (en la punta del muelle o a bordo) aparece "B · Viajar en bote". Solo se puede ir a mapas **abiertos y desbloqueados por nivel**; entre los desbloqueados se va y viene libremente. **Reemplaza la "isla libre" de D52:** mientras falten los mapas 2 a 5, la isla se abre en el **nivel 10** (después volverá al 51). La nevera tiene que estar vacía (D20) | El nivel ordena la progresión sin cerrar los mapas ya ganados | 2026-11-18 |
| D58 | **Costo del viaje = un día de la licencia básica del mapa de destino:** al lago $50, a la isla $175. Bajar a un mapa fácil sale barato; subir a uno difícil, más caro | El costo sigue la escala de cada mapa | 2026-11-18 |
| D59 | **Peces con piel ilustrada, sin cambiar de motor (revisada el 2026-11-18):** cada especie lleva una **ilustración de perfil de dominio público** (U.S. Fish and Wildlife Service, muchas de Duane Raver, en Wikimedia Commons) proyectada de lado sobre el cuerpo y las aletas de nuestro modelo, en los dos costados. La anatomía de la especie (perfil, ojo, boca, aletas, cola) se ajusta a la ilustración para que encajen. El pez hecho con código queda de respaldo para las especies sin ilustración. Créditos en `public/models/fish/skins/CREDITOS.md`. **Antes se pensó en modelos GLB de Sketchfab** (la trucha Redband de E.A.Cornell, CC-BY), pero Sketchfab no deja crear cuenta por edad; se pueden añadir más adelante si alguien con cuenta los baja | Los peces hechos con código se ven de baja calidad; las ilustraciones cubren casi todas las especies de EE. UU. y el Caribe, se bajan sin cuenta y no tienen restricciones | 2026-11-18 |
| D60 | **Guía de peces de cada mapa, en el juego y en la portada:** una ficha por especie con su imagen, nombre común y científico, dónde pica (spots), a qué hora, licencia que pide, rango de tamaño y tu récord. En el juego es una pestaña del inventario; en la portada va dentro de Progreso. Las imágenes se sacan del propio juego (una por especie), así se ven igual en los dos lados y la portada sigue sin motor. **Todo visible desde el inicio**, también los peces que aún no pescaste | Hoy no hay forma de saber qué peces tiene un mapa ni cómo son | 2026-11-18 |
| D61 | **Los peces pasan a modelos 3D (GLB) como camino principal (completa D59):** la prueba con la trucha arcoíris de eb78 se ve muy superior a la ilustración (volumen real, nado animado). Cada especie usa un modelo 3D libre (CC0 / CC-BY de Sketchfab; los baja el jugador del proyecto y yo los reduzco con `tools/fish/glb_slim.py`). Un modelo sin esqueleto o sin animación también sirve: el motor lo hace nadar con la misma onda que hoy dobla a los peces. Los escaneos pesados se simplifican. **Las especies sin modelo libre conservan su piel ilustrada** (guapucha, carachi, capitán por ahora). Presupuesto: 2 a 4 MB por especie, y cada mapa carga solo sus especies, cuando se necesitan | La calidad del modelo 3D es muy superior; la ilustración queda de respaldo | 2026-11-18 |
| D62 | **La pelea profunda se adelanta y va antes que las técnicas (cambia D38):** controles de Fishing Planet (clic izquierdo recoger, Shift rápido, clic derecho tirar, mouse a los lados, rueda o +/− freno, Espacio red), el pez 3D visible en el agua con sus saltos y la red al final, y cada especie con su manera de pelear. Las técnicas (spinning, fondo, curricán) siguen en la Fase 2 y usarán esta pelea | Probando el juego, la pelea de hoy (mantener el clic y vigilar una barra) se siente muy básica; con los peces en 3D la pelea es lo que más se nota | 2026-11-18 |
| D63 | **Equipo por piezas, como en Fishing Planet (cambia D36):** caña (técnica y potencia UL a XH, con rango de sedal y de peso de señuelo), carrete (recogida, freno máximo, capacidad), sedal (resistencia y grosor), anzuelo o cabeza plomada (tamaño), carnada o señuelo, y boya o plomo según la técnica. Manda la pieza más débil; la caña se puede romper. Sin líderes, cebaderos ni boilies (D5 sigue) | Jugando, la caña de la carpa volvía trivial a la trucha: con un solo aparejo el sedal fuerte solo ayuda | 2026-11-18 |
| D64 | **El equipo pesado con un pez liviano se castiga:** pica menos (recelo de la especie ante el sedal grueso, anzuelo fuera de su rango), la carnada o el señuelo tienen que ser de los que le gustan (preferidos ×1, aceptables ×0.4, el resto ×0.05; reemplaza los pesos por técnica de D34) y una caña demasiado rígida desgarra el anzuelo en los cabezazos y saltos. Números en 7h, provisionales hasta medirlos | La trucha salía demasiado fácil con el equipo de carpa | 2026-11-18 |
| D65 | **Tres cañas armadas a la vez**, cada una con sus piezas, que se cambian con 1, 2 y 3. La tienda va por pestañas (cañas, carretes, sedales, anzuelos y boyas, carnadas, señuelos, bote y bodega, licencias) con filtro "para qué pez", ficha comparada con lo equipado y comprar y equipar | Como en Fishing Planet: llevar flotador, spinning y fondo listos | 2026-11-18 |
| D66 | **Carnadas y señuelos se gastan:** la carnada se compra por paquetes y se gasta al pescar; el señuelo se pierde si se corta el sedal | Gasto recurrente, como el combustible; corta el sedal tiene costo | 2026-11-18 |
| D67 | **Sin desgaste por ahora:** las piezas no se gastan ni se reparan; la caña solo se rompe si se pasa su límite. El desgaste queda para más adelante | Menos cosas que vigilar mientras se aprende el equipo por piezas | 2026-11-18 |
| D68 | **El equipo de la mochila se puede vender por el 50 % de lo que costó** | Corregir una compra equivocada sin que comprar y vender sea un negocio | 2026-11-18 |
| D69 | **La tienda tiene paquetes por especie** en su pestaña Principal ("Para la trucha", "Para la carpa"): todas las piezas de la caña correcta con un descuento del 15 % | Que un jugador nuevo sepa qué comprar para cada pez | 2026-11-18 |
| D70 | **Misiones de "Primeros pasos" en el lago** que enseñan a armar cada caña (flotador para la guapucha, spinning para la trucha, fondo para la carpa, pececito para la trucha café) y regalan el cebo. Se ven en pantalla mientras se pescan. Las demás misiones siguen en la Fase 4 | Como en Fishing Planet, las misiones enseñan el equipo | 2026-11-18 |
| D71 | **Pantallas al estilo de Fishing Planet:** curva de actividad de los peces por hora y especies pescadas en el mapa grande y la portada; guía con casillas por clase y cebos preferidos (completa D60); nevera con el cebo usado, la hora, peso, largo, XP y valor; en la pesca, **tres barras de carga (sedal, caña, carrete) en vez de la barra de tensión**, metros fuera / capacidad, freno como dial y la caña activa con su cebo | Lo que se vio en las capturas del jugador del proyecto | 2026-11-18 |
| D72 | **Catálogo del lago aprobado como punto de partida** (tabla en 7h, medido con `tools/balance/equipo-lago.mjs`): 5 potencias, 7 cañas, 5 carretes, 9 sedales, anzuelos, boyas, plomos, 5 carnadas y 5 señuelos. Fuerza del pez ajustada a sedales realistas y desgarre del anzuelo según la rigidez de la caña. Camino normal del lago: $1,249 con la bodega (42 % de la banda) | Con el equipo de carpa la trucha pica 4 a 6 veces menos y se desgarra si se pelea fuerte; con su caña sale siempre | 2026-11-18 |
| D73 | **Sacar un pez lleva al menos 1 minuto de pelea** con el equipo correcto y buen manejo: aguante del pez = 180 s + 4 × aguante de la especie × tamaño^0.35 (antes 3.5 × aguante × tamaño^0.35). Los típicos tardan 65–115 s y los grandes 2.5–3.5 min | Pedido del jugador del proyecto: la pelea de 11–25 s era muy corta | 2026-11-18 |
| D74 | **No toda picada engancha:** espera ×3.5 (dividida por la picada del equipo), robo de carnada en los toques (15 %), clavar en un toque espanta al pez (60 %), clavar con la boya hundida engancha el 75 % al principio de la ventana y el 55 % al final. Algo más de la mitad de las picadas terminan en pez; un pez cada 2 a 2.5 min | Pedido del jugador del proyecto: hoy toda picada clavada es un pez | 2026-11-18 |
| D75 | **La economía se conserva por hora:** con 4 a 5 veces menos peces por hora, el precio por kg y la XP de cada especie suben por su factor (pejerrey ×4.4, trucha arcoíris ×5.5, carpa ×1.7, trucha café ×3.6; el resto y los valores finales se miden en E1 con `npm run balance` puesto al día). Licencias, equipo y viaje no cambian | Sin esto el lago duraría unas 20 h en vez de 5 (D32) | 2026-11-18 |
| D76 | **Los trofeos del mar pelean de 5 a 15 minutos**, como en Fishing Planet (un pez espada único de 448 kg tardó ~12.5 min y no era el récord del jugador, de 530 kg). Se calibra con la isla y los mapas de mar; en el lago los más grandes quedan en 2.5–3.5 min (D73) | Lo vio el jugador del proyecto en su propia pelea | 2026-11-18 |
| D77 | **Avanzar el tiempo**, como en Fishing Planet: una ventana para saltar solo hacia adelante a una hora del mismo día o del siguiente, con la curva de actividad de los peces; 10 min de juego entre usos; no durante una pelea ni con el sedal en el agua; la licencia no corre con el salto; la nevera se queda. Cambia D42 (la hora se puede adelantar con esta ventana) | Con el día de 120 min, esperar el amanecer para la trucha toma casi una hora real | 2026-11-18 |
| D78 | **El dinero va casi por peso y la clase se premia en XP**, como en Fishing Planet: trofeo ×1.1 y único ×1.2 en dinero (antes ×1.5 y ×3); la XP de la clase no cambia. En la isla, el precio por kg de cada especie sube ×1.26–1.30 para que la hora rinda lo mismo | En FP un único da ×1.1 de dinero por kg y ×2.9 de XP por kg | 2026-11-18 |
| D79 | **Pez carnada:** la guapucha y el carachi que se pescan se pueden guardar como carnada viva (cubo aparte, sin ocupar la nevera); son cebo preferido de la trucha café y de la trucha arcoíris grande, y también se compran. En la isla, el pejerrey cabezón y la lisa | Como en Fishing Planet, los peces grandes comen peces; los chicos sirven para algo más que la XP | 2026-11-18 |
| D80 | **Licencias por varios días, como en Fishing Planet:** se compran por 1 día, 3 días o 1 semana de juego (tiempo jugado, D19), con descuento (3 días ×2.8, semana ×6.3 el precio de un día). La tarjeta muestra qué especies deja guardar y cuáles hay que soltar. Sin licencia ilimitada | Menos visitas al vendedor; el gasto por hora casi no cambia | 2026-11-18 |
| D81 | **Tienda en rejilla, como en Fishing Planet** (completa D65): tarjetas con imagen, nivel, cantidad del paquete, nombre, precio y Comprar; filtros a la izquierda (técnica, potencia o peso, tipo de cebo o señuelo, "para qué pez", en venta, nuevos); orden por nivel; panel del artículo con imagen grande, **para qué especies sirve**, con qué piezas es compatible, sus números comparados con lo equipado y una descripción | Lo vio el jugador del proyecto en la tienda de FP | 2026-11-18 |
| D82 | **La licencia básica del mapa de inicio (el lago) es gratis y sin vencimiento**, como en Fishing Planet. Las demás licencias del lago y todas las de los otros mapas se siguen pagando por días (D80) | El inicio del lago era lento ($55–140/h) y además se cobraba la básica desde el segundo día |  2026-11-18 |
| D83 | **Viaje rápido a los spots de orilla** desde el mapa grande (N): al hacer clic en un spot de orilla el jugador aparece en la orilla más cercana, gratis, fuera de una pelea y con el sedal recogido; el centro profundo sigue siendo en bote | Ahorra caminar sin quitar el mundo abierto (en FP se va directo a puntos fijos de orilla) | 2026-11-18 |
| D84 | **Clases de tamaño en kilos por especie en el lago** (como en Fishing Planet): cada especie tiene sus kilos de juvenil, común, trofeo y único, elegidos para que ~25 % de lo que se pesca sea juvenil, ~55 % común, ~16 % trofeo y ~4 % único (trucha arcoíris: juvenil hasta 0.35 kg, común hasta 2.5, trofeo hasta 3.6). Una trucha de 1 kg es común y se vende. La isla sigue con el porcentaje del rango. Los juveniles se siguen soltando | En FP una trucha de 0.62 kg es común; aquí era juvenil hasta 0.77 kg y se soltaba con $0 | 2026-11-18 |
| D85 | **La pelea crece con el tamaño del pez (cambia D73):** aguante = 95 s + 170 × peso^0.5 (kg reales). Con el equipo correcto y buen manejo: guapucha ~40 s, trucha de 0.3 kg ~65 s, de 1 kg ~1.5 min, de 2 kg ~2 min, de 3.5 kg ~4 min; carpa de 10 kg ~4.5 min. Los valores por hora (D75) se miden de nuevo: precio × 4.1–10.3 y XP × 2.5–9.2 según la especie | Medido en FP: una trucha joven sale en 30–50 s y una común de 1 kg en ~2–2.5 min; la diferencia de tamaño se tiene que sentir | 2026-11-18 |

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
| L2 | Viaje | Desde el amarre del bote (B): destinos y costo; vender o soltar la nevera antes de viajar (D20, D57, D58) | **Hecha** (2026-11-18) |
| L3 | Terreno del lago | Cuenca inspirada en Tota: playa de arena, laderas, una o dos islas, desembocadura, bahía de lodo, centro profundo; agua en calma; sin arrecife, rompiente ni aves marinas | **Hecha** (2026-11-18, prototipo) |
| L4 | Peces y spots del lago | Las 7 especies (D30) con anatomía básica, sus 5 spots, licencias del lago (precios ×5 por el día de 120 min, D47), multiplicador de XP | **Hecha** (2026-11-18) |
| L5 | Pueblo y arranque | Pueblo, muelle y vendedores en el lago; las partidas nuevas empiezan ahí (D52) | **Hecha** (2026-11-18) |
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

**Resuelto en L4:** el multiplicador de XP (D56).

**Entregas L2 y L5, cómo quedaron:**
- **Viaje** (`src/game/Travel.js`): cerca del bote amarrado aparece "B · Viajar en bote"; B abre el menú con los 6
  mapas: el actual ("Estás aquí"), los abiertos con su costo y "Viajar", los bloqueados con el nivel que piden y los
  planeados ("Próximamente"). Sin dinero o con pescado en la nevera, el botón se apaga y se explica por qué. Al
  pagar, el juego carga el otro mapa; el progreso viaja, las licencias y los récords son de cada mapa (la primera
  visita a un mapa regala su básica por un día).
- **Niveles de entrada** en el catálogo (`unlock`): lago 1, isla 10 (temporal, D57), los planeados 11, 21, 31 y 41.
- **Arranque:** las partidas nuevas empiezan en el lago; las que ya existían siguen donde estaban (una partida de
  antes de los mapas está en la isla). En Node los tests y el simulador siguen midiendo la isla.
- **Portada:** el lago aparece abierto; los mapas que tu nivel aún no abre muestran "Nivel N"; la partida nueva dice
  que empieza en el lago. La guía de bienvenida nombra el mapa donde abre y menciona el mapa (N). La ayuda (F1)
  incluye N y B.
- 8 tests nuevos. Probado en el navegador: el menú de viaje en la isla (nevera llena: bloqueado), viaje real al lago
  (cobra $50 y carga el lago), partida nueva creada en la portada que empieza en el lago.

**Con esto el Mapa 1 queda integrado al juego.** Pendientes del pulido: pinos, eucaliptos y frailejones; sonidos de
montaña (sin rompiente ni gaviotas de mar); bigotes del capitán; puntos rojos más visibles en la trucha café. con el lago como inicio la isla pasaría a XP ×3.05 (D32) en vez de ×1.0
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

## 7f. Peces en 3D y guía de peces (D59, D60)

**Por qué:** los peces armados con código (anillos de geometría y manchas pintadas con fórmulas) se ven de baja
calidad: sin escamas reales, sin radios en las aletas, sin la textura de una foto. El motor ya sabe cargar modelos
GLB, así que no hace falta cambiar de motor.

**Cómo se hace (D59, revisado):** cada especie usa una ilustración de perfil de dominio público (USFWS, Wikimedia
Commons) sobre fondo blanco. `tools/fish/skin_prep.py` la recorta, la endereza y la pasa a un marco fijo de 1024 × 512
(u = z + 0,5, con el hocico a la derecha; v = 0,5 − 2y); fuera de la silueta rellena con el color más cercano. El
shader la proyecta de lado sobre el cuerpo y las aletas (`src/world/fish/FishSkins.js`, una capa por especie en una
textura de varias capas) y reemplaza los colores y marcas hechos con código; el relieve de las escamas, la luz que
atraviesa las aletas y el ojo siguen siendo del motor. La anatomía de la especie en `FishSpecies.js` se mide sobre la
ilustración (perfil del cuerpo, ojo, boca, aletas y cola) para que todo encaje.

**Límites:** visto de frente o desde arriba la ilustración se estira (de lado, que es como más se ve, queda muy bien).
Las especies andinas (guapucha, capitán, carachi) probablemente no tengan ilustración del USFWS: hay que buscar otra
fuente libre o se quedan con el pez hecho con código.

**Otras fuentes:** modelos GLB de Sketchfab (CC0 / CC-BY; piden cuenta), generados con IA desde una foto o hechos en
Blender.

| Entrega | Qué | Estado |
|---|---|---|
| G1 | Guía de peces: pestaña "Peces" en el inventario y sección en Progreso de la portada, con una imagen por especie sacada del juego (con los modelos de hoy; se renuevan al llegar los GLB) | Pendiente |
| M1 | Prototipo con piel ilustrada: trucha café y carpa (ilustraciones del USFWS), anatomía ajustada a cada ilustración | **Hecha** (2026-11-18) |
| M2 | Si M1 convence: ilustraciones para las demás especies del lago (trucha arcoíris, pejerrey; guapucha, capitán y carachi si hay fuente), luego las de la isla | Pendiente |
| M3 | Prueba de modelo 3D: la trucha arcoíris "Rainbow Trout - Redband" (eb78, Sketchfab, CC-BY) en la tarjeta de captura, reducida de 22 MB a 3,4 MB (`tools/fish/glb_slim.py`); se apaga con `?fishglb=0` para comparar. Comparación en `docs/comparacion-trucha.png` | **Hecha** (2026-11-18): aprobada, ver D61 |
| M4 | Modelo 3D en la tarjeta de captura: aletas con su color (el brillo metálico limitado), escaneos con luz propia, carpa (escaneo CC0 de ffish.asia, 4,7 MB) además de la trucha (2,1 MB); `glb_slim.py` deja solo el pez que se dibuja. **Pasa a la M5:** el nado con la onda del motor para modelos sin animación (todavía no hay ninguno) | **Hecha** (2026-11-18) |
| M5 | Modelos 3D en el agua: los peces que nadan usan el modelo en pose de reposo, doblado por la onda del motor (sin esqueleto: cientos de peces a la vez), con 4 niveles de detalle hechos al cargar (agrupando vértices). **El lago tiene sus propios peces nadando** (antes nadaban los tropicales de la isla): guapuchas y carachis en la orilla, pejerreyes en el muelle y en aguas abiertas, truchas en la desembocadura y en lo hondo, carpas en la bahía de lodo, capitanes en el fondo (`maps/lake.js` swimmers; 891 peces repartidos por todo el lago: 500 guapuchas, 192 pejerreyes, 107 carachis, 41 carpas, 29 truchas arcoíris, 12 capitanes, 10 truchas café). La isla no cambia | **Hecha** (2026-11-18) |
| M6 | Modelos para el resto del lago (lista de candidatos abajo) | Pendiente |
| M7 | Modelos para la isla | Pendiente |
| A1 | Aparejos que se vean distintos: hoy hay una sola caña 3D (hecha por código, detallada: carrete animado, pasahilos, la caña se dobla) para los 7 grados de flotador. Cada grado con su caña, carrete y boya; en la Fase 2, señuelos, plomos y anzuelos por técnica | Pendiente (después de los peces) |

**Modelos del lago (todos en 3D en la tarjeta de captura):** sin modelo libre de la especie exacta se usa un
**doble** parecido; la tarjeta sigue mostrando el nombre y el nombre científico de la especie del juego.

| Especie | Modelo | Tamaño |
|---|---|---|
| Trucha arcoíris | Rainbow Trout - Redband (eb78, CC-BY), animado | 2,1 MB |
| Trucha café | Doble: yamame (ffish.asia, CC0), escaneo animado | 2,4 MB |
| Carpa | Carp (ffish.asia, CC0), escaneo animado, simplificado a 16 mil triángulos | 2,7 MB |
| Pejerrey | Doble: lisa, *Mugil cephalus* (ffish.asia, CC0), escaneo fijo, simplificado a 33 mil triángulos; plateado y con dos dorsales | 3,0 MB |
| Capitán | Doble: locha japonesa (ffish.asia, CC0), escaneo animado | 2,2 MB |
| Guapucha | Doble: Amur minnow (ffish.asia, CC0), escaneo animado | 2,6 MB |
| Carachi | Doble: medaka (ffish.asia, CC0), escaneo animado | 1,7 MB |

Se descartó el Brook Silverside (MTSU): es un ejemplar de museo conservado, café y con las aletas maltratadas.
Los escaneos pesados se simplifican con gltf-transform (dependencia de desarrollo; pasos en `tools/fish/glb_slim.py`). Total del lago: ~17 MB.

## 7g. Pelea nueva (D62)

**Hoy:** se mantiene el clic para recoger; una barra de tensión con una zona verde; el pez da tirones cada pocos
segundos; si la tensión pasa del límite medio segundo, se corta; si queda flojo mucho rato, se suelta. El pez no se ve.

**Controles: los de Fishing Planet** (pedido del jugador del proyecto; revisados en guías y foros, no hay lista
oficial):

| Control | Qué hace |
|---|---|
| Clic izquierdo mantenido | Recoger hilo |
| Shift + clic izquierdo | Recoger rápido (cansa menos al pez y sube la tensión) |
| Clic derecho mantenido | Tirar: levantar la caña, más presión sobre el pez. Bombear: levantar con el clic derecho, bajar recogiendo |
| Mover el mouse a izquierda / derecha | Mover la caña hacia un lado: contra la carrera del pez lo cansa rápido; hacia el mismo lado casi no |
| Rueda del mouse, o + / − | Apretar o aflojar el freno (10 posiciones) |
| Espacio | Sacar el pez con la red, cuando está cerca y cansado |

**La pelea nueva** (lo físico en `CatchMinigame.js`, se puede probar sin el navegador):

- **Freno del carrete:** si el pez tira más fuerte que el freno, el carrete suelta hilo, con su clic, en vez de
  romperse. Freno muy apretado: se corta en la carrera. Muy flojo: el pez se lleva el hilo del carrete (hay un largo
  máximo, según el aparejo) o se suelta. El hilo se rompe por encima de su resistencia (la del aparejo de la tienda:
  7 a 50 kg), así que **el grado del aparejo por fin importa**.
- **Recoger** acerca el pez solo cuando no está corriendo más fuerte que el freno.
- **Saltos:** las especies que saltan (truchas) salen del agua; hay que **soltar el clic derecho** (bajar la caña);
  con la caña arriba y el hilo tenso durante el salto, el anzuelo puede soltarse.
- **Cada especie pelea distinto** (datos en `FishTable.js`): fuerza, aguante, rapidez de las carreras, si salta, si
  busca el fondo o la vegetación (la carpa: si llega, el hilo se enreda y se corta), si casi no pelea (guapucha).
- **El cansancio del pez es claro y estable** (en Fishing Planet los jugadores se quejan de que a veces se cansa y a
  veces no): se cansa más con presión (caña arriba, caña contra la carrera, tensión alta sin romper).
- **El pez se ve** al final del hilo: su modelo 3D nada bajo la superficie, hace olas y espuma en las carreras,
  salta; al final se acerca y se saca con la red.
- **Pantalla:** tensión del hilo con la marca del freno, hilo que queda en el carrete, posición del freno, hacia
  dónde corre el pez. Sonidos del freno y del carrete.

| Entrega | Qué | Estado |
|---|---|---|
| P1 | Motor de la pelea: freno (rueda / + −, 10 posiciones hasta el 95 % del sedal, también entre peleas), recoger y recoger rápido (Shift), tirar (clic derecho), la caña sigue la vista (contra la carrera cansa más), saltos (soltar el clic derecho), fondo con enredo (carpa, trucha café, mero, pargo), estilo por especie (`FishTable.js` STYLES), capacidad del carrete según el sedal (120 a 270 m); la boya sigue al pez y salta con él; pantalla nueva (tensión con la marca del freno, freno, hilo, hacia dónde corre, avisos); mensajes que explican por qué se perdió; `tools/balance/fight.mjs` simula peleas; tests | **Hecha** (2026-11-18) |
| P2 | El pez 3D visible en el agua durante la pelea: carreras, olas y espuma, saltos | Pendiente |
| P3 | La red para sacarlo y los sonidos (clic del freno, carrete); ajuste fino de cada especie | Pendiente |

## 7h. Equipo por piezas, carnadas, señuelos y tienda nueva (aprobada, D63–D66, 2026-11-18)

**Lo que se vio jugando:** hay un solo aparejo (el de flotador por grados) para todo. La caña que sirve para la
carpa es la misma que se usa con la trucha, y nada castiga usar equipo pesado con un pez liviano. Medido con la
pelea P1 (jugador simulado "bueno", 60 peleas):

| Pez | Sedal 7 kg | 13 kg | 26 kg | 50 kg |
|---|---|---|---|---|
| Trucha arcoíris 3.5 kg | 100 %, 14 s | 100 %, 10 s | 100 %, 10 s | 100 %, 9 s |
| Trucha café 4 kg | 100 %, 26 s | 100 %, 12 s | 100 %, 10 s | 100 %, 10 s |
| Carpa 10 kg | 45 %, 223 s | 100 %, 51 s | 100 %, 17 s | 100 %, 13 s |

Con el equipo de carpa, la trucha deja de ser una pelea. Además, carnadas y señuelos no existen todavía (la sección 5
los dejaba para la Fase 2).

**Idea central (como en Fishing Planet):** el equipo se arma por piezas y **cada pez pide su equipo**. Usar equipo
pesado con un pez liviano tiene tres costos: **pica menos** (ve el sedal grueso, el anzuelo grande no le cabe en la
boca), **el anzuelo se desgarra** (una caña rígida no amortigua los saltos ni los cabezazos) y **la carnada o el
señuelo equivocados casi no le interesan**. Usar equipo liviano con un pez grande se paga cortando el sedal o
rompiendo la caña.

### Las piezas

| Pieza | Qué decide | Ejemplo |
|---|---|---|
| **Caña** | Técnica (flotador, spinning, fondo; casting y curricán más adelante), **potencia** y largo de lance. La potencia fija el rango de sedal y de peso de señuelo que aguanta | Spinning ligera (L), 2–7 g, sedal 2–5 kg |
| **Carrete** | Velocidad de recogida, freno máximo, capacidad de hilo | Carrete 2000: 0.8 m/s, freno 4 kg, 150 m |
| **Sedal** | Resistencia (kg) y grosor; el grosor espanta a los peces recelosos | Monofilamento 0.18 mm, 3.5 kg |
| **Anzuelo** (o cabeza plomada para los plásticos) | Tamaño: tiene que caber en la boca del pez | #12 para guapucha, #6 para trucha, #2 para carpa |
| **Carnada o señuelo** | Qué peces se interesan | Lombriz, maíz, cucharilla |
| **Flotador o plomo** | Según la técnica: boya para el flotador, plomo para el fondo | Boya de 2 g, plomo de 20 g |

Sin líderes, sin anzuelos de pelo, sin cebaderos ni boilies: esa parte de D5 sigue en pie.

**Potencias de caña:** ultraligera (UL), ligera (L), media-ligera (ML), media (M), media-pesada (MH), pesada (H) y
extrapesada (XH). En el lago solo hacen falta UL a MH.

**Manda la pieza más débil:** el sedal se corta por encima de su resistencia; el freno no puede pasar el máximo del
carrete; si la tensión pasa el máximo de la caña, **la caña se rompe** (hay que comprar otra).

### Cómo castiga el equipo equivocado (números provisionales, se miden con `tools/balance/fight.mjs`)

1. **Recelo del pez:** cada especie tiene un recelo de 0 a 1 (trucha 0.8, pejerrey 0.5, carpa 0.4, guapucha 0.2).
   Un sedal más grueso que el ideal del pez baja la picada: ×1 si es el ideal, hasta ×0.25 si es mucho más grueso,
   según el recelo.
2. **Anzuelo:** cada especie tiene un rango de anzuelos. Dentro del rango, picada normal. Un número más grande:
   ×0.4 y la mitad de las picadas se escapan al clavar. Más pequeño: pica bien, pero se suelta más en la pelea.
3. **Carnada o señuelo:** cada especie tiene preferidos (×1), aceptables (×0.4) y el resto (×0.05). Reemplaza el
   peso por técnica de D34: la técnica se elige al elegir la caña y el cebo.
4. **Caña rígida contra pez liviano (lo que arregla la trucha):** la caña amortigua los tirones. Si el pez pesa
   menos que el mínimo de la potencia de la caña, los cabezazos y los saltos pueden **desgarrar el anzuelo** (más
   en especies de boca blanda o que saltan, como la trucha). Si pesa más que el máximo, se dobla demasiado y se
   puede romper.
5. **Peso del señuelo fuera del rango de la caña:** lance más corto (muy liviano) o caña en riesgo (muy pesado).

### Carnadas y señuelos del lago

**Carnadas** (se compran por paquetes, se gastan al pescar y al perder el pez): larva, lombriz, maíz, masa de pan,
pellet de trucha. **Señuelos** (se compran una vez y se pierden si se corta el sedal): cucharilla giratoria
pequeña y mediana, cucharilla ondulante, pececito (crankbait pequeño), plástico blando con cabeza plomada.

| Especie | Preferidos | Aceptables | Anzuelo | Potencia ideal |
|---|---|---|---|---|
| Guapucha | Larva, masa de pan | Lombriz | #14–#10 | UL |
| Carachi | Larva, lombriz | Masa de pan | #12–#8 | UL–L |
| Pejerrey | Larva, cucharilla pequeña | Lombriz | #10–#6 | UL–L |
| Capitán de la sabana | Lombriz (fondo, de noche) | Larva | #8–#4 | L–ML |
| Trucha arcoíris | Cucharilla giratoria pequeña y mediana, huevas de trucha artificiales, saltamontes | Lombriz, larvas, cucharilla ondulante, plástico blando, pellet, maíz | #8–#4 | L–ML |
| Carpa común | Maíz, masa de pan, pellet | Lombriz | #6–#1 | M–MH |
| Trucha café | Pececito, cucharilla ondulante | Lombriz (de noche), plástico blando, saltamontes | #6–#2 | ML–M |

### La tienda (al estilo de Fishing Planet)

- **Pestañas por categoría:** Cañas · Carretes · Sedales · Anzuelos y boyas · Carnadas · Señuelos · Bote y bodega ·
  Licencias.
- **Filtro "para qué pez"** y por técnica: al elegir la trucha, la tienda marca qué cañas, sedales, anzuelos y
  cebos le sirven.
- **Ficha de cada artículo:** sus números comparados con lo que tienes equipado (más / menos), las especies para las
  que sirve, nivel mínimo y precio. Los bloqueados por nivel se ven con candado.
- **Comprar y equipar** en un paso.
- **Cañas armadas:** se pueden tener varias cañas armadas a la vez (cada una con su carrete, sedal, anzuelo y cebo)
  y cambiar entre ellas con 1, 2 y 3. Así se puede llevar una de flotador para la carpa y una de spinning para la
  trucha.
- **Inventario** con una pestaña de equipo para armar y desarmar cañas.

### Referencia: el inventario de Fishing Planet (captura del jugador del proyecto, 2026-11-18)

La pantalla de inventario de FP tiene tres columnas bajo las pestañas generales (Mapa, Inventario, Tienda…):

| Zona | Qué muestra en FP | Lo que adoptamos |
|---|---|---|
| Fila de arriba | Personaje, bote y los soportes de caña 1 a 7; el número va en color según el estado (verde lista, rojo incompleta o rota) | **Sí**, con 3 soportes (D65): 1, 2, 3 en verde si la caña está completa, en rojo si le falta una pieza o está rota |
| Columna izquierda | Las piezas de la caña elegida, una por fila (caña, carrete, sedal, líder, cebo); la caña con su ficha: tipo, longitud, peso de cebo (g), peso del hilo (kg), potencia, acción, partes, anillas, durabilidad | **Sí**: caña, carrete, sedal, anzuelo, cebo y boya o plomo. Ficha de la caña con tipo, largo, peso de cebo, rango de sedal, potencia y durabilidad. Sin acción, partes ni anillas |
| Centro | La caña armada dibujada en vertical, cada pieza en su lugar con su ranura (clic para cambiarla), metros de sedal que quedan en el carrete (367) e ícono de llave para reparar | **Sí**: la caña armada con sus ranuras y los metros que quedan. La llave solo si se aprueba el desgaste |
| Columna derecha | Mochila, Especiales, Licencias, Almacén de pescado. Barra de íconos por categoría (todo, cañas, carretes, sedales, anzuelos, carnadas, señuelos…) y árbol plegable (Líneas y líderes → Líneas de mar → Fluorocarbono de mar). Cada fila: imagen, nombre, datos (largo, resistencia, diámetro, color), valor, info y vender o tirar. Buscador | **Sí**: Mochila (lo que tienes), Licencias y Nevera. Barra de íconos y árbol por categoría y técnica, filas con imagen, nombre, datos clave, info y vender. Sin buscador al principio (el catálogo del lago es corto) |

**Inventario ≠ tienda:** en FP lo que compras va a la mochila y desde allí se arma la caña. La tienda usa el mismo
diseño de filas y categorías, con precio y "comprar" en vez de "vender".

**Lo que no adoptamos:** moneda premium (las monedas de oro), clubes, líderes, color del sedal, acción de la caña.

### Referencia: el resto de Fishing Planet (capturas del jugador del proyecto, 2026-11-18)

| Pantalla de FP | Qué tiene | Lo que adoptamos |
|---|---|---|
| **Mapa** | Panel izquierdo: tarjeta del lugar (nombre, hora, "Día 5/5" de la licencia), **actividad de los peces por hora** (curva de 05 a 21), temperatura del aire y del agua, viento, especies pescadas (36/85 con barra), licencia activa con su vencimiento y "Vamos a pescar" | **Sí, en el mapa grande (N) y en la portada:** curva de actividad por hora (sale de `time` de cada especie), especies pescadas del mapa (x/7 con barra) y licencia con lo que le queda. Sin clima por ahora |
| **Guía de especies** | Lista con imagen y tres casillas por clase (común, trofeo, único: marcadas si ya la pescaste); ficha con descripción, **cebos preferidos y señuelos preferidos**, botón 3D | **Sí, completa D60:** casillas por clase de tamaño y, en la ficha, los cebos preferidos y aceptables de 7h. Así el jugador sabe qué comprar |
| **Tienda** | Subpestañas: Principal (portada con **paquetes por tema**: "Maníaco del curricán", "Maestro del jigging"), Cañas, Carretes, Hilo, Equipo, Aparejos, Señuelos, Cebos, Engodo, Barcos, Licencias, Servicios. Fila de marcas | **Sí:** pestaña Principal con **paquetes por especie** ("Para la trucha": caña, carrete, sedal, anzuelos y cucharillas a un precio con descuento). Las pestañas de 7h. Sin engodo ni marcas (las marcas son inventadas, sin parecerse a reales) |
| **Misiones** | Categorías (Diarias, Comenzando, De aventura, Explorador, Maestría, Colecciones, Peces monstruo). Cada misión **enseña a armar un equipo**: "monte un feeder con resistencia mínima de 1.5 kg, plomada y anzuelo #8", "capture la carpa con ese equipo"; recompensa en dinero y un artículo | **Sí, una parte ya:** misiones de "Primeros pasos" en el lago que enseñan a armar cada caña (flotador para la guapucha, spinning para la trucha, fondo para la carpa) y regalan el cebo. El resto de las misiones sigue en la Fase 4 |
| **Inventario: personaje** | Ropa (gorra, lentes, chaqueta), linterna de cabeza, carro de aparejos, soporte de cañas, bote y su almacén. Abajo, **límites de la mochila**: peces 0/160, cañas 4/9, sedales 34/59, aparejos 218/459 | **No por ahora:** sin ropa ni carro. La linterna de cabeza puede volver para la noche. Sin límites de mochila (el catálogo es corto) |
| **Almacén de pescado (nevera)** | Peso máximo por pez, peso total / capacidad, cantidad y valor total. Cada pez: nombre con su clase (joven, trofeo), **el cebo con el que se pescó**, la hora (mañana, madrugada), el clima, peso y largo, XP y dinero | **Sí:** la nevera muestra por pez su clase, el cebo usado, la hora, peso, largo, XP y valor; arriba, peso total / capacidad y valor total |

### Referencia: la pantalla de pesca de Fishing Planet (captura del jugador del proyecto, 2026-11-18)

| Zona | Qué tiene en FP | Lo que adoptamos |
|---|---|---|
| Arriba a la izquierda | Nivel, hora y día de la licencia, clima, el bote con la carga del almacén (971/3000 kg) y el peso máximo por pez, "F1 para ayuda" | **Sí:** nivel, hora, licencia y nevera (kg / capacidad). Ya existe casi todo; se agrega el peso máximo por pez si lo trae la bodega |
| Izquierda, al medio | La misión que se sigue, con su tarea pendiente | **Sí**, con las misiones de "Primeros pasos" |
| Arriba a la derecha | **La caña activa (número 3 en un círculo)** con el señuelo y la carnada dibujados y sus nombres; debajo, la boya | **Sí:** número de la caña (1, 2, 3), cebo con su nombre y cantidad que queda, y boya o plomo |
| Derecha | **Tres barras verticales de carga: sedal, caña y carrete**, con su ícono debajo y el estado de cada pieza (57 %, 66 %, 75 %) | **Sí, reemplaza la barra de tensión única de P1:** cada barra se llena con la carga sobre esa pieza respecto a su límite; la más llena es la que va a fallar (la pieza más débil manda, D63). El porcentaje de estado solo si se aprueba el desgaste |
| Abajo a la derecha | **Metros de sedal fuera / sedal en el carrete** en números grandes (110 / 367 m) y un dial del freno | **Sí:** metros fuera / capacidad del carrete y el freno como dial (hoy es un número) |
| Durante la pelea (segunda captura) | Las tres barras se llenan **por segmentos con colores de azul a verde, amarillo, naranja y rojo**: en la captura el sedal y la caña van a media carga (verde) y el carrete casi lleno (amarillo y naranja: el freno está soltando hilo). La caña se ve doblada. El jugador del proyecto enganchó ese pez hacía 3 min 40 s y la pelea seguía | **Sí:** barras por segmentos con ese degradado; la del carrete se llena cuando el freno suelta hilo, así se ve cuándo aflojar o apretar. La caña 3D se dobla con la carga (ya lo hace). Confirma D73: los peces grandes pelean varios minutos |
| La misma pelea, 3 min después (tercera captura) | Según la hora del chat, pasaron 3 min 11 s reales (más de 7 min de pelea en total) y **el pez había sacado más hilo** (de 100 a 143 m de 367). Caña levantada (tirando), las tres barras a media carga. **El estado del sedal y del carrete bajó un punto durante la pelea** (57 → 56 %, 75 → 74 %): el desgaste corre mientras se pelea | Un pez grande puede **ganar hilo** aunque lleve minutos peleando: la pelea tiene idas y vueltas, no solo recoger. El desgaste queda fuera por ahora (D67); si se agrega, se gasta peleando |
| La misma pelea, 4 min después (cuarta captura) | Unos 11 min de pelea en total. **El pez ya está cerca: 32 m de 367.** El carrete vuelve a naranja (el pez tira cerca del final y el freno suelta) y la caña se dobla mucho. El estado siguió bajando: sedal 56 → 54 %, caña 65 → 63 %, carrete 74 → 73 % | **El final de la pelea también tiene carreras:** el pez cansado todavía tira cerca del bote. Nuestra pelea ya lo hace (un pez que no está cansado al llegar cerca hace otra carrera) |
| La captura (quinta captura) | **Pez espada único de 448 kg, sacado tras ~12.5 min de pelea** (enganchado hacia las 15:36 según el chat, sacado a las 15:48:45). Tarjeta: el personaje sostiene el pez en tercera persona sobre la cubierta; nombre con la clase en color ("Pez espada Único"), peso, largo y dinero; **XP ganada con la barra de nivel que se llena** y una tecla para ver los modificadores de XP; botones **Liberar el pez** y **Llevar consigo**; aviso del modo foto; el chat anuncia la captura | **Sí:** la tarjeta de captura (ya existe, con el pez 3D) suma la clase en color, la barra de nivel que se llena con la XP ganada y el **desglose de la XP** (clase, primera captura de la especie, licencia). Liberar / guardar ya existe. Atajo al modo foto desde la tarjeta. Sin chat (no hay multijugador) |
| Siguiente pez (séptima captura) | Sacado el pez espada a las 15:48:45, **el siguiente picó a las 15:53: unos 4 min entre un pez y el siguiente** (tarjeta, volver a armar, curricán y espera). La bodega pasó de 971 a 1,419 kg (el pez espada de 448 kg). Otra pelea larga, con 78 m fuera y el carrete en naranja | Referencia de ritmo para el mar (D74, D76): unos 4 min hasta la siguiente picada más 10 o más min de pelea, o sea **pocos peces grandes por hora**. En el lago (D74) un pez cada 2 a 2.5 min |
| Segundo pez espada (octava captura) | **Pez espada común de 199 kg, ~7 min de pelea** (picó a las 15:53, sacado a las 15:59:48). $74,320 y 20,813 XP. Comparado con el único de 448 kg ($182,942 y 136,391 XP): **el dinero va casi en proporción al peso** ($373/kg el común, $408/kg el único: ×1.1) y **la XP premia mucho la clase** (104 XP/kg el común, 304 XP/kg el único: ×2.9 por kg, ×6.5 en total). El estado del equipo bajó otros 2 puntos por pieza | **Por decidir:** nuestro juego hace lo contrario en dinero (el único vale ×3 por kg, el trofeo ×1.5; `Progression.js` SIZE_CLASSES). Se podría acercar a FP: dinero casi por peso (único ×1.2) y la clase premiada sobre todo en XP. Se revisa con los valores por hora de E2 (D75) |
| Avanzar el tiempo (novena captura) | Ventana para saltar a otra hora: se elige la hora con flechas (23:00) y muestra **el clima a esa hora y la actividad de los peces** en tres tramos (noche 5, día 6, noche 6) con curvas de color; botones **Avanzar el tiempo**, **Día siguiente** y Cancelar. Tiene **espera entre usos** ("Se podrá tener acceso dentro de 07:58"). Aviso: al pasar al día siguiente **se venden todos los peces** de la nevera | **Propuesta D77** (abajo) |
| Guía: los cebos (décima captura) | Ficha del marlín negro: clases con casilla, **incluida "Joven"** (joven, común, trofeo, único); descripción real de la especie; **"Cebos preferidos"** (cebos naturales: peces carnada como mújol, pez volador, sardina, anchoa, jurel, y calamar) y **"Señuelos preferidos"** (plugs, pulpos y faldas de curricán, cadena de calamares) por separado, en grupos de 2 o 3 por renglón. Solo muestra los preferidos | **Sí:** la guía separa cebos y señuelos preferidos, en grupos, y suma la casilla de la clase juvenil. Solo se muestran los preferidos; los aceptables los descubre el jugador. **Propuesta D79:** pez carnada (abajo) |
| Globo (captura 11) | Elegir destino en un globo terráqueo con un marcador por lugar (con el clima de ahora). Panel: lugar y **nivel que pide**, actividad de los peces de hoy y **pronóstico de los próximos días** (temperatura e ícono por día), especies pescadas, licencia, **gastos de viaje** con selector de días de estadía | **Parcial:** nuestro viaje es en bote desde el amarre (D57). El panel del destino suma nivel que pide, especies pescadas y la curva de actividad (D71). Sin clima ni días de estadía por ahora |
| Tienda: cebos (captura 12) | **Rejilla de tarjetas** (imagen, nivel que pide, cantidad del paquete "x50", nombre, precio, botón Comprar). **Filtros a la izquierda:** en venta, nuevos; peso (ligero a extra pesado); tipo (cebos comunes, insectos y gusanos, frescos, pellets, de mar, de curricán). Buscador y **orden "nivel más bajo primero"**. **Panel derecho del artículo:** imagen grande, **"Pez:" para qué especies sirve**, peso, botón **"Compatible: equipos"** y descripción | **Sí, D81** |
| Tienda: licencias (capturas 13 y 14) | Menú de licencias por región (Norteamérica, Europa, Sudamérica, África, Asia). Tarjeta por licencia (básica, avanzada) con **precio por duración: 1 día, 3 días, semana, mes** (más días, más barato el día: 3 días ×2.84, semana ×6.3, mes ×24) y nivel que pide. Panel: arte de la licencia, **reglas** (pesca nocturna, pesca en barco: permitida o no) y qué peces hay que soltar o se pueden guardar | **Sí, D80** (sin la ilimitada, que es de pago real) |
| Perfil (sexta captura) | Resultado: XP total, lo que falta para el siguiente nivel, peces capturados por clase (común 1,954, trofeo 377, único 65). **Récord por especie** con su modelo 3D, lugar, fecha, peso, largo y **el cebo con que se pescó** (el pez espada récord pesó 530 kg; el de 448 kg de la pelea no fue el más grande). **Retos** con insignia por niveles (I, II, III): pescar cierto número de peces con aparejos de flotador, con señuelos, con anzuelos sin rebaba | **Sí:** el registro de la portada (ya tiene récords) suma el cebo del récord, la fecha y el conteo por clase. Los retos van con las misiones (Fase 4) y premian usar cada técnica |
| Centro | Brújula arriba; la caña en primera persona con las manos en el carrete y los portacañas del bote | La brújula y la caña ya existen. Las manos y los portacañas quedan para A1 |

### Catálogo del lago (medido, D72, 2026-11-18)

Script: `node --no-warnings tools/balance/equipo-lago.mjs` (pelea real de P1 con el modelo nuevo encima; 60 peleas
por casilla). Números provisionales hasta probarlos jugando.

**Potencias** (la rigidez es cuánto del tirón llega al anzuelo; la caña se rompe por encima de 1.25 × el máximo de
su sedal):

| Potencia | Sedal | Cebo | Rigidez |
|---|---|---|---|
| Ultraligera (UL) | 1–3 kg | 1–5 g | 0.2 |
| Ligera (L) | 2–5 kg | 3–12 g | 0.35 |
| Media-ligera (ML) | 3–7 kg | 5–20 g | 0.5 |
| Media (M) | 5–10 kg | 10–40 g | 0.65 |
| Media-pesada (MH) | 7–14 kg | 20–80 g | 0.8 |

**Cañas**

| Caña | Técnica | Potencia | Lance | Precio | Nivel |
|---|---|---|---|---|---|
| Telescópica 3 m | Flotador | UL | 18 m | Inicial | 1 |
| Telescópica 4 m | Flotador | L | 22 m | $60 | 2 |
| Spinning 1.8 m | Spinning | UL | 24 m | $70 | 2 |
| Spinning 2.1 m | Spinning | L | 30 m | $120 | 3 |
| Spinning 2.4 m | Spinning | ML | 34 m | $150 | 5 |
| Fondo 3 m | Fondo | M | 40 m | $130 | 4 |
| Fondo 3.6 m | Fondo | MH | 45 m | $220 | 7 |

**Carretes** (capacidad en metros de sedal de 0.25 mm; con otro grosor cambia según el área)

| Carrete | Recogida | Freno máximo | Capacidad | Precio | Nivel |
|---|---|---|---|---|---|
| 1000 | 0.9 m/s | 3 kg | 120 m | Inicial | 1 |
| 2000 | 1.0 m/s | 4 kg | 150 m | $50 | 2 |
| 2500 | 1.1 m/s | 6 kg | 180 m | $90 | 3 |
| 3000 | 1.2 m/s | 8 kg | 200 m | $110 | 5 |
| De fondo 4000 | 1.3 m/s | 12 kg | 250 m | $150 | 6 |

**Sedales** (bobina de 150 m): monofilamento 0.12 mm 1.5 kg $8 · 0.16 mm 2.5 kg inicial · 0.20 mm 3.5 kg $12 ·
0.25 mm 5 kg $15 · 0.30 mm 7 kg $18 · 0.35 mm 9 kg $22 · 0.40 mm 12 kg $26. Fluorocarbono (se ve como un sedal
35 % más fino, para la trucha): 0.18 mm 3 kg $30 (nivel 4) · 0.22 mm 4.5 kg $36 (nivel 5).

**Anzuelos** (sobre de 10): #14, #12, #10 $3 · #8, #6 $4 · #4, #2 $5 · #1 $6. **Boyas** (sobre de 5): 1, 3 y 6 g, $2
a $4. **Plomos** (sobre de 5): 20, 40 y 60 g, $2 a $4. Se pierden con el sedal.

**Carnadas** (una por picada): larvas 30 por $4 · lombrices 20 por $5 · maíz 40 por $3 (nivel 2) · masa de pan 25 por
$3 · pellet de trucha 30 por $6 (nivel 3) · saltamontes 20 por $6 (nivel 2) · huevas de trucha artificiales 30 por $7 (nivel 3).
**Señuelos** (por unidad, se pierden al cortar): cucharilla giratoria #1
3 g $8 (nivel 2) · #2 6 g $10 (nivel 3) · ondulante 8 g $10 (nivel 4) · plástico blando con cabeza 5 g $6 (nivel 4) ·
pececito 5 cm 6 g $14 (nivel 5).

**Equipo inicial (regalado):** telescópica 3 m UL, carrete 1000, monofilamento 0.16 mm, anzuelos #12, boyas de 3 g,
30 larvas y una lata de lombrices.

**Modelo medido:**
- **Picada** = sedal × cebo × anzuelo. Sedal: ×1 hasta el grosor ideal de la especie; más grueso baja según su
  recelo (mínimo ×0.25). Cebo: preferido ×1, aceptable ×0.4, otro ×0.05. Anzuelo más grande que su rango: ×0.2
  (pica menos y la mitad se escapa al clavar).
- **Fuerza del pez** con sedales realistas: peso × (0.25 + 0.6 × fuerza de la especie) + 0.05 kg (la de P1 estaba
  pensada para sedales de 7 a 50 kg).
- **Lo que llega al anzuelo** = (tirón del pez + resistencia del agua al recoger + lo que agrega levantar la caña,
  que crece con su potencia pero nunca pasa el tirón del pez) × (0.55 + 0.9 × rigidez), ×1.5 en los saltos. Si pasa lo que aguanta la boca del pez
  (boca × peso^0.6; trucha 1.5, carpa 2.4), el anzuelo se desgarra. **Cambio para E2:** la carga fija de recoger de
  P1 (17 % del sedal) deja de crecer con el sedal.

**Picada de cada equipo** (multiplicador):

| Equipo | Guapucha | Carachi | Pejerrey | Capitán | Trucha arcoíris | Carpa | Trucha café |
|---|---|---|---|---|---|---|---|
| Flotador UL, 0.16, #12, larvas (inicial) | 0.90 | 0.94 | 1.00 | 0.40 | 0.40 | 0.05 | 0.05 |
| Spinning L, flúor 0.18, cucharilla #2 | 0.01 | 0.01 | 0.40 | 0.05 | **1.00** | 0.05 | 0.40 |
| Spinning ML, flúor 0.22, pececito | 0.01 | 0.01 | 0.01 | 0.05 | 0.05 | 0.05 | **1.00** |
| Fondo M, 0.30, #4, maíz | 0.01 | 0.00 | 0.00 | 0.05 | 0.16 | **1.00** | 0.03 |
| Fondo MH, 0.40, #2, maíz | 0.00 | 0.00 | 0.00 | 0.01 | 0.02 | 0.80 | 0.01 |
| Fondo MH, 0.40, cucharilla #2 | 0.00 | 0.00 | 0.02 | 0.04 | 0.25 | 0.04 | 0.10 |

**Pelea** con el aguante de D73 (% sacados y tiempo medio; jugador "bueno" que aprieta el freno y levanta la caña /
jugador "suave" con freno 3 y la caña abajo; "tiempo" = pasó de 4 min):

| Pez | Flotador UL | Spinning L | Spinning ML | Fondo M | Fondo MH |
|---|---|---|---|---|---|
| Guapucha, pejerrey, capitán | 100 %, 64–75 s | 100 %, 64–72 s | 100 %, 64–72 s | 100 %, 63–70 s | 100 %, 63–70 s |
| Trucha arcoíris 1.5 kg | 100 % 72 s / 100 % 157 s | 100 % 69 s / 100 % 119 s | 100 % 68 s / 100 % 87 s | 100 % 67 s / 100 % 70 s | 72 % (desgarre) / 100 % |
| Trucha arcoíris 3.5 kg | 100 % 169 s / 0 % (tiempo) | 100 % 118 s / 0 % (tiempo) | 100 % 78 s / 93 % 207 s | 62 % (desgarre) / 100 % 115 s | 65 % / 8 % (desgarre) |
| Trucha café 4 kg | 0 % (tiempo) | 98 % 210 s / 0 % (tiempo) | 100 % 98 s / 0 % (tiempo) | 28 % (desgarre) / 100 % 159 s | 23 % / 0 % (desgarre) |
| Carpa 3 kg | 100 % 171 s / 0 % (tiempo) | 100 % 117 s / 0 % (tiempo) | 100 % 79 s / 92 % 214 s | 100 % 71 s / 100 % 114 s | 100 % 70 s / 100 % 85 s |
| Carpa 10 kg | 0 % (sedal) | 0 % (sedal) | 0 % (tiempo) | 48 % 224 s (tiempo) | 100 % 95 s |

**Hallazgos:**
- **La trucha ya no es trivial con el equipo de carpa:** pica de 4 a 6 veces menos (×0.16 con la caña de fondo M,
  ×0.02–0.25 con la MH) y **ya no sale más rápido**: la pelea dura lo mismo que con su caña, y con la MH el anzuelo se
  desgarra en una de cada tres si se pelea fuerte. Con su caña (spinning L o ML) sale siempre.
- **El equipo liviano saca peces grandes, pero tarda y exige buena técnica:** la trucha de 3.5 kg con la telescópica,
  casi 3 min; con freno flojo y la caña abajo no se cansa nunca. No puede con la carpa de 10 kg (corta el sedal).
- **La carpa grande pide la caña de fondo MH:** con la M, la mitad de las de 10 kg se pasan de 4 min.
- **Precios:** el camino normal del lago (spinning L para la trucha, fondo M para la carpa, spinning ML para la
  trucha café) cuesta $899 más la bodega $350 = **$1,249 (42 % de la banda de $3,000)**; D37 daba 30 %. Todo el
  catálogo, $1,667 (56 %). Cabe en el 40 % de equipo más el margen.
- **Carnada:** con ~30 picadas por hora (D74), $2 a $6 por hora, como el combustible. Por eso el equipo inicial trae
  larvas y lombrices.

### Duración de la pelea y ritmo de las picadas (D73–D75, medido)

**Pelea de al menos 1 minuto (D73).** El aguante del pez pasa de 3.5 × aguante × tamaño^0.35 (P1: 11–25 s con el
equipo correcto) a **180 s + 4 × aguante × tamaño^0.35** segundos de presión plena. Con su equipo y buen manejo:

| Pez | Equipo | Pequeño | Típico | Grande |
|---|---|---|---|---|
| Guapucha, carachi | Flotador UL | 64 s | 64 s | 65 s |
| Pejerrey | Flotador UL | 64 s | 65 s | 66 s (85 s con cuidado) |
| Capitán | Flotador L, lombriz | 65 s | 66 s | 68 s |
| Trucha arcoíris | Spinning L | 65 s | 67 s (90 s con cuidado) | 2.5 min (4 kg) |
| Trucha café | Spinning ML | 67 s | 69 s (103 s con cuidado) | 3.4 min (6 kg) |
| Carpa | Fondo M | 67 s | 71 s (117 s con cuidado) | La de 12 kg pide la MH |

Arreglo medido de paso: **levantar la caña solo carga el anzuelo en la medida en que el pez se resiste**. Si no, con
su propia caña se desgarraban la guapucha de 5 g, la carpa de 0.5 kg y la trucha café de 0.5 kg.

**No toda picada engancha (D74).** La picada sigue con sus fases (espera, toques, la boya se hunde, ventana para
clavar), pero:

| Momento | Qué pasa | Probabilidad (provisional) |
|---|---|---|
| Espera | Más larga: ×3.5 la de hoy (~22 s en un buen spot con el equipo correcto) y dividida por la picada del equipo (D64): con el equipo equivocado se espera mucho más | — |
| Toques | El pez puede **robar la carnada** sin llegar a hundir la boya: hay que recoger y volver a encarnar (se gasta la carnada). Más con anzuelo grande. Los señuelos no se roban | 15 % |
| Clavar en un toque (antes de tiempo) | Hoy solo avisa; ahora **espanta al pez** la mayoría de las veces | 60 % lo espanta |
| Clavar con la boya hundida | Engancha con una probabilidad: más si se clava pronto en la ventana | 75 % al principio, 55 % al final |
| No clavar | Se lleva la carnada y escapa (como hoy) | — |
| Spinning | El pez ataca en la recogida: tirón en la punta y una ventana corta para clavar; si no se clava, a veces se engancha solo | Por medir en E1 |

**Ritmo medido** (buen spot, buen jugador, 4 horas simuladas por especie):

| Pez (con su equipo) | Antes: peces/h | Antes: $/h | Ahora: peces/h | Ahora: $/h | Picadas que enganchan | Factor para conservar $/h |
|---|---|---|---|---|---|---|
| Pejerrey | 131 | $274 | 31 | $62 | 61 % | ×4.4 |
| Trucha arcoíris | 128 | $1,187 | 28 | $216 | 55 % | ×5.5 |
| Carpa | 40 | $283 | 24 | $164 | 56 % | ×1.7 |
| Trucha café | 102 | $1,814 | 25 | $504 | 52 % | ×3.6 |

"Antes" es optimista (no cuenta caminar ni navegar), igual que `npm run balance`. **Ahora se saca un pez cada 2 a 2.5
minutos** en vez de cada 30 s, y algo más de la mitad de las picadas terminan en pez.

**La economía se mide por hora (D75).** Con 4 a 5 veces menos peces por hora, el dinero y la XP por hora caerían en la
misma proporción y el lago duraría unas 20 h en vez de 5 (D32). Por eso **el precio por kg y la XP de cada especie
suben por su factor**, medido en E1 con `npm run balance` puesto al día (su jugador simulado aún usa la pelea vieja).
Valores de partida: pejerrey ×4.4, trucha arcoíris ×5.5, carpa ×1.7, trucha café ×3.6; guapucha, carachi y capitán
se miden en E1. Las licencias, el equipo y el viaje no cambian (ya se calculan por hora o por banda). Cada pez vale
más y se siente más.

**D77 · Avanzar el tiempo (aprobada).** Con el día de 120 min (D47), esperar el amanecer para la trucha
puede tomar casi una hora real. Como en Fishing Planet: una ventana (desde la pausa o una tecla) para saltar **solo hacia
adelante** a una hora del mismo día o del siguiente, con la curva de actividad de los peces (la de D71) para elegir.
**Espera de 10 min de juego entre usos.** No se puede durante una pelea ni con el sedal en el agua. **La licencia no
corre con el salto** (cuenta tiempo jugado, D19 y D41), así que saltar no la gasta ni la alarga. Los peces de la nevera
se quedan (no hay venta automática: se venden con el vendedor). **Cambia D42:** la hora sigue sin poder moverse hacia
atrás ni libremente fuera del modo foto, pero se puede adelantar con esta ventana.

**Valores por hora medidos (E2, D75 y D78).** Multiplicadores aplicados en `FishTable.js` (precio × `hourMul`, XP ×
`xpMul`): guapucha ×5.9 / ×4.8, carachi ×6.1 / ×5.4, pejerrey ×5.0 / ×3.8, capitán — / ×3.6 (protegido), trucha arcoíris
×6.4 / ×4.7, carpa ×2.5 / ×2.2, trucha café ×4.8 / ×3.9. La isla: ×1.26–1.30 en dinero (solo compensa D78), XP ×1.
`npm run balance` sigue midiendo la isla con la pelea P1; el lago se mide con `equipo-lago.mjs`.

**D79 · Pez carnada (aprobada).** En Fishing Planet los peces grandes comen peces: los cebos preferidos del
marlín son peces carnada. En el lago la trucha café es cazadora y come peces chicos. Propuesta: **la guapucha y el carachi
que pescas se pueden guardar como carnada viva** (en un cubo, sin nevera) y son cebo preferido de la trucha café y de la
trucha arcoíris grande; también se compran en la tienda. Así los peces chicos sirven para algo más que la XP, como en
el mar (sardina, pez volador). En la isla el pejerrey cabezón y la lisa harían ese papel.

**Cómo tomamos de Fishing Planet (2026-11-18):** el jugador del proyecto pidió seguir al mejor del género. Se toman
**mecánicas, reglas y forma de organizar las pantallas** (qué información va dónde); los **nombres, marcas, arte,
textos y aspecto visual son nuestros** (el estilo de Tidewater, sus colores y tipografía; artículos y marcas inventados,
sin parecerse a los reales ni a los de FP).

### Comparación: el mapa de nivel 1 de Fishing Planet y nuestro lago (capturas 15 a 18, 2026-11-18)

| | Fishing Planet, nivel 1 (un lago de Texas) | Nuestro lago (mapa 1) |
|---|---|---|
| Especies | **22** (el jugador lleva 12/22), con clases joven / común / trofeo / único | **7** (la Laguna de Tota real tiene pocas especies) |
| Licencia básica | **Gratis e ilimitada** en el mapa de inicio | Regalada el primer día, luego se paga por día (D37, D47) |
| Qué deja la básica | Se guarda cualquier pez **salvo una lista**: los trofeos de algunas especies y ciertas clases de otras (hay que soltarlos). **Pesca nocturna prohibida** | Por especie: la básica deja guardar 3 especies (D11, D30) |
| Licencia avanzada | Nivel 2. Sin restricciones, noche y bote permitidos. 1 día 200, 3 días 570, semana 1,260, mes 4,800 | Dos licencias más (intermedia nivel 4, avanzada nivel 7), por día |
| Romper las reglas | Multa (100) si se guarda un pez que había que soltar | No se puede: sin licencia el pez se suelta solo (D13) |
| Embarcaciones | Kayak desde el nivel 1; lancha, bote de lobina y yate más adelante | Bote desde el inicio |
| Viaje | 0 (es la casa del jugador, con sala de trofeos) | Costo de un día de la básica (D58) |
| Guía | Cebos preferidos: peces chicos; señuelos preferidos: una lista larga (12) | Por hacer (E5) |
| Pronóstico | Clima de hoy y de los próximos 6 días | Sin clima |

**Lo que sale de la comparación:**
- **El inicio de FP es más amable:** la básica no cuesta nada en el mapa de inicio y deja guardar casi todo. Nosotros medimos
  que la primera hora del lago es lenta ($55–140/h con la básica) y además cobramos la básica desde el segundo día.
  **D82 (aprobada):** la licencia básica del lago (mapa de inicio) es gratis y sin vencimiento, como en FP.
- **FP restringe por clase, no solo por especie:** la básica obliga a soltar los trofeos de ciertas especies. Es una idea
  para más adelante (por ejemplo, soltar la trucha café trofeo sin la avanzada); por ahora se quedan las tres licencias por
  especie (D11).
- **El lago se queda corto de especies** (7 contra 22). La Laguna de Tota real tiene pocas; se pueden sumar especies
  plausibles de los lagos andinos y los ríos que les caen (por investigar), o aceptar que el lago es corto y el mapa 2
  (lago cálido) trae la variedad.
- **FP no sirve de referencia para la fuerza del equipo ni para la economía** (observación del jugador del proyecto,
  captura 19): es gratuito con pagos, y su equipo de inicio está recortado para empujar a comprar (la telescópica de nivel 1
  aguanta sedal de 1 a 1.82 kg). Nosotros no tenemos pagos (D5): el equipo inicial se calcula con peces reales y con
  nuestras bandas (D32, D37). Nuestra telescópica UL aguanta sedal de 1 a 3 kg y viene con 2.5 kg, y saca una trucha de
  3.5 kg en ~3 min con buen manejo. **De FP se toman mecánicas, ritmo y pantallas; no números de equipo ni precios.**
- **Medición pendiente en FP:** el jugador del proyecto puede pescar una sesión en ese mapa de nivel 1 para tomar los
  números del inicio (espera hasta la picada, picadas que enganchan, duración de las peleas con peces chicos, dinero y
  XP por hora) y compararlos con D73–D75.

**Referencia para la trucha (captura 20, 2026-11-18):** un lago de truchas de Fishing Planet de nivel 5 (22 especies,
varias truchas). Su trucha arcoíris pesa de 0.5 a 2 kg lo típico y llega a 4 kg, igual que la nuestra (0.2–4 kg); tiene
clases joven, común y trofeo, sin único. Cebos preferidos: insectos (mosca, efímeras, saltamontes) y huevas (naturales y
artificiales); señuelos: cucharillas estrechas, giratorias pequeñas y plásticos blandos. **Ajustado:** se suman los
saltamontes y las huevas artificiales al catálogo; la trucha arcoíris los prefiere junto con las cucharillas giratorias,
y acepta larvas, así que con la caña inicial también pica algo (×0.4 en vez de ×0.05).

**Referencia para la caña de trucha (capturas 21 y 22, 2026-11-18):** en ese lago de truchas (nivel 5), FP recomienda
"equipo de spinning" desde la descripción del mapa. Sus cañas de spinning van de nivel 3 a 9; la de nivel 5 es ligera
(L), de 2.3 m, cebo 7–20 g, **sedal 1.5–3.4 kg**, acción moderada-rápida. Cada serie viene en varios largos (190, 200,
230, 240, 260 cm; más larga, más lance y más cara). **Comparada con la nuestra:** nuestra spinning L (2.1 m, nivel 3) va
con sedal 2–5 kg y cebo 3–12 g, y la armamos con fluorocarbono de 3 kg: cae dentro de su rango, y nuestra trucha de 4 kg
tira ~2.1 kg en una carrera. **Queda como está.** Ideas para más adelante: la descripción del mapa dice qué técnica
llevar (en el panel del destino y la guía) y cada caña en dos o tres largos.

**Referencia: los spots de un mapa de Fishing Planet (captura 23, 2026-11-18):** el lago de truchas de nivel 5 se ve
desde el aire con **dos puntos de pesca** marcados en la orilla (por ejemplo "Pesca en las malezas de helecho"). Se elige
uno y "Vamos a pescar" lleva directo ahí; cada punto es una zona chica de orilla para caminar. El día empieza a las 05:00.
**Nuestro lago es distinto:** un mundo abierto donde se camina o se va en bote, con cinco spots con nombre que son tipos de
agua (D30, D40), no lugares fijos. **D83 (aprobada): viaje rápido a los spots** desde el mapa grande (N): al
hacer clic en un spot de orilla (juncos, muelle, desembocadura, bahía de lodo) el jugador aparece en la orilla más cercana,
gratis y fuera de una pelea; el centro profundo sigue siendo en bote. Ahorra caminar sin quitar el mundo abierto.

**Medición en Fishing Planet: truchas con caña ligera (capturas 24 a 28, 2026-11-18).** Aparejo: spinning L de 2.3 m,
carrete 1500, trenzado 0.12 mm de 1.8 kg, cucharilla estrecha de 7 g.
- **Reloj de FP:** en la pelea del pez espada pasaron 3 min 11 s reales y 13 min del juego: ~4 min del juego por minuto
  real, **un día dura ~6 h reales** (el nuestro, 2 h, D47).
- **Primer lance vacío.** Segundo: **se cortó el sedal** con el freno casi al tope (la barra del sedal en rojo y su ícono
  marcado; caña a media carga, carrete en amarillo). Al cortarse se perdieron 3 m de sedal (125 → 122 m).
- **Trucha degollada joven de 0.263 kg, 29 cm: ~30–45 s de pelea** (2 min del juego); $56 y 20 XP. **En FP la clase joven
  se puede guardar y vender;** en nuestro juego el juvenil vale $0 y se suelta. En el chat, otros sacaban truchas de
  0.31–0.33 kg: lo común ahí son truchas chicas.
- **Segunda trucha (degollada joven, otra vez 0.263 kg): ~35–50 s de pelea; ~4 min reales entre las dos capturas**
  (tarjeta, lance, espera y pelea; nosotros calculamos un pez cada 2–2.5 min en el lago, con un día 3 veces más corto).
  Las dos pesaron lo mismo: FP parece usar pocos pesos por clase; nosotros sorteamos el peso en un rango.
- **Clases en kilos por especie en FP:** trucha degollada joven 0.26–0.29 kg, común 0.62 kg, trofeo 1.34 kg; la degollada de
  dorso verde es trofeo con 0.47 kg. **Nuestras clases son un porcentaje del rango:** la trucha arcoíris es juvenil hasta
  0.77 kg y la trucha café hasta 1.33 kg (se sueltan con $0). **D84 (aprobada, con otros kilos):** clases en kilos por especie
  donde el porcentaje no sirve (trucha arcoíris: juvenil hasta 0.3 kg, común 0.3–1.2, trofeo 1.2–2.5, único más de 2.5);
  se vuelven a medir los valores por hora.
- **Comparación:** nuestra pelea mínima es de 1 minuto para todo pez (D73, pedido del jugador del proyecto); FP saca una
  trucha joven en menos. Queda a decisión del jugador del proyecto si los juveniles pelean menos de 1 minuto.

### Pelea según el tamaño y clases en kilos (D84, D85, medido, 2026-11-18)

Reemplaza la duración de D73 y los valores de D75 de las tablas de arriba. Script: `tools/balance/equipo-lago.mjs`.

**Duración** con el equipo correcto y buen manejo (aguante = 95 s + 170 × peso^0.5):

| Pez | Antes (D73) | Ahora (D85) |
|---|---|---|
| Guapucha | 64 s | 40 s |
| Trucha arcoíris 0.3 / 1 / 2 / 3.5 kg | 65 / 67 / ~90 / ~150 s | 65 / 91 / 121 / ~235 s |
| Trucha café 1.5 / 5 kg | ~70 / ~200 s | ~105 / ~295 s |
| Carpa 2 / 6 / 10 kg | ~70 / — / 95 s | ~115 / ~220 / ~265 s |

**Clases en kilos** (juvenil por debajo de · común · trofeo · único por encima): guapucha 0.006 · 0.014 · 0.018; carachi 0.03 ·
0.1 · 0.14; pejerrey 0.15 · 0.8 · 1.1; capitán 0.13 · 0.5 · 0.75; trucha arcoíris 0.35 · 2.5 · 3.6; carpa 1 · 7.5 · 11; trucha café
0.75 · 4 · 5.5. Reparto en el lago: 25 % juvenil, 55 % común, 15 % trofeo, 4 % único (antes 42 / 43 / 11 / 4).

**Comprobado en FP (captura 29):** una trucha degollada común de 0.567 kg peleó **~1.2 min** (medido por el jugador del
proyecto); la nuestra de ese peso, ~75 s. Coinciden. Antes, una común de 1.016 kg tardó ~2–2.5 min con sedal de 1.8 kg (la
nuestra de 1 kg, 91 s con sedal de 3 kg; con sedal más fino también se alarga). En FP el dinero va a ~$250/kg en toda clase
y la XP sube con el tamaño (20, 44, 83 XP para 0.26, 0.57 y 1.02 kg): el mismo patrón que D78.

**Valores por hora** (precio × `hourMul`, XP × `xpMul`, 16 horas simuladas por especie): guapucha ×4.1 / ×2.5, carachi ×4.5 /
×3.3, pejerrey ×4.9 / ×3.8, capitán — / ×3.8, trucha arcoíris ×8.5 / ×7.0, carpa ×4.1 / ×3.8, trucha café ×10.3 / ×9.2. Peces por
hora con su equipo: chicos ~30–36, trucha arcoíris ~20, trucha café ~16, carpa ~13. Los factores varían ±20 % entre corridas
(un pez grande pesa mucho en una hora); se afinan jugando.

### Lo que cambia en las decisiones

- **D36** (aparejo completo por técnica) pasa a piezas. **D34** (pesos por técnica) pasa a pesos por carnada o
  señuelo. **D37** se recalcula: el presupuesto por mapa (40 % de lo ganado para equipo) se reparte entre las piezas,
  y las carnadas son un gasto recurrente nuevo, como el combustible.
- **Guardado versión 4:** el aparejo de flotador de cada grado pasa a una caña, carrete y sedal equivalentes, con
  carnada inicial gratis. Nadie pierde nada.
- **La pelea (P1) se recalibra** con sedales realistas (2 a 12 kg en el lago en vez de 7 a 50).

### Entregas propuestas (después de decidir)

| Entrega | Qué | Estado |
|---|---|---|
| E1 | Datos y reglas, sin cambiar el juego: `src/game/Tackle.js` (catálogo del lago, preferencias por especie, caña armada, problemas de armado, multiplicador de picada) y el enganche de D74 en `Bites.js`; `equipo-lago.mjs` lee de ahí; 28 tests | **Hecha** (2026-11-18) |
| E2 | Pelea con equipo en el lago (`map.tackle`): fuerza realista, aguante de D73, freno tope del carrete, desgarre según la rigidez, caña rota; tres barras de carga por segmentos, metros fuera / capacidad, dial del freno; espera ×3.5, robo de carnada, clavar antes espanta, enganche 75 / 55 %; `hourMul` y `xpMul` por especie (D75) y clases de D78. Provisional hasta E3: cada grado del aparejo de flotador equivale a una caña del catálogo (`GRADE_RIGS`), el multiplicador de picada por cebo está apagado y la caña rota no se pierde. La isla sigue con la pelea P1 | **Hecha** (2026-11-18) |
| E3 | Tienda nueva en rejilla (D81) con filtros, panel del artículo, paquetes por especie, comprar y equipar, vender al 50 %; licencias por varios días (D80); pez carnada (D79); el multiplicador de picada por cebo se enciende; guardado versión 4 | **Hecha** (2026-11-18) |
| E4 | Cañas armadas (1, 2, 3) y pestaña de equipo en el inventario | **Hecha** (2026-11-18) |
| E5 | Misiones de "Primeros pasos"; guía con cebos preferidos; nevera con el cebo usado; actividad por hora en el mapa; viaje rápido a los spots (D83); avanzar el tiempo (D77) | Pendiente |
| E6 | Se ven distintas: caña según la potencia, boya, cucharilla en el agua (une con A1) | Pendiente |

**Respuestas (2026-11-18):** con el equipo de carpa la trucha salía demasiado fácil; piezas separadas (D63); tres
cañas armadas (D65); carnadas y señuelos se gastan (D66). **Antes de E1:** fijar el catálogo del lago con números
(potencias, sedales, carretes, precios) y medirlo con `fight.mjs` y `npm run balance`. **Hecho** (D72, tabla arriba). Decididos también D67 (sin desgaste), D68 (vender al
50 %), D69 (paquetes por especie), D70 (misiones de "Primeros pasos") y D71 (pantallas al estilo de FP).

### Plan de E3 (2026-11-18)

**E3a · Datos y reglas (sin pantallas nuevas):**
- **Mochila de equipo** en el guardado (campo nuevo `tackle`, se agrega sin cambiar la versión 3: los guardados viejos lo
  reciben al cargar): cañas y carretes por unidades; bobinas de sedal; anzuelos, boyas y plomos por unidades; carnadas por
  unidades; señuelos por unidades. Y **las cañas armadas** (`rigs`, tres lugares, D65) con la activa.
- **Conversión:** quien no tiene mochila recibe las piezas de su grado del aparejo de flotador (`GRADE_RIGS`) armadas en la
  caña 1, más el equipo inicial (sobre de anzuelos #12, boyas de 3 g, 30 larvas y 20 lombrices). Nadie pierde nada.
- **Qué se gasta:** una carnada por picada (sacada, perdida, robada o fallada); con el sedal cortado se pierden anzuelo, boya
  o plomo y la carnada o el señuelo; con la caña rota se pierde la caña (D66). Sin carnada, sin anzuelo o con una pieza
  que falta, la caña no se puede lanzar y el aviso dice qué falta.
- **La picada por cebo se enciende** (D64): cada especie pica según su multiplicador con la caña activa; la espera se
  divide por el promedio y la especie se elige con los pesos multiplicados.
- **Licencias por días** (D80): 1, 3 o 7 días (×1, ×2.8, ×6.3 el precio de un día). **La básica del lago es gratis y sin
  vencimiento** (D82).
- **Pez carnada** (D79): una carnada nueva, "pez carnada vivo"; la guapucha y el carachi sacados pueden ir al cubo en vez
  de a la nevera (un botón en la tarjeta de captura); también se compra. Preferido de la trucha café, aceptable para la
  trucha arcoíris.
- **Para qué pez sirve cada pieza:** las preferencias suman la potencia ideal de caña de cada especie, para el filtro y el
  panel de la tienda.
- Tests de todo.

**E3b · La tienda en rejilla (D81):** pestañas Principal (paquetes por especie con 15 % de descuento, D69), Cañas,
Carretes, Sedales, Anzuelos y boyas, Cebos, Señuelos, Bote y bodega, Licencias. Filtros a la izquierda (técnica, potencia,
para qué pez, solo lo que mi nivel permite), orden por nivel, tarjetas (dibujo sencillo por tipo hasta que haya arte, E6;
nivel, paquete, precio, Comprar) y panel del artículo (números comparados con la caña activa, para qué especies sirve, con
qué es compatible, Comprar, Comprar y armar, Vender por el 50 % si sobra, D68). La pestaña de equipo del inventario para
armar las tres cañas queda para E4.

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
- **2026-11-18** · Decididos D57 (viaje desde el amarre, solo a mapas desbloqueados por nivel; la isla en el nivel
  10 por ahora) y D58 (el viaje cuesta un día de la básica del destino). **L2 y L5 hechas:** viaje en bote con B y
  partidas nuevas en el lago. El Mapa 1 queda integrado.
- **2026-11-18** · Decididos D59 (peces con modelos GLB gratuitos de licencia libre, sin cambiar de motor; prototipo
  con la trucha Redband de E.A.Cornell) y D60 (guía de peces en el juego y en la portada, todo visible). Plan en 7f.
- **2026-11-18** · D59 revisado: Sketchfab no deja crear cuenta, así que los peces llevan **ilustraciones de dominio
  público del USFWS** proyectadas sobre el modelo. **M1 hecha:** la trucha café y la carpa ya se ven con su
  ilustración en la tarjeta de captura (los del agua usan el mismo material), con la anatomía ajustada a cada dibujo.
- **2026-11-18** · M2 avanzada: trucha arcoíris (Raver), carachi (*Orestias pentlandii*) y guapucha (Eigenmann, en
  modo tinte) con piel ilustrada; el pejerrey tiene modelo propio (para no pintar al pejerrey cabezón de la isla).
  M3: prueba del modelo 3D de la trucha arcoíris en la tarjeta de captura, para comparar con la ilustración.
- **2026-11-18** · Decidido D61: los peces pasan a modelos 3D como camino principal; la piel ilustrada queda de
  respaldo para las especies sin modelo libre. Plan M4 a M7 y candidatos del lago en 7f.
- **2026-11-18** · **M4 hecha:** la trucha arcoíris y la carpa (escaneo CC0 de ffish.asia) se ven en 3D en la tarjeta
  de captura. `glb_slim.py` ahora quita del archivo lo que no se dibuja (la trucha joven, un caracol de adorno).
- **2026-11-18** · Las 7 especies del lago ya tienen modelo 3D en la tarjeta de captura (cinco son dobles parecidos,
  escaneos CC0 de ffish.asia). `FishModel.js` carga modelos con esqueleto y fijos; `glb_slim.py` convierte
  materiales antiguos y quita lo que no se dibuja.
- **2026-11-18** · Instalado gltf-transform (solo desarrollo) para simplificar mallas: carpa de 4,7 a 2,7 MB, lisa de 6,2 a 3,0 MB.
- **2026-11-18** · **M5 hecha:** los peces del lago nadan en 3D (sus modelos en el lote de peces, con la onda del
  motor y 4 niveles de detalle); el lago ya no tiene peces tropicales. Anotado A1 (aparejos distintos por grado).
- **2026-11-18** · Decidido D62: la pelea profunda se adelanta (freno con la rueda, mover la caña, pez visible con
  saltos y red, cada especie distinta). Plan P1 a P3 en 7g.
- **2026-11-18** · **P1 hecha:** la pelea nueva con los controles de Fishing Planet (freno con la rueda, Shift, clic
  derecho para tirar, caña contra la carrera, saltos, enredos en el fondo, cada especie a su manera). Pendiente:
  recalibrar `npm run balance` (su jugador simulado solo mantiene el clic).
- **2026-11-18** · Jugando se vio que la caña de la carpa sirve igual para la trucha y la vuelve trivial (medido con
  la pelea P1). Propuesta en 7h: equipo por piezas (caña con potencia, carrete, sedal, anzuelo, cebo), carnadas y
  señuelos por especie, tienda por pestañas al estilo de Fishing Planet. Por decidir.
- **2026-11-18** · Decididos D63 (equipo por piezas), D64 (el equipo equivocado se castiga), D65 (tres cañas armadas y
  tienda por pestañas) y D66 (carnadas y señuelos se gastan). Plan E1 a E5 en 7h.
- **2026-11-18** · Anotado en 7h cómo es el inventario de Fishing Planet (captura del jugador): soportes de caña
  arriba, piezas a la izquierda, caña armada al centro, mochila por categorías a la derecha.
- **2026-11-18** · Anotado en 7h el resto de Fishing Planet (mapa con actividad por hora, guía con cebos preferidos,
  tienda con paquetes, misiones que enseñan a armar equipo, nevera con el cebo usado). Por aprobar.
- **2026-11-18** · Anotada en 7h la pantalla de pesca de Fishing Planet: tres barras de carga (sedal, caña, carrete) en
  vez de una de tensión, metros fuera / en el carrete, caña activa con su cebo. Por aprobar.
- **2026-11-18** · Decididos D67 (sin desgaste), D68 (vender al 50 %), D69 (paquetes por especie), D70 (misiones de
  "Primeros pasos"), D71 (pantallas al estilo de FP) y D72 (catálogo del lago). Nuevo `tools/balance/equipo-lago.mjs`:
  con el equipo de carpa la trucha pica 4 a 6 veces menos y se desgarra si se pelea fuerte; el camino normal del lago
  cuesta $1,249 con la bodega (42 % de la banda). Plan E1 a E6 en 7h.
- **2026-11-18** · Decididos D73 (la pelea dura al menos 1 minuto), D74 (no toda picada engancha) y D75 (la economía
  se conserva por hora: el valor por pez sube por su factor). Medido con `equipo-lago.mjs`: un pez cada 2 a 2.5 min,
  algo más de la mitad de las picadas enganchan; la trucha con el equipo de carpa ya no sale más rápido.
- **2026-11-18** · Anotada en 7h la pelea de Fishing Planet (barras por segmentos de azul a rojo; la del carrete se
  llena cuando el freno suelta hilo; un pez grande seguía peleando a los 3 min 40 s).
- **2026-11-18** · Anotado en 7h: en Fishing Planet la misma pelea seguía a los 7 min y el pez había ganado hilo
  (100 → 143 m); el desgaste del equipo corre mientras se pelea.
- **2026-11-18** · Anotado en 7h: la pelea de referencia de Fishing Planet llegó a ~11 min con el pez a 32 m; el
  pez sigue tirando cerca del final.
- **2026-11-18** · Anotada en 7h la tarjeta de captura de Fishing Planet: pez espada único de 448 kg tras ~12.5 min
  de pelea; barra de nivel que se llena con la XP, desglose de la XP, liberar o llevar, atajo al modo foto.
- **2026-11-18** · Decidido D76 (los trofeos del mar pelean de 5 a 15 min). Anotado en 7h el perfil de Fishing Planet
  (récord por especie con el cebo, conteo por clase, retos por técnica).
- **2026-11-18** · **E1 hecha:** `src/game/Tackle.js` con el catálogo del lago, las preferencias de cada especie, la caña
  armada (estadísticas y problemas de armado) y el multiplicador de picada; el enganche de D74 en `Bites.js`. El juego
  no cambia todavía: la picada nueva, la pelea larga y los valores por hora (D75) entran juntos en E2. 28 tests nuevos.
- **2026-11-18** · Anotado en 7h: en Fishing Planet pasaron ~4 min entre sacar el pez espada y la siguiente picada.
- **2026-11-18** · Anotado en 7h: en Fishing Planet el dinero va casi por peso y la XP premia la clase (un único da ×6.5
  de XP por ×2.25 de peso). Nuestro juego premia la clase también en dinero (×3); por decidir en E2.
- **2026-11-18** · Anotada en 7h la ventana "Avanzar el tiempo" de Fishing Planet y propuesta D77 (saltar hacia adelante
  con la curva de actividad, 10 min entre usos, la licencia no corre con el salto). Por decidir.
- **2026-11-18** · Decididos D77 (avanzar el tiempo) y D78 (dinero casi por peso, la clase en XP). **E2 hecha:** el lago
  pesca con la pelea nueva (al menos 1 minuto, la caña amortigua o desgarra, freno tope del carrete, caña rota), las
  tres barras de carga, metros fuera / capacidad y el dial del freno; no toda picada engancha; valores por hora por
  especie. Provisional hasta E3: cada grado del aparejo equivale a una caña del catálogo y la picada por cebo está
  apagada. La isla sigue igual (solo compensa D78). Probado en el navegador; 12 tests nuevos.
- **2026-11-18** · Anotada en 7h la guía de Fishing Planet (cebos y señuelos preferidos por separado, clase juvenil) y
  propuesta D79 (los peces chicos del lago como carnada viva). Por decidir.
- **2026-11-18** · Decididos D79 (pez carnada), D80 (licencias por varios días) y D81 (tienda en rejilla con filtros y
  panel del artículo), con las capturas del globo, la tienda de cebos y las licencias de Fishing Planet. Anotado
  cómo se toma de FP: mecánicas y organización, con nombres, arte y aspecto propios.
- **2026-11-18** · Comparado el mapa de nivel 1 de Fishing Planet con el lago (22 especies contra 7, básica gratis e
  ilimitada, restricciones por clase, multa). Propuesta D82 (básica del lago gratis y sin vencimiento). Por decidir.
- **2026-11-18** · Anotado: FP no sirve de referencia para la fuerza del equipo inicial ni para la economía (es gratuito
  con pagos y recorta el equipo de inicio); de FP se toman mecánicas, ritmo y pantallas.
- **2026-11-18** · Con un lago de truchas de Fishing Planet como referencia: saltamontes y huevas artificiales al
  catálogo; la trucha arcoíris prefiere insectos, huevas y cucharillas giratorias, y acepta larvas.
- **2026-11-18** · Comparada la caña de trucha de Fishing Planet (L, 1.5–3.4 kg, 7–20 g) con nuestra spinning L: coincide;
  queda como está.
- **2026-11-18** · Decidido D82 (la básica del lago es gratis y sin vencimiento); entra en E3 con la tienda nueva.
- **2026-11-18** · Plan de E3 en dos partes (E3a datos y reglas, E3b tienda en rejilla) en 7h.
- **2026-11-18** · **E3a hecha:** mochila de equipo y tres cañas armadas en el guardado (`TackleBag.js`, campo nuevo
  `tackle` sin cambiar la versión; los guardados viejos reciben la caña de su grado); la picada por cebo encendida; una
  carnada por picada, el final del sedal al cortarse, la caña al romperse; la caña no se lanza si le falta algo; licencias
  por 1, 3 o 7 días; la básica del lago gratis y sin vencimiento (el viaje al lago, gratis); pez carnada (botón "Al cubo" en
  la nevera); paquetes por especie y vender al 50 % listos para la tienda. Mientras llega la tienda nueva (E3b), en el lago
  la tienda vieja ya no vende grados del aparejo. 30 tests nuevos.
- **2026-11-18** · **E3b hecha:** la tienda en rejilla del lago (`ShopPanel.js`): pestañas, filtros (para qué pez,
  técnica, potencia, nivel), tarjetas con dibujo sencillo por tipo, panel del artículo con sus números contra la caña
  activa, para qué peces sirve, qué le es compatible, comprar, comprar y armar, armar y vender al 50 %; la pestaña
  Principal con las tres cañas (elegir la activa) y los paquetes por especie; bote y bodega; licencias por 1, 3 o 7 días.
  La isla sigue con la lista vieja. La caña y el carrete iniciales cuestan $25 y $20 si se compran otra vez.
- **2026-11-18** · Corregido: en el carrete va la bobina (150 m) o lo que el carrete admite de ese grosor, lo que sea
  menos (como en Fishing Planet, donde un carrete 1500 solo admite 125 m de una bobina de 150 y el resto queda aparte).
  Antes el carrete inicial daba 293 m. Con el equipo correcto las peleas no cambian; el liviano se queda sin hilo con
  peces grandes. El pedazo que sobra no se guarda por ahora. Corregido también el precio base en `equipo-lago.mjs`.
- **2026-11-18** · Anotados los spots de Fishing Planet (puntos fijos de orilla a los que se va directo). Propuesta D83:
  viaje rápido a los spots de orilla desde el mapa grande. Por decidir.
- **2026-11-18** · Medición en Fishing Planet con truchas: su día dura ~6 h reales; una trucha joven de 0.26 kg sale en
  ~30–45 s; el corte de sedal quita metros; la clase joven se vende allá.
- **2026-11-18** · Segunda trucha medida en FP (~35–50 s; ~4 min entre capturas). Propuesta D84: clases de tamaño en
  kilos por especie. Por decidir.
- **2026-11-18** · Decididos D84 (clases en kilos por especie en el lago, ~25 / 55 / 16 / 4 %) y D85 (la pelea crece con el
  tamaño: guapucha ~40 s, trucha de 1 kg ~1.5 min, de 3.5 kg ~4 min). Valores por hora medidos de nuevo y aplicados.
- **2026-11-18** · Comprobado en FP: una trucha común de 0.57 kg pelea ~1.2 min; la nuestra (D85), ~75 s.
- **2026-11-18** · Referencia de la carpa de Fishing Planet (mapa de nivel 50): 2–14 kg lo típico, hasta 40; cebos
  preferidos de sémola, maíz, guisantes, pan, boilies y pellets. Nuestra carpa (0.5–12 kg, lago) queda como está; el
  pellet pasa a preferido.
- **2026-11-18** · Comprobado en FP: carpas de 10 kg o más pelean ~4 min; la nuestra de 10 kg (caña de fondo MH), ~4.5 min. Coinciden.
- **2026-11-18** · Decidido D83 (viaje rápido a los spots de orilla); entra en E5 junto con avanzar el tiempo (D77).
- **2026-11-18** · **E4 hecha:** las teclas 1, 2 y 3 cambian de caña al pescar (recoge el sedal si está en el agua y avisa
  si a la nueva le falta algo); la caña activa con su cebo y cuántos quedan arriba a la derecha (en rojo si no está lista);
  pestaña Equipo en el inventario (I) con las tres cañas armables desde la mochila, la caña activa y la mochila con vender
  al 50 % (`EquipPanel.js`). El paquete de carpa lleva plomo de 20 g. 8 tests nuevos.
