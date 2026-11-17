/**
 * @file shots.js
 * @description Automated cinematic shot staging driver for Vice Point.
 */

import { STEP, POLICE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN } from './render.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function stageShot(name, world) {
  let state = world.state;
  const dt = STEP;

  function pilot(evade = false) {
    const p = state.player;
    if (p.onFoot) {
      // Prefer a parked car (speed < 10); fall back to any civilian car.
      let nearestCar = null;
      let minDist = Infinity;
      for (const parkedOnly of [true, false]) {
        for (const car of state.cars) {
          if (car.isPolice) continue;
          if (parkedOnly && car.speed >= 10) continue;
          if (!parkedOnly && car.speed < 10) continue;
          const dist = Math.hypot(car.x - p.x, car.y - p.y);
          if (dist < minDist) {
            minDist = dist;
            nearestCar = car;
          }
        }
        if (nearestCar) break;
      }
      if (nearestCar) {
        const dx = nearestCar.x - p.x;
        const dy = nearestCar.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) {
          return { mx: 0, my: 0, enter: true, action: false, handbrake: false };
        }
        return {
          mx: dx / dist,
          my: dy / dist,
          enter: dist < 40,
          action: false,
          handbrake: false
        };
      }
      return { mx: 0, my: 0, enter: false, action: false, handbrake: false };
    } else {
      const car = state.cars.find(c => c.id === p.carId);
      if (!car) return { mx: 0, my: 1, enter: false, action: false, handbrake: false };

      // Check if evade mode is active (police nearby)
      let targetX = state.mission.target.x;
      let targetY = state.mission.target.y;

      if (evade) {
        let nearestCop = null;
        let minCopDist = Infinity;
        for (const copCarId of state.police) {
          const copCar = state.cars.find(c => c.id === copCarId.carId);
          if (copCar) {
            const dist = Math.hypot(copCar.x - car.x, copCar.y - car.y);
            if (dist < minCopDist) {
              minCopDist = dist;
              nearestCop = copCar;
            }
          }
        }
        if (nearestCop && minCopDist < 140) {
          // Steer away from cop
          targetX = car.x + (car.x - nearestCop.x);
          targetY = car.y + (car.y - nearestCop.y);
        }
      }

      const desired = Math.atan2(targetY - car.y, targetX - car.x);
      const diff = normalizeAngle(desired - car.angle);
      const mx = clamp(diff * 2, -1, 1);
      const my = 1;

      return { mx, my, enter: false, action: false, handbrake: false };
    }
  }

  if (name === 'start') {
    world.reset();
    state = world.state;
    for (let i = 0; i < Math.round(5 / dt); i++) {
      world.step(dt, { mx: 0, my: 0, enter: false, action: false, handbrake: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    world.reset();
    state = world.state;
    // 1. Walk and steal car (up to 12s)
    let stepsToSteal = Math.round(12 / dt);
    for (let i = 0; i < stepsToSteal; i++) {
      const input = pilot(false);
      world.step(dt, input, false);
      if (!state.player.onFoot) break;
    }

    // 2. Drive toward mission target for 8s
    let stepsDrive = Math.round(8 / dt);
    for (let i = 0; i < stepsDrive; i++) {
      const input = pilot(false);
      world.step(dt, input, false);
    }

    // 3. Spawn police (3 cars)
    state.wantedHeat = 3;
    state.wanted = 3;
    const p = state.player;
    for (let i = 0; i < 3; i++) {
      const angle = i * 2.1 + 0.5;
      const px = p.x + Math.cos(angle) * 500;
      const py = p.y + Math.sin(angle) * 500;
      const carId = 'police_shot_' + i;
      state.cars.push({
        id: carId,
        x: px,
        y: py,
        angle: 0,
        speed: 0,
        color: '#e5534b',
        isPolice: true,
        stolen: false,
        driver: 'cop'
      });
      state.police.push({ carId });
    }

    // 4. Drive with evade variant for 18s
    let stepsEvade = Math.round(18 / dt);
    for (let i = 0; i < stepsEvade; i++) {
      const input = pilot(true);
      world.step(dt, input, false);
    }

    state.health = 100;
    state.over = false;
    return { screen: SCREEN_PLAY, best: state.money };
  }

  if (name === 'chase') {
    world.reset();
    state = world.state;
    // 1. Walk and steal car (up to 12s)
    let stepsToSteal = Math.round(12 / dt);
    for (let i = 0; i < stepsToSteal; i++) {
      const input = pilot(false);
      world.step(dt, input, false);
      if (!state.player.onFoot) break;
    }

    // 2. Drive toward mission target for 6s
    let stepsDrive = Math.round(6 / dt);
    for (let i = 0; i < stepsDrive; i++) {
      const input = pilot(false);
      world.step(dt, input, false);
    }

    // 3. Spawn police (4 cars)
    state.wantedHeat = 4;
    state.wanted = 4;
    const p = state.player;
    for (let i = 0; i < 4; i++) {
      const angle = i * (Math.PI / 2) + 0.3;
      const px = p.x + Math.cos(angle) * 450;
      const py = p.y + Math.sin(angle) * 450;
      const carId = 'police_chase_' + i;
      state.cars.push({
        id: carId,
        x: px,
        y: py,
        angle: 0,
        speed: 0,
        color: '#e5534b',
        isPolice: true,
        stolen: false,
        driver: 'cop'
      });
      state.police.push({ carId });
    }

    // 4. Drive with evade variant for 12s
    let stepsEvade = Math.round(12 / dt);
    for (let i = 0; i < stepsEvade; i++) {
      const input = pilot(true);
      world.step(dt, input, false);
    }

    state.health = 100;
    state.over = false;
    return { screen: SCREEN_PLAY, best: state.money };
  }

  if (name === 'end') {
    world.reset();
    state = world.state;
    state.win = true;
    state.money = 22500;
    state.mission.index = 5;
    return { screen: SCREEN_WIN, best: 22500 };
  }

  // Default / fallback
  world.reset();
  state = world.state;
  for (let i = 0; i < Math.round(5 / dt); i++) {
    world.step(dt, { mx: 0, my: 0, enter: false, action: false, handbrake: false }, true);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
