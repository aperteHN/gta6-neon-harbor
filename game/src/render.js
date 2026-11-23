// Rendering: top-down sun-soaked Solstice City, camera following the player, day glow,
// beach and water at the south edge, buildings with lit windows, cars, people, police,
// mission markers, muzzle flashes, plus title / pause / busted / ending screens.
import { WORLD, DISTRICTS } from './config.js';
import { isRoad } from './world.js';
import { drawHud } from './hud.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WIN = 'win';

function drawCar(ctx, car, isPlayer) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-20, -10 + 3, 44, 24);
  ctx.fillStyle = car.color; ctx.fillRect(-22, -11, 44, 22);
  ctx.fillStyle = '#12263a'; ctx.fillRect(-6, -9, 16, 18);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(20, -9, 3, 5); ctx.fillRect(20, 4, 3, 5);
  ctx.fillStyle = '#e63946'; ctx.fillRect(-23, -9, 3, 5); ctx.fillRect(-23, 4, 3, 5);
  ctx.fillStyle = '#111'; ctx.fillRect(-16, -14, 10, 4); ctx.fillRect(6, -14, 10, 4); ctx.fillRect(-16, 10, 10, 4); ctx.fillRect(6, 10, 10, 4);
  if (car.police) { ctx.fillStyle = '#fff'; ctx.fillRect(-22, -11, 44, 22); ctx.fillStyle = '#118ab2'; ctx.fillRect(-4, -11, 10, 22); ctx.fillStyle = '#e63946'; ctx.fillRect(-12, -3, 20, 6); }
  // A wrecked ride smokes from the bonnet — the visual half of vehicles.js' damage flag.
  if (car.smoking) { ctx.fillStyle = 'rgba(200,200,200,0.55)'; ctx.beginPath(); ctx.arc(16, 0, 6 + Math.sin(performance.now() / 140) * 2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(120,120,120,0.4)'; ctx.beginPath(); ctx.arc(22, -4, 9, 0, 7); ctx.fill(); }
  if (isPlayer) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.fill(); }
  ctx.restore();
}
function drawPerson(ctx, x, y, shirt, skin, angle, isPlayer, isCop) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(1, 2, 10, 0, 7); ctx.fill();
  ctx.fillStyle = isCop ? '#118ab2' : shirt; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 7); ctx.fill();
  if (isCop) { ctx.fillStyle = '#ffd166'; ctx.fillRect(-5, -8, 10, 3); }
  if (isPlayer) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke(); }
  ctx.restore();
  // Aim / facing tick.
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * 14, y + Math.sin(angle) * 14); ctx.stroke();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  function drawWorld(state) {
    const W = canvas.width, H = canvas.height;
    const camX = Math.max(0, Math.min(WORLD.width - W, state.player.x - W / 2));
    const camY = Math.max(0, Math.min(WORLD.height - H, state.player.y - H / 2));
    ctx.fillStyle = '#f4a261'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-camX, -camY);
    // Ground: sidewalks / blocks base.
    ctx.fillStyle = '#9aa5b1'; ctx.fillRect(camX - 10, camY - 10, W + 20, H + 20);
    // Roads.
    ctx.fillStyle = '#343a40';
    for (let gx = 0; gx <= WORLD.width / WORLD.block; gx++) ctx.fillRect(gx * WORLD.block, camY - 10, WORLD.road, H + 20);
    for (let gy = 0; gy <= WORLD.height / WORLD.block; gy++) ctx.fillRect(camX - 10, gy * WORLD.block, W + 20, WORLD.road);
    // Road markings: dashed centre lines on BOTH orientations (the draft only striped
    // the vertical avenues, so east-west streets looked unfinished), 20px dashes on a
    // 38px pitch, offset so intersections stay clean.
    ctx.fillStyle = '#ffd166';
    for (let gx = 0; gx <= WORLD.width / WORLD.block; gx++) for (let y = camY - (camY % 38); y < camY + H; y += 38) ctx.fillRect(gx * WORLD.block + WORLD.road / 2 - 1, y, 2, 20);
    for (let gy = 0; gy <= WORLD.height / WORLD.block; gy++) for (let x = camX - (camX % 38); x < camX + W; x += 38) ctx.fillRect(x, gy * WORLD.block + WORLD.road / 2 - 1, 20, 2);
    // District tint washes.
    for (const d of DISTRICTS) { ctx.fillStyle = d.color + '14'; ctx.fillRect(d.x, d.y, d.w, d.h); }
    // Beach + water at south.
    ctx.fillStyle = '#ffe8b3'; ctx.fillRect(0, WORLD.height - 90, WORLD.width, 90);
    ctx.fillStyle = '#2ec4e6'; ctx.fillRect(0, WORLD.height - 18, WORLD.width, 18);
    // Buildings (only near camera).
    for (const b of state.city.buildings) {
      if (b.x + b.w < camX - 40 || b.x > camX + W + 40 || b.y + b.h < camY - 40 || b.y > camY + H + 40) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
      ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = b.roof; ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
      ctx.fillStyle = 'rgba(255,209,102,0.85)';
      const cols = Math.max(1, Math.floor(b.w / 22)), rows = Math.max(1, Math.floor(b.h / 22));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if ((i * 7 + j * 13 + b.floors) % 3 === 0) ctx.fillRect(b.x + 8 + i * 22, b.y + 8 + j * 22, 7, 7);
      // Rooftop prop (assigned in world.js): a small silhouette near the roof centre.
      const px = b.x + b.w / 2 - 7, py = b.y + b.h / 2 - 7;
      if (b.prop === 'tank') { ctx.fillStyle = '#8d99ae'; ctx.beginPath(); ctx.arc(px + 7, py + 7, 8, 0, 7); ctx.fill(); }
      else if (b.prop === 'ac') { ctx.fillStyle = '#adb5bd'; ctx.fillRect(px, py, 14, 14); ctx.fillStyle = '#495057'; ctx.fillRect(px + 3, py + 3, 8, 8); }
      else if (b.prop === 'garden') { ctx.fillStyle = '#2a9d4a'; ctx.beginPath(); ctx.arc(px + 7, py + 7, 8, 0, 7); ctx.fill(); }
      else if (b.prop === 'helipad') { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 7, py + 7, 9, 0, 7); ctx.stroke(); }
    }
    // Palms.
    ctx.fillStyle = '#2a9d4a';
    for (const p of state.city.palms) { if (p.x < camX - 30 || p.x > camX + W + 30 || p.y < camY - 30 || p.y > camY + H + 30) continue; ctx.beginPath(); ctx.arc(p.x, p.y, 9 * p.s, 0, 7); ctx.fill(); ctx.fillStyle = '#2a9d4a'; }
    // Shops labels.
    ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    for (const s of state.city.shops) { ctx.fillStyle = '#fff'; ctx.fillText('◆ ' + s.name, s.x, s.y - 14); }
    // Mission marker: pulsing gold ring + beam.
    const obj = state.objective;
    if (obj && obj.step && obj.step.x) {
      const t = performance.now() / 300, r = 26 + Math.sin(t) * 6;
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(obj.step.x, obj.step.y, r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,209,102,0.25)'; ctx.fillRect(obj.step.x - 4, obj.step.y - 220, 8, 220);
      ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px system-ui'; ctx.fillText('▼ MISSION', obj.step.x, obj.step.y - 42);
    }
    // Cars, peds, police, player.
    for (const c of state.cars) drawCar(ctx, c, state.player.car === c);
    for (const p of state.peds) drawPerson(ctx, p.x, p.y, p.shirt, p.skin, p.angle, false, false);
    for (const cop of state.police) {
      if (cop.inCar) drawCar(ctx, { x: cop.x, y: cop.y, angle: cop.angle, color: '#ffffff', police: true }, false);
      else drawPerson(ctx, cop.x, cop.y, '#118ab2', '#f1c27d', cop.angle, false, true);
    }
    // Bullets.
    ctx.fillStyle = '#ffe66d';
    for (const b of state.bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    if (!state.player.car) drawPerson(ctx, state.player.x, state.player.y, '#ef476f', '#f1c27d', state.player.angle, true, false);
    ctx.restore();
    // Vignette + sunset grade.
    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) / 2.4, W / 2, H / 2, Math.max(W, H) / 1.2);
    grad.addColorStop(0, 'rgba(255,120,60,0)'); grad.addColorStop(1, 'rgba(30,10,50,0.28)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    return { camX, camY };
  }

  function panel(title, lines, prompt, accent = '#ffd166') {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(5,8,18,0.78)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent; ctx.font = '900 54px system-ui'; ctx.fillText(title, W / 2, H / 2 - 120);
    ctx.fillStyle = '#fff'; ctx.font = '19px system-ui';
    lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 - 58 + i * 28));
    ctx.fillStyle = accent; ctx.font = 'bold 21px system-ui'; ctx.fillText(prompt, W / 2, H / 2 + 60 + lines.length * 28);
  }

  function draw(state, screen) {
    drawWorld(state);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, state, canvas.width, canvas.height);
    if (screen === SCREEN_TITLE) panel('NEON HARBOR', ['SOLSTICE CITY HEIST — an original open-world crime game', 'You are Mara Vale, back in Solstice City with one car, no cash, and old friends in trouble.', 'Explore on foot and by car · Steal cars · Outrun the police · Run the 5-chapter story', 'WASD move · E enter / exit car · F steal · H horn · Mouse aim · Click shoot · Shift sprint · K save · P pause'], 'Press SPACE or click to start', '#ff5da2');
    else if (screen === SCREEN_PAUSED) panel('PAUSED', ['Progress is kept in this browser with K (save).', 'Close the tab and your cash, missions and car are still here.'], 'Press P to resume');
    else if (screen === SCREEN_BUSTED) panel('BUSTED', ['The Solstice police got Mara. You lost some cash and woke up at Harbor Customs.'], 'Press SPACE to continue', '#e63946');
    else if (screen === SCREEN_OVER) panel('WASTED', ['Mara did not make it. The city keeps her cash and story progress.'], 'Press SPACE to respawn', '#e63946');
    else if (screen === SCREEN_WIN) panel('HEIST COMPLETE ★', ['Mara, Rico and Sana vanished across Coral Beach with the gold.', 'Free roam Solstice City: steal, race the traffic, and chase a 5-star wanted level.'], 'Press SPACE to keep roaming', '#7bf1a8');
  }
  return { draw };
}
export { isRoad };
