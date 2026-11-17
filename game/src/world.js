/**
 * @file world.js
 * @description World simulation, city generation, physics, AI, combat, and mission logic for Vice Point.
 * Exports: createWorld, EVENT_OVER, EVENT_BUSTED, EVENT_MISSION, EVENT_WANTED
 */

import { WORLD, PLAYER, CAR, TRAFFIC, PEDS, POLICE, WANTED } from './config.js';

export const EVENT_OVER = 1;
export const EVENT_BUSTED = 2;
export const EVENT_MISSION = 4;
export const EVENT_WANTED = 8;

const MISSIONS = [
  {
    id: 0,
    title: 'Hotwire',
    brief: 'Mara Voss says you need wheels. Steal any civilian car near the plaza.',
    target: { kind: 'car', x: 1280, y: 1000, label: 'Steal a car' },
    reward: 1000,
    timeLimit: 60
  },
  {
    id: 1,
    title: 'Courier',
    brief: 'Deliver the package to the port warehouse on the east side before time runs out.',
    target: { kind: 'place', x: 2400, y: 960, label: 'Port Warehouse' },
    reward: 2500,
    timeLimit: 75
  },
  {
    id: 2,
    title: 'Getaway',
    brief: 'Attract the heat! Reach 3 stars wanted level and survive for 25 seconds.',
    target: { kind: 'evade', x: 1280, y: 960, label: 'Survive 3+ Stars' },
    reward: 4000,
    timeLimit: 25
  },
  {
    id: 3,
    title: 'Collection',
    brief: 'Collect 3 hidden cash drops scattered around downtown Vice Point.',
    target: { kind: 'collect', x: 900, y: 700, label: 'Cash Drop' },
    reward: 5000,
    timeLimit: 90
  },
  {
    id: 4,
    title: 'The Big Score',
    brief: 'Hit the downtown bank, then escape to the safehouse on the north side with wanted>=3!',
    target: { kind: 'escape', x: 1280, y: 400, label: 'Bank / Safehouse' },
    reward: 10000,
    timeLimit: 120
  }
];

