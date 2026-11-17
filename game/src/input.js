export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

export function createInput(canvas) {
  const keysDown = new Set();
  const keysPressed = new Set();
  let enterPressed = false;
  let actionPressed = false;
  let confirmTriggered = false;
  let pauseTriggered = false;

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.code) || e.key === ' ' || e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
    if (!keysDown.has(e.code)) {
      keysPressed.add(e.code);
      if (e.code === 'KeyE') enterPressed = true;
      if (e.code === 'KeyF') actionPressed = true;
      if (e.code === 'Enter' || e.code === 'Space' || e.key === ' ') confirmTriggered = true;
      if (e.code === 'KeyP' || e.code === 'Escape') pauseTriggered = true;
    }
    keysDown.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });

  if (canvas) {
    canvas.addEventListener('click', () => {
      confirmTriggered = true;
    });
  }

  function read() {
    let mx = 0;
    let my = 0;

    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) mx -= 1;
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) mx += 1;
    if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) my -= 1;
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) my += 1;

    const handbrake = keysDown.has('Space') || keysDown.has(' ');

    const enter = enterPressed;
    const action = actionPressed;
    const keys = new Set(keysPressed);

    enterPressed = false;
    actionPressed = false;
    keysPressed.clear();

    return { mx, my, enter, action, handbrake, keys };
  }

  function takeActions() {
    let bits = 0;
    if (confirmTriggered) bits |= ACTION_CONFIRM;
    if (pauseTriggered) bits |= ACTION_PAUSE;
    confirmTriggered = false;
    pauseTriggered = false;
    return bits;
  }

  return { read, takeActions };
}
