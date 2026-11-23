// Vehicles: parked cars to steal, moving traffic that follows the road grid, and car physics.
import { WORLD, CAR } from './config.js';
import { isRoad, collide } from './world.js';

const CAR_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f8f9fa', '#adb5bd', '#ff7b00', '#9d4edd', '#00f5d4'];
const CAR_NAMES = ['Comet Cabrio', 'Harbor Sedan', 'Palm Pickup', 'Solstice Coupe', 'Port Van', 'Coral Hatch'];

export function createVehicles(rand, buildings) {
  const cars = [];
  let id = 0;
  // Parked cars on roads near blocks.
  for (let i = 0; i < 42; i++) {
    let x = 0, y = 0, tries = 0;
    do { x = 60 + rand() * (WORLD.width - 120); y = 60 + rand() * (WORLD.height - 120); tries++; } while ((!isRoad(x, y) || collide(buildings, x, y, 22)) && tries < 30);
    const horizontal = Math.round(rand()) === 0;
    cars.push({ id: id++, x, y, angle: horizontal ? 0 : Math.PI / 2, speed: 0, color: CAR_COLORS[i % CAR_COLORS.length], name: CAR_NAMES[i % CAR_NAMES.length], traffic: false, driver: true, health: 100, parked: true });
  }
  // A deliberate parked cluster at Coral Beach: the getaway shore always has wheels,
  // lined up along the pier road facing the water.
  for (let i = 0; i < 6; i++) {
    cars.push({ id: id++, x: 2320 + i * 118, y: 2236, angle: Math.PI / 2, speed: 0, color: CAR_COLORS[(i + 5) % CAR_COLORS.length], name: CAR_NAMES[(i + 1) % CAR_NAMES.length], traffic: false, driver: true, health: 100, parked: true, beach: true });
  }
  // Traffic cars driving loops on avenues.
  for (let i = 0; i < 16; i++) {
    const avenueX = 34 + Math.floor(rand() * 16) * WORLD.block;
    const avenueY = 34 + Math.floor(rand() * 12) * WORLD.block;
    const vertical = rand() < 0.5;
    cars.push({ id: id++, x: vertical ? avenueX : rand() * WORLD.width, y: vertical ? rand() * WORLD.height : avenueY, angle: vertical ? Math.PI / 2 : 0, speed: 90 + rand() * 70, color: CAR_COLORS[(i + 3) % CAR_COLORS.length], name: CAR_NAMES[(i + 2) % CAR_NAMES.length], traffic: true, driver: true, health: 100, parked: false, dir: rand() < 0.5 ? 1 : -1, vertical });
  }
  return cars;
}

export function stepTraffic(cars, dt, buildings, playerCar = null) {
  for (const c of cars) {
    if (!c.traffic || c.stolen) continue;
    // Traffic politely brakes when the player's car is right ahead of it, instead of
    // ploughing through the chase: it keeps pursuits readable and pile-ups rare.
    let speedScale = 1;
    if (playerCar) {
      const aheadX = c.x + Math.cos(c.angle) * 58, aheadY = c.y + Math.sin(c.angle) * 58;
      if (Math.hypot(playerCar.x - aheadX, playerCar.y - aheadY) < 34) speedScale = 0.25;
    }
    const dist = c.speed * speedScale * c.dir * dt;
    let nx = c.x + (c.vertical ? 0 : dist);
    let ny = c.y + (c.vertical ? dist : 0);
    if (nx < 30 || nx > WORLD.width - 30 || ny < 30 || ny > WORLD.height - 30 || collide(buildings, nx, ny, 18)) {
      c.dir *= -1;
      c.angle += Math.PI;
    } else { c.x = nx; c.y = ny; c.angle = c.vertical ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI); }
  }
}

export function stepPlayerCar(car, dt, input, buildings) {
  const throttle = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  if (throttle > 0) car.speed = Math.min(CAR.maxSpeed, car.speed + CAR.accel * dt);
  else if (throttle < 0) car.speed = Math.max(-CAR.reverse, car.speed - CAR.accel * 0.8 * dt);
  else car.speed *= Math.max(0, 1 - 1.6 * dt);
  if (Math.abs(car.speed) > 5) {
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    car.angle += steer * CAR.turn * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 160);
  }
  const dx = Math.cos(car.angle) * car.speed * dt;
  const dy = Math.sin(car.angle) * car.speed * dt;
  const nx = car.x + dx, ny = car.y + dy;
  if (collide(buildings, nx, ny, 20)) { car.health = Math.max(0, car.health - Math.abs(car.speed) * 0.03); car.smoking = car.health < 40; car.speed *= -0.25; }
  else { car.x = Math.max(24, Math.min(WORLD.width - 24, nx)); car.y = Math.max(24, Math.min(WORLD.height - 24, ny)); }
  return Math.abs(car.speed);
}
