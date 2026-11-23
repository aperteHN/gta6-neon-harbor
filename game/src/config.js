// Neon Harbor configuration: Solstice City size, districts and tuning in one place.
// Authoring-pass tuning (recorded build): slightly grippier cars, a touch faster sprint,
// slow health regen while un-wanted, and per-district taglines the HUD can show.
export const WORLD = { width: 3200, height: 2400, block: 200, road: 68 };
export const PLAYER = { radius: 14, walk: 182, sprint: 292, health: 100, regenPerSec: 1.6 };
export const CAR = { accel: 555, maxSpeed: 445, reverse: 165, turn: 2.85 };
export const WANTED = { max: 5, decayPerSec: 0.006 };
export const STEP = 1 / 60;
export const SAVE_KEY = 'neon-harbor-save-v1';
export const DISTRICTS = [
  { name: 'Neon Harbor', tagline: 'Marina lights & Rico\'s garage', x: 0, y: 1500, w: 1100, h: 900, color: '#ff5da2' },
  { name: 'Palm Quarter', tagline: 'Cafés, palms & easy money', x: 1100, y: 1500, w: 1100, h: 900, color: '#ffd166' },
  { name: 'Solstice Downtown', tagline: 'Banks, towers & cameras', x: 0, y: 0, w: 1500, h: 1500, color: '#4cc9f0' },
  { name: 'Portside Yards', tagline: 'Cranes, crates & quiet corners', x: 1500, y: 0, w: 1700, h: 1500, color: '#80ed99' },
  { name: 'Coral Beach', tagline: 'Sand, boats & the getaway', x: 2200, y: 1500, w: 1000, h: 900, color: '#ff9e6d' },
];
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return DISTRICTS[0];
}
