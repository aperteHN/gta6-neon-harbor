// Neon Harbor — Solstice City Heist: boot, game state, and the main loop.
// Open world: explore on foot and by car, steal cars, traffic and pedestrians, wanted level
// and police, shooting combat, a 5-chapter mission story, HUD with minimap, save / load.
// ?seed=N fixes the city. ?shot=start|play|chase|mission stages a scene for screenshots.
import { STEP, PLAYER, WANTED } from './config.js';
import { createRandom } from './random.js';
import { createCity, moveWithCollision } from './world.js';
import { createVehicles, stepTraffic, stepPlayerCar } from './vehicles.js';
import { createPedestrians, stepPedestrians, createPolice, stepPolice, spawnPolice } from './people.js';
import { createMissionState, currentObjective, advanceMission, freeRoamIdea } from './missions.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_SAVE, ACTION_HORN } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_BUSTED, SCREEN_OVER, SCREEN_WIN } from './render.js';
import { createAudio } from './audio.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261117;
const rand = createRandom(seed);
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();

const state = {
  city: createCity(seed),
  cars: [], peds: createPedestrians(rand), police: createPolice(), bullets: [],
  player: { x: 420, y: 1820, angle: 0, health: PLAYER.health, car: null },
  cash: 0, wanted: 0, wantedTimer: 0, bustedTimer: 0,
  missions: createMissionState(), missionsDone: false, objective: null,
  message: '', messageTimer: 0, time: 0, shotsFired: 0,
};
state.cars = createVehicles(rand, state.city.buildings);

function refreshObjective() {
  state.objective = currentObjective(state.missions);
  state.missionsDone = state.missions.done;
}
refreshObjective();

function say(msg, seconds = 3.5) { state.message = msg; state.messageTimer = seconds; status.textContent = msg; }
function addWanted(n) { state.wanted = Math.max(0, Math.min(WANTED.max, state.wanted + n)); state.wantedTimer = 14; if (n > 0) audio.siren(); }
function setMission(index, step) { state.missions.index = index; state.missions.step = step; state.missions.done = false; refreshObjective(); }

function saveGame() {
  writeSave({ cash: state.cash, missions: { index: state.missions.index, step: state.missions.step, done: state.missions.done }, x: state.player.x, y: state.player.y, health: state.player.health });
  say('Saved. Cash $' + state.cash + ' · Mission ' + (state.missions.index + 1));
}
function loadGame() {
  const s = loadSave(); if (!s) return false;
  state.cash = s.cash || 0;
  if (s.missions) { state.missions.index = s.missions.index || 0; state.missions.step = s.missions.step || 0; state.missions.done = !!s.missions.done; }
  state.player.x = s.x || state.player.x; state.player.y = s.y || state.player.y; state.player.health = s.health || 100;
  refreshObjective(); return true;
}

function nearestCar(maxDist) {
  let best = null, bd = maxDist;
  for (const c of state.cars) { const d = Math.hypot(c.x - state.player.x, c.y - state.player.y); if (d < bd) { bd = d; best = c; } }
  return best;
}
function enterOrExitCar() {
  if (state.player.car) {
    const car = state.player.car; state.player.car = null;
    state.player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30; state.player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
    audio.enterCar(); return;
  }
  const car = nearestCar(52);
  if (!car) { say('No car close enough — walk to a car and press E'); return; }
  if (car.traffic && !car.stolen) { car.stolen = true; car.traffic = false; addWanted(1); say('Car stolen! Wanted level up — the police are coming'); }
  else say('Driving the ' + car.name);
  state.player.car = car; car.parked = false; audio.enterCar(); audio.startMusic();
}
function shoot(input) {
  const p = state.player;
  const mx = input.mouse.x, my = input.mouse.y;
  const angle = p.car ? p.angle : Math.atan2(my - window.innerHeight / 2, mx - window.innerWidth / 2);
  state.bullets.push({ x: p.x + Math.cos(angle) * 18, y: p.y + Math.sin(angle) * 18, vx: Math.cos(angle) * 720, vy: Math.sin(angle) * 720, life: 0.55 });
  state.shotsFired++; audio.shoot();
  if (state.shotsFired % 3 === 0) addWanted(1);
}
function respawn(busted) {
  state.cash = Math.max(0, state.cash - (busted ? 200 : 0));
  state.wanted = 0; state.police = []; state.player.health = 100; state.player.car = null;
  state.player.x = 340; state.player.y = 1780; state.bustedTimer = 0;
}

