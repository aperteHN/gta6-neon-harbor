// Screenshot scenes behind ?shot=start|play|chase|mission. Each stages the real game state:
// start shows the title over the city, play shows Mara on foot downtown with traffic and a
// mission marker, chase shows a 4-star police chase in a stolen car, mission shows the heist.
// Authoring pass: every scene now also faces Mara (and her car) toward the objective and
// parks two ambient traffic cars in frame, so the stills read as gameplay, not a map editor.
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

function frameScene(s, angle) {
  s.player.angle = angle;
  const near = s.cars.filter((c) => c.traffic).slice(0, 2);
  near.forEach((c, i) => { c.x = s.player.x + (i === 0 ? -190 : 210); c.y = s.player.y + (i === 0 ? 120 : -140); });
}

export function stageShot(name, game) {
  const s = game.state;
  if (name === 'play') {
    game.startPlay();
    s.player.x = 760; s.player.y = 760; s.player.car = null;
    s.cash = 850; game.setMission(1, 1);
    frameScene(s, 0.6);
    game.stepMany(90);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'chase') {
    game.startPlay();
    const car = s.cars[2]; car.stolen = true; car.traffic = false;
    s.player.car = car; car.x = 1560; car.y = 1560; car.angle = 0.4; car.speed = 260;
    s.player.x = car.x; s.player.y = car.y;
    s.cash = 2750; game.addWanted(4); game.setMission(3, 0);
    frameScene(s, 0.4);
    game.stepMany(50);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    game.startPlay();
    s.player.x = 980; s.player.y = 580; s.player.car = null;
    s.cash = 4100; game.addWanted(2); game.setMission(4, 1);
    frameScene(s, -0.4);
    game.stepMany(70);
    return { screen: SCREEN_PLAY };
  }
  // start: Mara at the marina, title over the harbour she just came home to.
  s.player.x = 420; s.player.y = 1820;
  frameScene(s, 0);
  game.stepMany(30);
  return { screen: SCREEN_TITLE };
}
