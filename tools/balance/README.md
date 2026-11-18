# Simulador de equilibrio

Mide la economía de Tidewater con el código real del juego (`src/game/`), sin abrir el navegador.
Sirve para comprobar el efecto de un cambio de precios, peces o mejoras **antes** de jugarlo.

```sh
npm run balance                          # informe completo, en español
npm run balance -- --n=8000              # más partidas simuladas: más preciso, más lento
npm run balance -- --seed=7              # otra semilla de azar
npm run balance -- --solo=peces,dinero   # solo algunas secciones
npm run balance -- --en                  # nombres en inglés
npm run balance > antes.md               # guardar un informe para comparar después
```

## Secciones

| Nombre | Qué mide |
|---|---|
| `peces` | Probabilidad de sacar cada especie con cada sedal, para un jugador humano y uno perfecto (robot) |
| `zonas` | Qué pica en la orilla, el muelle, el arrecife, la bahía y aguas profundas, a cuatro horas del día |
| `dinero` | Dinero por minuto en cada zona según el equipo |
| `nevera` | Minutos hasta llenar la nevera o bodega, y cuánto vale la carga |
| `alcance` | Profundidad que alcanza cada caña desde el muelle y distancia en bote hasta aguas profundas (mapa real) |
| `progreso` | Costo de todas las mejoras y minutos de pesca necesarios para pagarlas |

## Cómo usarlo para un cambio

1. `npm run balance > antes.md`
2. Cambiar los datos (por ejemplo `src/game/FishTable.js` o `src/game/Gear.js`).
3. `npm run balance > despues.md` y comparar los dos archivos.

Con la misma semilla, el azar es idéntico en las dos ejecuciones, así que las diferencias vienen del cambio.

## Supuestos y límites

- **Jugador humano:** ve la aguja de tensión 0.25 s tarde y con un pequeño error; recoge por debajo de 0.55 y suelta por encima de 0.8. **Robot:** ve la tensión exacta en cada cuadro.
- **Ciclo de pesca:** 3 s de lance, la espera de la picada (la del juego), 2.5 s de piquitos, la pelea y 4 s de tarjeta de captura.
- **No cuenta** caminar, navegar, vender ni los fallos al clavar el anzuelo: los valores absolutos son **optimistas**. Las comparaciones entre zonas, horas y equipos sí son fiables.
- Las zonas usan profundidades típicas (orilla 1.5 m, muelle 3.5 m, arrecife 6 m, bahía 10 m, profundo 35 m), no cada punto del mapa.
- Con el valor por defecto (`--n=3000`) las cifras de dinero varían unos ±10 % entre semillas; para decisiones finas, usar `--n=10000` o más.