export function createWorld(random) {
  let state = {};

  function reset() {
    state = {
      time: 0,
      score: 0,
      money: 0,
      health: PLAYER.health,
      wanted: 0,
      wantedHeat: 0,
      player: {
        x: WORLD.width / 2,
        y: WORLD.height / 2 + 100,
        angle: 0,
        speed: 0,
        onFoot: true,
        carId: null
      },
      cars: [],
      peds: [],
      police: [],
      buildings: [],
      roads: { vertical: [], horizontal: [] },
      parks: [],
      beach: { y: WORLD.height - 200 },
      water: { y: WORLD.height - 120 },
      mission: {
        index: 0,
        stage: 0,
        target: { x: 1280, y: 1000, label: MISSIONS[0].target.label },
        timer: MISSIONS[0].timeLimit,
        text: MISSIONS[0].brief
      },
      camera: { x: WORLD.width / 2, y: WORLD.height / 2 },
      message: 'Welcome to Vice Point. Press E to steal cars, F to punch.',
      messageTimer: 4,
      busted: false,
      over: false,
      win: false
    };

    generateCity(random);
    spawnInitialEntities(random);
  }

  function generateCity(rnd) {
    const vRoads = [];
    for (let x = 320; x < WORLD.width - 200; x += 320) {
      vRoads.push(x);
    }
    const hRoads = [];
    for (let y = 280; y < WORLD.height - 300; y += 280) {
      hRoads.push(y);
    }
    state.roads.vertical = vRoads;
    state.roads.horizontal = hRoads;

    const roadWidth = 64;
    const sidewalkWidth = 14;

    // Generate buildings in blocks between roads
    let xCoords = [160, ...vRoads, WORLD.width - 160];
    let yCoords = [140, ...hRoads, WORLD.height - 240];

    for (let i = 0; i < vRoads.length + 1; i++) {
      for (let j = 0; j < hRoads.length + 1; j++) {
        const x1 = (i === 0 ? 80 : vRoads[i - 1] + roadWidth / 2 + sidewalkWidth);
        const x2 = (i === vRoads.length ? WORLD.width - 80 : vRoads[i] - roadWidth / 2 - sidewalkWidth);
        const y1 = (j === 0 ? 70 : hRoads[j - 1] + roadWidth / 2 + sidewalkWidth);
        const y2 = (j === hRoads.length ? state.beach.y - 20 : hRoads[j] - roadWidth / 2 - sidewalkWidth);

        if (x2 > x1 + 40 && y2 > y1 + 40) {
          // Park block at specific index
          if (i === 1 && j === 1) {
            state.parks.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
          } else {
            // Subdivide block into 1-4 buildings
            const bw = x2 - x1;
            const bh = y2 - y1;
            const colIndex = Math.floor(rnd.next() * 8);
            const buildingColor = ['#5c6375', '#4b5263', '#625b71', '#4a525d', '#535c68', '#424949', '#566573', '#34495e'][colIndex % 8];
            state.buildings.push({
              x: x1 + 4,
              y: y1 + 4,
              w: bw - 8,
              h: bh - 8,
              color: buildingColor,
              roof: '#1c1f26'
            });
          }
        }
      }
    }
  }

  function spawnInitialEntities(rnd) {
    // 3 Parked / civilian cars near center
    const spawnCars = [
      { x: WORLD.width / 2 - 80, y: WORLD.height / 2 + 40 },
      { x: WORLD.width / 2 + 80, y: WORLD.height / 2 + 40 },
      { x: WORLD.width / 2, y: WORLD.height / 2 + 160 }
    ];

    spawnCars.forEach((pos, idx) => {
      state.cars.push({
        id: 'car_' + idx,
        x: pos.x,
        y: pos.y,
        angle: 0,
        speed: 0,
        color: ['#e06c75', '#98c379', '#61afef'][idx],
        isPolice: false,
        stolen: false,
        driver: null
      });
    });

    // Traffic cars
    for (let i = 0; i < TRAFFIC.count; i++) {
      const vRoad = state.roads.vertical[Math.floor(rnd.next() * state.roads.vertical.length)];
      const hRoad = state.roads.horizontal[Math.floor(rnd.next() * state.roads.horizontal.length)];
      const isVert = rnd.next() > 0.5;
      state.cars.push({
        id: 'traffic_' + i,
        x: isVert ? vRoad + (rnd.next() > 0.5 ? 16 : -16) : vRoad,
        y: isVert ? hRoad : hRoad + (rnd.next() > 0.5 ? 16 : -16),
        angle: isVert ? (rnd.next() > 0.5 ? 0 : Math.PI) : (rnd.next() > 0.5 ? Math.PI / 2 : -Math.PI / 2),
        speed: TRAFFIC.speedMin + rnd.next() * (TRAFFIC.speedMax - TRAFFIC.speedMin),
        color: ['#e06c75', '#98c379', '#d19a66', '#61afef', '#c678dd'][i % 5],
        isPolice: false,
        stolen: false,
        driver: 'npc'
      });
    }

    // Pedestrians
    for (let i = 0; i < PEDS.count; i++) {
      const vRoad = state.roads.vertical[Math.floor(rnd.next() * state.roads.vertical.length)];
      const hRoad = state.roads.horizontal[Math.floor(rnd.next() * state.roads.horizontal.length)];
      state.peds.push({
        x: vRoad + 40 + (rnd.next() - 0.5) * 40,
        y: hRoad + 40 + (rnd.next() - 0.5) * 40,
        angle: rnd.next() * Math.PI * 2,
        speed: PEDS.speedMin + rnd.next() * (PEDS.speedMax - PEDS.speedMin),
        color: ['#d19a66', '#e06c75', '#98c379', '#61afef', '#c678dd'][i % 5],
        flee: 0
      });
    }
  }

  function step(dt, input, attract) {
    let events = 0;
    state.time += dt;

    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) state.message = '';
    }

    if (attract) {
      // Attract mode: camera pans, traffic & peds move
      state.camera.x += 20 * dt;
      if (state.camera.x > WORLD.width - 640) state.camera.x = 640;
      state.camera.y = WORLD.height / 2;
      updateTraffic(dt);
      updatePeds(dt);
      return events;
    }

    if (state.over || state.busted || state.win) {
      return events;
    }

    // Wanted heat & decay
    if (state.wanted > 0) {
      let activePolice = state.police.some(p => {
        let pc = state.cars.find(c => c.id === p.carId);
        if (!pc) return false;
        let dist = Math.hypot(pc.x - state.player.x, pc.y - state.player.y);
        return dist < 420;
      });
      if (!activePolice) {
        state.wantedHeat -= WANTED.decayRate * dt;
        if (state.wantedHeat <= 0) {
          state.wantedHeat = 0;
          state.wanted = 0;
        }
      }
      state.wanted = Math.min(WANTED.max, Math.floor(state.wantedHeat));
    }

    // Player Movement & Vehicle Control
    const p = state.player;
    if (p.onFoot) {
      let dx = input.mx;
      let dy = input.my;
      let len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
        p.angle = Math.atan2(dy, dx);
        let nx = p.x + dx * PLAYER.walkSpeed * dt;
        let ny = p.y + dy * PLAYER.walkSpeed * dt;
        if (!checkBuildingCollision(nx, ny, PLAYER.radius)) {
          p.x = nx;
          p.y = ny;
        }
      }

      // Enter/Steal Car
      if (input.enter) {
        let nearestCar = null;
        let minDist = 46;
        for (let c of state.cars) {
          let dist = Math.hypot(c.x - p.x, c.y - p.y);
          if (dist < minDist && !c.isPolice) {
            minDist = dist;
            nearestCar = c;
          }
        }
        if (nearestCar) {
          p.onFoot = false;
          p.carId = nearestCar.id;
          nearestCar.stolen = true;
          nearestCar.driver = 'player';
          addWantedHeat(1);
          showMessage('Car stolen!');
        }
      }

      // Action / Punch (F)
      if (input.action) {
        let hit = false;
        for (let ped of state.peds) {
          if (Math.hypot(ped.x - p.x, ped.y - p.y) < 34) {
            ped.flee = 3;
            hit = true;
          }
        }
        for (let pol of state.police) {
          let pc = state.cars.find(c => c.id === pol.carId);
          if (pc && Math.hypot(pc.x - p.x, pc.y - p.y) < 40) {
            addWantedHeat(1);
            hit = true;
          }
        }
        if (hit) showMessage('Pow!');
      }

    } else {
      // In Car
      let car = state.cars.find(c => c.id === p.carId);
      if (!car) {
        p.onFoot = true;
        p.carId = null;
      } else {
        // Steering
        if (input.mx !== 0) {
          car.angle += input.mx * CAR.turnRate * (car.speed / CAR.maxSpeed) * dt;
        }
        // Throttle / Brake
        if (input.my > 0) {
          car.speed += CAR.accel * input.my * dt;
        } else if (input.my < 0) {
          car.speed -= CAR.brake * Math.abs(input.my) * dt;
        } else {
          car.speed *= 0.98; // natural drag
        }
        car.speed = Math.max(-CAR.maxReverse, Math.min(CAR.maxSpeed, car.speed));

        if (input.handbrake) {
          car.speed *= 0.92;
        }

        let nx = car.x + Math.cos(car.angle) * car.speed * dt;
        let ny = car.y + Math.sin(car.angle) * car.speed * dt;

        if (checkBuildingCollision(nx, ny, CAR.length / 2)) {
          car.speed *= -0.3;
          state.health -= 4;
          if (car.speed > 200) addWantedHeat(0.5);
          if (state.health <= 0) {
            state.over = true;
            events |= EVENT_OVER;
          }
        } else {
          car.x = nx;
          car.y = ny;
        }

        p.x = car.x;
        p.y = car.y;
        p.angle = car.angle;

        // Exit car
        if (input.enter) {
          p.onFoot = true;
          p.carId = null;
          p.x = car.x + 35 * Math.sin(car.angle);
          p.y = car.y - 35 * Math.cos(car.angle);
          car.driver = null;
          showMessage('Exited car');
        }
      }
    }

    // Clamp player to world
    p.x = Math.max(20, Math.min(WORLD.width - 20, p.x));
    p.y = Math.max(20, Math.min(state.water.y - 20, p.y));

    // Update camera to follow player smoothly
    state.camera.x += (p.x - state.camera.x) * 0.1;
    state.camera.y += (p.y - state.camera.y) * 0.1;

    updateTraffic(dt);
    updatePeds(dt);
    updatePolice(dt);
    updateMissions(dt, events);

    state.score = state.money;
    return events;
  }

  function addWantedHeat(amount) {
    state.wantedHeat = Math.min(WANTED.max, state.wantedHeat + amount);
    state.wanted = Math.floor(state.wantedHeat);
    spawnPoliceForWanted();
  }

  function spawnPoliceForWanted() {
    while (state.police.length < state.wanted) {
      let polId = 'police_' + Math.random().toString(36).substr(2, 5);
      let angle = Math.random() * Math.PI * 2;
      let px = state.player.x + Math.cos(angle) * POLICE.spawnDistance;
      let py = state.player.y + Math.sin(angle) * POLICE.spawnDistance;
      state.cars.push({
        id: polId,
        x: px,
        y: py,
        angle: 0,
        speed: 0,
        color: '#e5534b',
        isPolice: true,
        stolen: false,
        driver: 'cop'
      });
      state.police.push({ carId: polId });
    }
    while (state.police.length > state.wanted) {
      let pol = state.police.pop();
      if (pol) {
        state.cars = state.cars.filter(c => c.id !== pol.carId);
      }
    }
  }

  function updateTraffic(dt) {
    for (let car of state.cars) {
      if (car.driver === 'player') continue;
      if (car.isPolice) continue;

      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;

      // Wrap around or bounce at world bounds
      if (car.x < 0 || car.x > WORLD.width || car.y < 0 || car.y > state.water.y) {
        car.angle += Math.PI;
      }
    }
  }

  function updatePeds(dt) {
    for (let ped of state.peds) {
      if (ped.flee > 0) {
        ped.flee -= dt;
        ped.x += Math.cos(ped.angle) * (ped.speed * 1.8) * dt;
        ped.y += Math.sin(ped.angle) * (ped.speed * 1.8) * dt;
      } else {
        ped.x += Math.cos(ped.angle) * ped.speed * dt;
        ped.y += Math.sin(ped.angle) * ped.speed * dt;
        if (Math.random() < 0.02) {
          ped.angle += (Math.random() - 0.5) * Math.PI;
        }
      }
      ped.x = Math.max(50, Math.min(WORLD.width - 50, ped.x));
      ped.y = Math.max(50, Math.min(state.water.y - 50, ped.y));
    }
  }

  function updatePolice(dt) {
    for (let pol of state.police) {
      let pc = state.cars.find(c => c.id === pol.carId);
      if (!pc) continue;

      let dx = state.player.x - pc.x;
      let dy = state.player.y - pc.y;
      let targetAngle = Math.atan2(dy, dx);
      let angleDiff = targetAngle - pc.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      pc.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 2.0 * dt);

      pc.speed = POLICE.chaseSpeed * 0.85;
      pc.x += Math.cos(pc.angle) * pc.speed * dt;
      pc.y += Math.sin(pc.angle) * pc.speed * dt;

      let dist = Math.hypot(dx, dy);
      if (dist < 40 && state.player.onFoot) {
        // Busted check
        state.busted = true;
        state.money = Math.floor(state.money * 0.7);
        state.wanted = 0;
        state.wantedHeat = 0;
        showMessage('BUSTED! Bribed cops with 30% cash.');
      } else if (dist < 35 && !state.player.onFoot) {
        state.health -= POLICE.ramDamage * dt;
        if (state.health <= 0) {
          state.over = true;
        }
      }
    }
  }

  function updateMissions(dt, events) {
    const m = state.mission;
    const def = MISSIONS[m.index];
    if (!def) return;

    m.timer -= dt;

    let dist = Math.hypot(def.target.x - state.player.x, def.target.y - state.player.y);

    let completed = false;
    if (def.target.kind === 'car' && !state.player.onFoot) {
      completed = true;
    } else if (def.target.kind === 'place' && dist < 60) {
      completed = true;
    } else if (def.target.kind === 'evade' && state.wanted >= 3) {
      if (m.timer <= 0) completed = true;
    } else if (def.target.kind === 'collect' && dist < 50) {
      completed = true;
    } else if (def.target.kind === 'escape' && dist < 60 && state.wanted >= 3) {
      completed = true;
    }

    if (completed) {
      state.money += def.reward;
      showMessage(`Mission Complete: ${def.title}! +$${def.reward}`);
      m.index++;
      if (m.index >= MISSIONS.length) {
        state.win = true;
      } else {
        const nextDef = MISSIONS[m.index];
        m.target = { x: nextDef.target.x, y: nextDef.target.y, label: nextDef.target.label };
        m.timer = nextDef.timeLimit;
        m.text = nextDef.brief;
      }
    } else if (m.timer <= 0) {
      m.timer = def.timeLimit;
      showMessage('Too slow — Mara gives you another shot.');
    }
  }

  function checkBuildingCollision(x, y, radius) {
    for (let b of state.buildings) {
      if (x + radius > b.x && x - radius < b.x + b.w &&
          y + radius > b.y && y - radius < b.y + b.h) {
        return true;
      }
    }
    return false;
  }

  function showMessage(msg) {
    state.message = msg;
    state.messageTimer = 3.5;
  }

  reset();

  return {
    get state() { return state; },
    reset,
    step
  };
}
