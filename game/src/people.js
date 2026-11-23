// People: pedestrians wandering sidewalks, and police who chase on foot and by car.
import { WORLD } from './config.js';
import { isRoad, moveWithCollision } from './world.js';

const SKIN = ['#f1c27d', '#e0ac69', '#8d5524', '#ffdbac', '#c68642'];
const SHIRT = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#ffffff', '#ff7b00', '#9d4edd'];

export function createPedestrians(rand) {
  const peds = [];
  for (let i = 0; i < 46; i++) {
    peds.push({
      x: 50 + rand() * (WORLD.width - 100), y: 50 + rand() * (WORLD.height - 100),
      angle: rand() * Math.PI * 2, speed: 34 + rand() * 42, timer: 2 + rand() * 5,
      skin: SKIN[i % SKIN.length], shirt: SHIRT[i % SHIRT.length], panic: 0,
    });
  }
  return peds;
}
export function stepPedestrians(peds, dt, rand, buildings, danger) {
  for (const p of peds) {
    p.timer -= dt;
    if (danger && Math.hypot(p.x - danger.x, p.y - danger.y) < 130) p.panic = 1.2;
    if (p.panic > 0) { p.panic -= dt; p.angle = Math.atan2(p.y - danger.y, p.x - danger.x); }
    else if (p.timer <= 0) { p.timer = 2 + rand() * 5; p.angle = rand() * Math.PI * 2; }
    const sp = p.panic > 0 ? 150 : p.speed;
    moveWithCollision(buildings, p, Math.cos(p.angle) * sp * dt, Math.sin(p.angle) * sp * dt, 10);
    if (!isRoad(p.x, p.y) && p.panic <= 0 && rand() < 0.01) p.angle += Math.PI / 2;
  }
}

export function createPolice() { return []; }
/**
 * Balanced response curve (authoring pass): one star is a single patrol, pressure
 * ramps one unit at a time, and only a full five-star heat brings the sixth unit —
 * the old formula jumped from 2 units at two stars straight to 4 at three.
 */
const POLICE_BY_WANTED = [0, 1, 2, 3, 4, 6];
export function wantedPoliceCount(wanted) {
  const w = Math.max(0, Math.min(5, Math.floor(wanted)));
  return POLICE_BY_WANTED[w];
}

export function stepPolice(police, dt, target, buildings) {
  for (const cop of police) {
    const d = Math.hypot(target.x - cop.x, target.y - cop.y);
    cop.angle = Math.atan2(target.y - cop.y, target.x - cop.x);
    // Foot officers sprint when far behind (so chases converge) but settle to a
    // measured pace up close, which makes the busted surround fairer to escape.
    const sp = cop.inCar ? 302 : (d > 220 ? 232 : 198);
    if (d > (cop.inCar ? 60 : 26)) moveWithCollision(buildings, cop, Math.cos(cop.angle) * sp * dt, Math.sin(cop.angle) * sp * dt, 12);
    cop.close = d < 34;
  }
  // Gentle separation: stacked officers fan out instead of hiding inside each other.
  for (let i = 0; i < police.length; i++) for (let j = i + 1; j < police.length; j++) {
    const a = police[i], b = police[j];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0.01 && d < 22) { const push = (22 - d) / 2; b.x += (dx / d) * push; b.y += (dy / d) * push; a.x -= (dx / d) * push; a.y -= (dy / d) * push; }
  }
}
export function spawnPolice(police, wanted, rand, target) {
  const want = wantedPoliceCount(wanted);
  while (police.length < want) {
    // Higher heat responds closer: five-star units arrive almost on top of the action.
    const a = rand() * Math.PI * 2, dist = 460 - wanted * 42 + rand() * 160;
    police.push({ x: Math.max(30, Math.min(WORLD.width - 30, target.x + Math.cos(a) * dist)), y: Math.max(30, Math.min(WORLD.height - 30, target.y + Math.sin(a) * dist)), angle: 0, inCar: police.length % 2 === 0, health: 60, close: false });
  }
  while (police.length > want) police.pop();
}
