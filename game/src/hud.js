// HUD and minimap: cash, health, wanted stars, mission objective, district name and the city map.
// Authoring pass: the district label now carries its tagline, the objective panel shows the
// live distance to the gold marker, and the minimap gains a tiny legend (you / police / goal).
import { WORLD, DISTRICTS, districtAt } from './config.js';
import { distanceBetween } from './world.js';

export function drawMinimap(ctx, state, x, y, size) {
  const s = size / WORLD.width;
  ctx.save();
  ctx.fillStyle = 'rgba(8,12,24,0.88)'; ctx.fillRect(x, y, size, size * (WORLD.height / WORLD.width));
  ctx.strokeStyle = '#4cc9f0'; ctx.lineWidth = 2; ctx.strokeRect(x, y, size, size * (WORLD.height / WORLD.width));
  for (const d of DISTRICTS) { ctx.fillStyle = d.color + '33'; ctx.fillRect(x + d.x * s, y + d.y * s, d.w * s, d.h * (size / WORLD.height)); }
  ctx.fillStyle = '#3a506b';
  for (const b of state.city.buildings) ctx.fillRect(x + b.x * s, y + b.y * s, Math.max(1, b.w * s), Math.max(1, b.h * s));
  const obj = state.objective;
  if (obj && obj.step && obj.step.x) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x + obj.step.x * s, y + obj.step.y * s, 5, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ff3355';
  for (const cop of state.police) { ctx.fillRect(x + cop.x * s - 2, y + cop.y * s - 2, 4, 4); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + state.player.x * s, y + state.player.y * s, 4, 0, 7); ctx.fill();
  ctx.restore();
  // Legend under the map: white = Mara, red = police, gold = objective.
  ctx.save();
  ctx.font = '10px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const ly = y + size * (WORLD.height / WORLD.width) + 4;
  ctx.fillStyle = '#fff'; ctx.fillText('● you', x, ly);
  ctx.fillStyle = '#ff3355'; ctx.fillText('■ police', x + 44, ly);
  ctx.fillStyle = '#ffd166'; ctx.fillText('● goal', x + 102, ly);
  ctx.restore();
}

export function drawHud(ctx, state, W, H) {
  ctx.save();
  ctx.font = 'bold 20px system-ui'; ctx.textBaseline = 'top';
  // Cash and health, top right.
  ctx.fillStyle = 'rgba(8,12,24,0.72)'; ctx.fillRect(W - 252, 12, 240, 86);
  ctx.fillStyle = '#7bf1a8'; ctx.textAlign = 'right'; ctx.fillText('$' + state.cash.toLocaleString(), W - 24, 18);
  ctx.fillStyle = '#fff'; ctx.font = '14px system-ui';
  ctx.fillText('HP ' + Math.max(0, Math.round(state.player.health)) + '  ·  ' + (state.player.car ? state.player.car.name : 'On foot'), W - 24, 46);
  ctx.fillStyle = '#e63946'; ctx.fillRect(W - 228, 72, 200, 8);
  ctx.fillStyle = '#7bf1a8'; ctx.fillRect(W - 228, 72, 200 * Math.max(0, state.player.health) / 100, 8);
  // Wanted stars, top centre.
  ctx.textAlign = 'center'; ctx.font = '26px system-ui';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < state.wanted ? '#ffd166' : 'rgba(255,255,255,0.25)'; ctx.fillText('★', W / 2 - 52 + i * 26, 12); }
  // District, bottom left above the minimap: name plus its tagline, so crossing a
  // border into a new neighbourhood actually registers with the player.
  const d = districtAt(state.player.x, state.player.y);
  ctx.textAlign = 'left'; ctx.font = 'bold 16px system-ui'; ctx.fillStyle = d.color;
  ctx.fillText(d.name, 14, H - 196);
  ctx.font = '11px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(d.tagline || '', 14, H - 178);
  // Mission objective panel, top left.
  ctx.fillStyle = 'rgba(8,12,24,0.72)'; ctx.fillRect(12, 12, 360, state.objective ? 64 : 40);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 15px system-ui';
  if (state.objective) {
    ctx.fillText(state.objective.mission.title, 22, 18);
    ctx.fillStyle = '#fff'; ctx.font = '14px system-ui';
    ctx.fillText('▸ ' + state.objective.step.label, 22, 40);
    const step = state.objective.step;
    const dist = step && step.x !== undefined ? '  ·  ' + Math.round(distanceBetween(state.player.x, state.player.y, step.x, step.y)) + ' m away' : '  ·  escape!';
    ctx.fillStyle = '#9fb3c8'; ctx.fillText('Reward $' + state.objective.mission.reward + '  ·  ' + state.objective.mission.giver + dist, 22, 58);
  } else {
    ctx.fillText(state.missionsDone ? 'Story complete — free roam Solstice City' : 'Free roam — start a mission at a gold marker', 22, 22);
  }
  if (state.messageTimer > 0) {
    ctx.textAlign = 'center'; ctx.font = 'bold 22px system-ui';
    ctx.fillStyle = 'rgba(8,12,24,0.8)'; const w = ctx.measureText(state.message).width + 36; ctx.fillRect((W - w) / 2, H - 120, w, 40);
    ctx.fillStyle = '#ffd166'; ctx.fillText(state.message, W / 2, H - 112);
  }
  ctx.restore();
  drawMinimap(ctx, state, 12, H - 162, 168);
}
