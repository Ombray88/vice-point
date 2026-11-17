/**
 * @file config.js
 * @description Configuration and constants for Vice Point.
 * Exports: STEP, FIELD, WORLD, PLAYER, CAR, TRAFFIC, PEDS, POLICE, WANTED, SAVE_KEY, BEST_KEY, PALETTE, FONT
 */

export const STEP = 1 / 60;

export const FIELD = {
  width: 1280,
  height: 720
};

export const WORLD = {
  width: 2560,
  height: 1920
};

export const PLAYER = {
  radius: 10,
  walkSpeed: 170,
  health: 100
};

export const CAR = {
  length: 46,
  width: 22,
  accel: 420,
  brake: 600,
  reverseAccel: 260,
  maxSpeed: 520,
  maxReverse: 160,
  turnRate: 2.6,
  grip: 3.2
};

export const TRAFFIC = {
  count: 14,
  speedMin: 90,
  speedMax: 150
};

export const PEDS = {
  count: 22,
  speedMin: 28,
  speedMax: 55
};

export const POLICE = {
  chaseSpeed: 540,
  ramDamage: 8,
  spawnDistance: 500
};

export const WANTED = {
  decayDelay: 6,
  decayRate: 0.25,
  max: 5
};

export const SAVE_KEY = 'vice-point.save';
export const BEST_KEY = 'vice-point.best';

export const PALETTE = {
  asphalt: '#232733',
  roadLine: '#c9a227',
  sidewalk: '#3a3f4d',
  buildingColors: [
    '#5c6375', '#4b5263', '#625b71', '#4a525d',
    '#535c68', '#424949', '#566573', '#34495e'
  ],
  windowsLit: '#ffd166',
  windowsDark: '#2b3040',
  park: '#1f4d2e',
  sand: '#c2a878',
  water: '#14425e',
  player: '#4fc3f7',
  police: '#e5534b',
  policeLightA: '#ff3b30',
  policeLightB: '#3b82f6',
  trafficColors: [
    '#e06c75', '#98c379', '#d19a66', '#61afef',
    '#c678dd', '#56b6c2', '#abb2bf', '#e5c07b'
  ],
  pedColors: [
    '#d19a66', '#e06c75', '#98c379', '#61afef',
    '#c678dd', '#abb2bf', '#56b6c2', '#e5c07b'
  ],
  hudPanel: 'rgba(10,12,20,0.72)',
  text: '#eef1f5',
  muted: '#8b93a3',
  objective: '#ffd166',
  money: '#7ee787'
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