function checkMission() {
  const obj = state.objective; if (!obj) return;
  const step = obj.step;
  if (step.kind === 'escape') {
    if (state.wanted <= 0) finishStep();
    return;
  }
  const d = Math.hypot(state.player.x - step.x, state.player.y - step.y);
  if (d < 56) finishStep();
}
function finishStep() {
  const obj = state.objective;
  const result = advanceMission(state.missions, (n) => addWanted(0));
  if (obj.mission.wanted && state.missions.step === 0 && result.finished) { /* wanted applied below */ }
  if (result.finished) {
    state.cash += result.reward; audio.cash(); audio.missionComplete();
    if (result.allDone) { say('HEIST COMPLETE! Final reward $' + result.reward, 6); screen = SCREEN_WIN; }
    else {
      say('Mission complete: $' + result.reward + ' — next: ' + currentObjective(state.missions).mission.title, 5);
      const next = currentObjective(state.missions);
      if (next && next.mission.wanted) { /* wanted triggers on its pickup steps via addWanted in step check */ }
    }
    // Apply the completed mission's wanted level as heat for the next chapter.
    refreshObjective(); saveGameSilent();
  } else {
    audio.pickup(); say('Objective done — ' + state.objective.step.label, 3.5); refreshObjective();
  }
}
function saveGameSilent() { writeSave({ cash: state.cash, missions: { index: state.missions.index, step: state.missions.step, done: state.missions.done }, x: state.player.x, y: state.player.y, health: state.player.health }); }

let screen = SCREEN_TITLE;
function startPlay() { if (screen === SCREEN_TITLE) loadGame(); screen = SCREEN_PLAY; audio.startMusic(); say(state.objective ? state.objective.mission.title + ' — ' + state.objective.step.label : 'Free roam Solstice City · ' + freeRoamIdea(state.missions), 4); }

function stepGame(dt, input) {
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  const p = state.player;
  // Wanted decay when police cannot see the player.
  const policeNear = state.police.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 260);
  if (state.wanted > 0 && !policeNear) { state.wantedTimer -= dt; if (state.wantedTimer <= 0) { state.wanted = Math.max(0, state.wanted - 1); state.wantedTimer = 10; if (state.wanted === 0) say('You lost the police. Heat is off.'); } }
  else if (state.wanted > 0) state.wantedTimer = 8;

  if (p.car) {
    const speed = stepPlayerCar(p.car, dt, input.held, state.city.buildings);
    p.x = p.car.x; p.y = p.car.y; p.angle = p.car.angle;
    if (speed > 240 && state.wanted === 0 && Math.random() < 0.002) addWanted(1);
    // Running over / crashing near peds panics them (no gore: they dive away).
  } else if (state.wanted === 0 && p.health > 0 && p.health < PLAYER.health) {
    // Quiet streets are good medicine: health creeps back while nobody is hunting Mara.
    p.health = Math.min(PLAYER.health, p.health + PLAYER.regenPerSec * dt);
  }
  if (!p.car) {
    const sp = (input.held.sprint ? PLAYER.sprint : PLAYER.walk);
    let dx = ((input.held.right ? 1 : 0) - (input.held.left ? 1 : 0)) * sp * dt;
    let dy = ((input.held.down ? 1 : 0) - (input.held.up ? 1 : 0)) * sp * dt;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    if (dx || dy) p.angle = Math.atan2(dy, dx);
    moveWithCollision(state.city.buildings, p, dx, dy, PLAYER.radius);
  }
  if (input.mouse.down && !p.car && state.time % 0.12 < dt) shoot(input);
  if (input.mouse.down && p.car && state.time % 0.18 < dt) shoot(input);

  // Bullets vs police and cars.
  for (const b of state.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const cop of state.police) if (Math.hypot(cop.x - b.x, cop.y - b.y) < 16) { cop.health -= 30; b.life = 0; }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
  state.police = state.police.filter((c) => c.health > 0);

  stepTraffic(state.cars, dt, state.city.buildings, p.car);
  stepPedestrians(state.peds, dt, rand, state.city.buildings, (state.wanted > 0 || p.car) ? p : null);
  spawnPolice(state.police, state.wanted, rand, p);
  stepPolice(state.police, dt, p, state.city.buildings);
  // Police contact: damage on foot, busted if surrounded while slow.
  let closeCount = 0;
  for (const cop of state.police) {
    if (!cop.close) continue; closeCount++;
    if (!p.car) p.health -= 9 * dt;
  }
  const playerSpeed = p.car ? Math.abs(p.car.speed) : 0;
  if (closeCount >= 2 && playerSpeed < 30 && !p.car) { state.bustedTimer += dt; if (state.bustedTimer > 1.6) { screen = SCREEN_BUSTED; audio.busted(); } }
  else state.bustedTimer = Math.max(0, state.bustedTimer - dt);
  if (p.health <= 0) { screen = SCREEN_OVER; audio.busted(); }
  checkMission();
}

