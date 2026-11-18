import { loc } from '../i18n.js';

// The chain of maps (docs/DISENO.md section 6, D25, D29), as the menus show it: no layouts, terrain or engine, so
// the landing page can list them without loading the game. status: 'open' (playable), 'building' (being made),
// 'planned' (designed, not started). The playable maps' full definitions are in maps/<id>.js (maps/registry.js).
export const MAP_CATALOG = [
	{ id: 'lake', order: 1, levels: '1–10', name: loc( 'Mountain lake', 'Lago de montaña' ), place: loc( 'Inspired by Lake Tota, Colombia', 'Inspirado en la Laguna de Tota, Colombia' ), status: 'building' },
	{ id: 'warmLake', order: 2, levels: '11–20', name: loc( 'Warm lake', 'Lago cálido' ), place: loc( 'Lakes of Florida, Caribbean dams, Colombian reservoirs', 'Lagos de Florida, presas del Caribe, embalses de Colombia' ), status: 'planned' },
	{ id: 'river', order: 3, levels: '21–30', name: loc( 'Tropical river', 'Río tropical' ), place: loc( 'Rivers of the Colombian plains (Llanos)', 'Ríos de los Llanos' ), status: 'planned' },
	{ id: 'swamp', order: 4, levels: '31–40', name: loc( 'Swamp and mangrove', 'Ciénaga y manglar' ), place: loc( 'Colombian swamps, the Everglades, Caribbean mangroves', 'Ciénagas de Colombia, Everglades, manglar caribeño' ), status: 'planned' },
	{ id: 'lagoon', order: 5, levels: '41–50', name: loc( 'Coastal lagoon and flats', 'Laguna costera y bajos' ), place: loc( 'Caribbean flats', 'Flats del Caribe' ), status: 'planned' },
	{ id: 'island', order: 6, levels: '51–60', name: loc( 'The island', 'La isla' ), place: loc( 'A volcanic Caribbean island', 'Una isla volcánica del Caribe' ), status: 'open' },
];

export const catalogEntry = ( id ) => MAP_CATALOG.find( ( m ) => m.id === id ) || null;
export const mapName = ( id ) => catalogEntry( id )?.name ?? '';
