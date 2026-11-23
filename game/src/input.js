// Keyboard and mouse input: held movement keys, one-shot actions, and the mouse aim point.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_SAVE = 8;
/** H (or the on-screen horn tap) — a one-shot car horn while driving. */
export const ACTION_HORN = 16;

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false, sprint: false };
  let actions = 0;
  const mouse = { x: 0, y: 0, down: false };
  const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code]) held[KEYMAP[e.code]] = true;
    else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') held.sprint = true;
    else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) actions |= ACTION_CONFIRM;
    else if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) actions |= ACTION_PAUSE;
    else if ((e.code === 'KeyE' || e.code === 'KeyF') && !e.repeat) actions |= ACTION_ENTER;
    else if (e.code === 'KeyH' && !e.repeat) actions |= ACTION_HORN;
    else if (e.code === 'KeyK' && !e.repeat) actions |= ACTION_SAVE;
    else return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) held[KEYMAP[e.code]] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') held.sprint = false;
  });
  window.addEventListener('blur', () => { held.up = held.down = held.left = held.right = held.sprint = false; mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  canvas.addEventListener('pointerdown', (e) => { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; actions |= ACTION_CONFIRM; });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  return {
    held, mouse,
    takeActions() { const a = actions; actions = 0; return a; },
  };
}