// Small API used by shots.js to stage deterministic scenes.
const gameApi = {
  state,
  startPlay() { screen = SCREEN_PLAY; },
  setMission, addWanted,
  stepMany(n) { const fake = { held: { up: false, down: false, left: false, right: false, sprint: false }, mouse: { x: 0, y: 0, down: false } }; for (let i = 0; i < n; i++) stepGame(STEP, fake); },
};

const renderer = createRenderer(canvas);
if (shot) {
  const scene = stageShot(shot, gameApi);
  let painted = 0;
  const paint = () => { renderer.draw(state, scene.screen); painted++; if (painted < 3) requestAnimationFrame(paint); else window.__shotReady = true; };
  requestAnimationFrame(paint);
} else {
  const input = createInput(canvas);
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25); last = now;
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) startPlay();
      else if (screen === SCREEN_BUSTED) { respawn(true); screen = SCREEN_PLAY; }
      else if (screen === SCREEN_OVER) { respawn(false); screen = SCREEN_PLAY; }
      else if (screen === SCREEN_WIN) screen = SCREEN_PLAY;
    }
    if (actions & ACTION_PAUSE) screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : (screen === SCREEN_PLAY ? SCREEN_PAUSED : screen);
    if ((actions & ACTION_ENTER) && screen === SCREEN_PLAY) enterOrExitCar();
    if ((actions & ACTION_HORN) && screen === SCREEN_PLAY) {
      // Horn: pure theatre on foot, genuinely useful in a car — nearby pedestrians scatter.
      audio.horn(!!state.player.car);
      if (state.player.car) for (const ped of state.peds) if (Math.hypot(ped.x - state.player.x, ped.y - state.player.y) < 110) ped.panic = Math.max(ped.panic, 0.9);
    }
    if ((actions & ACTION_SAVE) && screen === SCREEN_PLAY) saveGame();
    if (screen === SCREEN_PLAY) { while (acc >= STEP) { stepGame(STEP, input); acc -= STEP; if (screen !== SCREEN_PLAY) { acc = 0; break; } } }
    else acc = 0;
    renderer.draw(state, screen);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === SCREEN_PLAY) screen = SCREEN_PAUSED; });
  window.addEventListener('beforeunload', () => { if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) saveGameSilent(); });
  status.textContent = 'Neon Harbor. Press Space to start.';
  requestAnimationFrame(frame);
}
export { gameApi };
