import { activeMap } from '../maps/registry.js';

// Shared world layout of the active map (maps/island.js and the others, through maps/registry.js).
// Coordinates in meters, y up, water level y = 0. On the island the open ocean lies to the south (+z) and the island
// to the north (-z); the sun rises in the east (+x) and sets in the west (-x).
export const WORLD = activeMap().layout;
