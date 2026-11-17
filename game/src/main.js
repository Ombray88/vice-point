import { STEP, BEST_KEY, SAVE_KEY, CAR } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_BUSTED, EVENT_MISSION } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { MISSIONS } from './missions.js';
import { createAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || Date.now();
const shot = params.get('shot');

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(val) {
  try {
    const best = readBest();
    if (val > best) {
      localStorage.setItem(BEST_KEY, String(val));
    }
  } catch {}
}

function saveGame(state) {
  try {
    const data = {
      money: state.money,
      score: state.score,
      missionIndex: state.mission ? state.mission.index : 0,
      best: readBest(),
      savedAt: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch {
    return null;
  }
}

if (shot !== null) {
  const world = createWorld(createRandom(seed));
  const renderer = createRenderer(canvas);
  const scene = stageShot(shot, world);
  renderer.draw(world.state, scene.screen, scene.best);
  renderer.draw(world.state, scene.screen, scene.best);
  window.__shotReady = true;
} else {
  runGame();
}

function runGame() {
  const world = createWorld(createRandom(seed));
  const renderer = createRenderer(canvas);
  const input = createInput(canvas);
  const audio = createAudio();

  let screen = SCREEN_TITLE;
  let savedGame = loadSave();

  if (savedGame) {
    announce(`Save found: $${savedGame.money}, mission ${savedGame.missionIndex + 1} — press C to continue`);
  } else {
    announce("Vice Point. Press Enter or click to start.");
  }

  let lastTime = performance.now();
  let accumulator = 0;
  const MAX_FRAME = 0.25;
  let prevHealth = world.state.health;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastTime = performance.now();
    }
  });

  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;

    const inp = input.read();
    const actions = input.takeActions();

    if (inp.enter || actions & ACTION_CONFIRM || inp.action || inp.handbrake || inp.keys.size > 0) {
      audio.ensure();
    }

    if (screen === SCREEN_TITLE) {
      world.step(STEP, { mx: 0, my: 0, enter: false, action: false, handbrake: false }, true);

      if (savedGame && inp.keys.has('KeyC')) {
        world.reset();
        world.state.money = savedGame.money;
        world.state.score = savedGame.score;
        const idx = Math.max(0, Math.min(4, savedGame.missionIndex));
        const def = MISSIONS[idx] || MISSIONS[0];
        world.state.mission = {
          index: idx,
          stage: 0,
          target: { x: def.target.x, y: def.target.y, label: def.target.label },
          timer: def.timeLimit,
          text: def.brief
        };
        screen = SCREEN_PLAY;
        announce(`Resumed mission: ${def.title}`);
        audio.blip();
      } else if (inp.enter || actions & ACTION_CONFIRM || inp.keys.has('Enter')) {
        audio.ensure();
        audio.blip();
        world.reset();
        screen = SCREEN_PLAY;
        announce("Playing Vice Point. Use WASD/arrows to move, E to enter car, F to punch, P to pause.");
      }
    } else if (screen === SCREEN_PLAY) {
      audio.tick(STEP);
      audio.setDriving(world.state.player.onFoot ? 0 : world.state.player.speed / CAR.maxSpeed);
      audio.siren(world.state.wanted > 0);

      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP, inp, false);

        if (events & EVENT_MISSION) {
          audio.mission();
          saveGame(world.state);
          announce(`Mission progress / completed: ${world.state.mission ? world.state.mission.text : ''}`);
        }
        if (events & EVENT_BUSTED) {
          audio.crash();
          announce("Busted! The cops took 30% of your cash.");
        }
        if (events & EVENT_OVER || world.state.over) {
          audio.crash();
          screen = SCREEN_OVER;
          saveBest(world.state.score);
          saveGame(world.state);
          announce("Game Over. Press Enter to restart.");
        }
        if (world.state.win && screen === SCREEN_PLAY) {
          screen = SCREEN_WIN;
          saveBest(world.state.score);
          saveGame(world.state);
          announce("You Win! Vice Point is yours. Press Enter to play again.");
        }

        if (world.state.health < prevHealth) {
          audio.crash();
        }
        prevHealth = world.state.health;
      }

      if (actions & ACTION_PAUSE || inp.keys.has('KeyP') || inp.keys.has('Escape')) {
        screen = SCREEN_PAUSED;
        saveGame(world.state);
        audio.blip();
        announce("Game Paused. Press P or Enter to resume.");
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & ACTION_PAUSE || inp.keys.has('KeyP') || inp.keys.has('Escape') || inp.enter || actions & ACTION_CONFIRM) {
        screen = SCREEN_PLAY;
        audio.blip();
        announce("Resumed game.");
      }
    } else if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (inp.enter || actions & ACTION_CONFIRM) {
        audio.blip();
        world.reset();
        screen = SCREEN_PLAY;
        announce("New game started.");
      }
    }

    renderer.draw(world.state, screen, readBest());
  }

  requestAnimationFrame(loop);
}
