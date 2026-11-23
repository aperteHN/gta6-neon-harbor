// Solstice City generation: road grid, buildings with collision, palms, beach and props.
// Deterministic from a seed so screenshots and play sessions share the same city.
import { WORLD, DISTRICTS } from './config.js';
import { createRandom, pickRandom } from './random.js';

export function isRoad(x, y) {
  const bx = ((x % WORLD.block) + WORLD.block) % WORLD.block;
  const by = ((y % WORLD.block) + WORLD.block) % WORLD.block;
  return bx < WORLD.road || by < WORLD.road;
}
export function createCity(seed) {
  const rand = createRandom(seed ^ 0x9e3779b9);
  const buildings = [];
  const palms = [];
  const colors = ['#2b3a67', '#3a506b', '#5bc0be', '#6fffe9', '#f7ede2', '#e07a5f', '#81b29a', '#f2cc8f', '#577590', '#90be6d', '#f94144', '#277da1'];
  for (let gx = 0; gx < WORLD.width / WORLD.block; gx++) {
    for (let gy = 0; gy < WORLD.height / WORLD.block; gy++) {
      const x0 = gx * WORLD.block + WORLD.road + 10;
      const y0 = gy * WORLD.block + WORLD.road + 10;
      const w = WORLD.block - WORLD.road - 20;
      // Split most blocks into 2 buildings, some stay as parking / plaza.
      const roll = rand();
      if (roll < 0.12) {
        for (let i = 0; i < 5; i++) palms.push({ x: x0 + rand() * w, y: y0 + rand() * w, s: 0.8 + rand() * 0.5 });
        continue;
      }
      const split = roll < 0.6;
      const bw = split ? (w - 8) / 2 : w;
      const count = split ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const bx = x0 + i * (bw + 8);
        const h = w * (0.55 + rand() * 0.4);
        buildings.push({
          x: bx, y: y0 + rand() * (w - h), w: bw, h,
          color: pickRandom(rand, colors),
          roof: rand() < 0.3 ? '#ffd166' : '#1c2541',
          floors: 3 + Math.floor(rand() * 9),
          // Rooftop props give the top-down view texture: water tanks, AC units, helipads.
          prop: pickRandom(rand, ['tank', 'ac', 'ac', 'garden', 'helipad', 'none']),
          name: '',
        });
      }
      if (rand() < 0.5) palms.push({ x: x0 - 6, y: y0 + rand() * w, s: 1 });
    }
  }
  // A palm grove on the Coral Beach strip, so the getaway shore reads as a beach
  // and not just the last row of city blocks.
  for (let i = 0; i < 14; i++) palms.push({ x: 2250 + rand() * 880, y: 2240 + rand() * 110, s: 0.9 + rand() * 0.6 });
  // Beach strip along the south edge and water beyond the world is drawn by the renderer.
  const shops = [
    { x: 340, y: 1740, name: 'Harbor Customs', kind: 'garage' },
    { x: 1540, y: 340, name: 'Ammu-Bay', kind: 'gun' },
    { x: 2540, y: 1740, name: 'Coral Diner', kind: 'food' },
    { x: 740, y: 740, name: 'Solstice Bank', kind: 'bank' },
    { x: 2140, y: 940, name: 'Portside Warehouse', kind: 'warehouse' },
    { x: 2820, y: 2260, name: 'Neon Pier', kind: 'pier' },
  ];
  return { buildings, palms, shops, districts: DISTRICTS };
}
export function collide(buildings, x, y, r) {
  for (const b of buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
/** True on the southern sand strip (slow on foot, pretty in screenshots). */
export function isBeach(x, y) { return y > WORLD.height - 90; }
/** Straight-line distance between two points — shared by AI, missions and the HUD. */
export function distanceBetween(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function moveWithCollision(buildings, ent, dx, dy, r) {
  let nx = Math.max(r, Math.min(WORLD.width - r, ent.x + dx));
  if (!collide(buildings, nx, ent.y, r)) ent.x = nx;
  let ny = Math.max(r, Math.min(WORLD.height - r, ent.y + dy));
  if (!collide(buildings, ent.x, ny, r)) ent.y = ny;
}
