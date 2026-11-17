/**
 * @file render.js
 * @description Canvas 2D renderer for Vice Point.
 * Exports: createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WIN
 */

import { FIELD, PALETTE, FONT } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function draw(state, screen, best) {
    // Resize canvas to fit window maintaining 1280x720 aspect ratio
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== FIELD.width || canvas.height !== FIELD.height) {
      canvas.width = FIELD.width;
      canvas.height = FIELD.height;
    }

    ctx.save();
    ctx.fillStyle = PALETTE.asphalt;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    if (screen === SCREEN_TITLE) {
      drawWorldBackground(state);
      ctx.save();
      let cam = state.camera;
      ctx.translate(FIELD.width / 2 - cam.x, FIELD.height / 2 - cam.y);
      drawWorld(state);
      ctx.restore();
      drawTitleScreen(best);
      ctx.restore();
      return;
    }

    // Camera transform
    ctx.save();
    let cam = state.camera;
    ctx.translate(FIELD.width / 2 - cam.x, FIELD.height / 2 - cam.y);

    drawWorld(state);

    ctx.restore();

    // HUD
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHUD(state);
    }

    if (screen === SCREEN_PAUSED) {
      drawPausedOverlay();
    } else if (screen === SCREEN_OVER || state.over || state.busted) {
      drawOverOverlay(state);
    } else if (screen === SCREEN_WIN || state.win) {
      drawWinOverlay(state);
    }

    ctx.restore();
  }

  function drawWorldBackground(state) {
    // Water
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(0, state.water.y, 2560, 1920 - state.water.y);

    // Sand
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0, state.beach.y, 2560, state.water.y - state.beach.y);

    // Park
    state.parks.forEach(park => {
      ctx.fillStyle = PALETTE.park;
      ctx.fillRect(park.x, park.y, park.w, park.h);
    });
  }

  function drawWorld(state) {
    drawWorldBackground(state);

    // Roads
    ctx.fillStyle = PALETTE.asphalt;
    ctx.fillRect(0, 0, 2560, state.water.y);

    // Road grid lines
    ctx.strokeStyle = PALETTE.roadLine;
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 16]);
    state.roads.vertical.forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.water.y);
      ctx.stroke();
    });
    state.roads.horizontal.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2560, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Sidewalks
    ctx.fillStyle = PALETTE.sidewalk;
    // Buildings
    state.buildings.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PALETTE.roof;
      ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);

      // Windows grid
      ctx.fillStyle = PALETTE.windowsLit;
      for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 20) {
        for (let wy = b.y + 12; wy < b.y + b.h - 12; wy += 20) {
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    });

    // Mission Target Marker
    if (state.mission && state.mission.target) {
      let t = state.mission.target;
      ctx.strokeStyle = PALETTE.objective;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 32 + Math.sin(state.time * 6) * 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = PALETTE.objective;
      ctx.font = `bold 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(t.label, t.x, t.y - 42);
    }

    // Pedestrians
    state.peds.forEach(ped => {
      ctx.fillStyle = ped.color;
      ctx.beginPath();
      ctx.arc(ped.x, ped.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cars
    state.cars.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      ctx.fillStyle = car.color;
      ctx.fillRect(-23, -11, 46, 22);

      // Windshield
      ctx.fillStyle = PALETTE.windowsDark;
      ctx.fillRect(-6, -8, 14, 16);

      // Police lights flashing
      if (car.isPolice) {
        ctx.fillStyle = Math.floor(state.time * 10) % 2 === 0 ? PALETTE.policeLightA : PALETTE.policeLightB;
        ctx.fillRect(-4, -4, 8, 8);
      }

      ctx.restore();
    });

    // Player (on foot)
    const p = state.player;
    if (p.onFoot) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = PALETTE.player;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHUD(state) {
    // Top-left Money & Health
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(20, 20, 240, 80);

    ctx.fillStyle = PALETTE.money;
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`$${state.money.toLocaleString()}`, 36, 52);

    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Health', 36, 74);
    ctx.fillStyle = PALETTE.player;
    ctx.fillRect(90, 62, Math.max(0, state.health) * 1.4, 12);

    // Top-centre Wanted Stars
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(FIELD.width / 2 - 90, 20, 180, 44);
    ctx.fillStyle = PALETTE.objective;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    let starsStr = '';
    for (let i = 0; i < 5; i++) {
      starsStr += (i < state.wanted ? '★ ' : '☆ ');
    }
    ctx.fillText(starsStr.trim(), FIELD.width / 2, 50);

    // Top-right Minimap
    const mapX = FIELD.width - 200, mapY = 20, mapW = 180, mapH = 130;
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = PALETTE.muted;
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Minimap content: roads, buildings, water, police, mission target, player
    const msx = mapW / 2560, msy = mapH / 1920;
    ctx.strokeStyle = '#5a6a7a';
    ctx.lineWidth = 1;
    for (const x of state.roads.vertical) {
      ctx.beginPath(); ctx.moveTo(mapX + x * msx, mapY); ctx.lineTo(mapX + x * msx, mapY + mapH); ctx.stroke();
    }
    for (const y of state.roads.horizontal) {
      ctx.beginPath(); ctx.moveTo(mapX, mapY + y * msy); ctx.lineTo(mapX + mapW, mapY + y * msy); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(140,150,170,0.8)';
    for (const b of state.buildings) {
      ctx.fillRect(mapX + b.x * msx, mapY + b.y * msy, Math.max(1, b.w * msx), Math.max(1, b.h * msy));
    }
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(mapX, mapY + state.water.y * msy, mapW, Math.max(0, mapH - state.water.y * msy));
    for (const pol of state.police) {
      const pc = state.cars.find(c => c.id === pol.carId);
      if (!pc) continue;
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath(); ctx.arc(mapX + pc.x * msx, mapY + pc.y * msy, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (state.mission && state.mission.target) {
      const pulse = 3 + Math.sin(state.time * 4) * 1.5;
      ctx.fillStyle = PALETTE.objective;
      ctx.beginPath(); ctx.arc(mapX + state.mission.target.x * msx, mapY + state.mission.target.y * msy, pulse, 0, Math.PI * 2); ctx.fill();
    }
    // Player dot on minimap
    let rx = mapX + (state.player.x / 2560) * mapW;
    let ry = mapY + (state.player.y / 1920) * mapH;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bottom-centre Mission Banner
    if (state.mission) {
      ctx.fillStyle = PALETTE.hudPanel;
      ctx.fillRect(FIELD.width / 2 - 300, FIELD.height - 90, 600, 70);
      ctx.fillStyle = PALETTE.objective;
      ctx.font = `bold 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(state.mission.text, FIELD.width / 2, FIELD.height - 62);

      ctx.fillStyle = PALETTE.text;
      ctx.font = `14px ${FONT}`;
      let timeSecs = Math.max(0, Math.ceil(state.mission.timer));
      ctx.fillText(`Time remaining: ${timeSecs}s`, FIELD.width / 2, FIELD.height - 38);
    }

    // Bottom-left Contextual Hint
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(20, FIELD.height - 60, 320, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'left';
    let hint = state.player.onFoot ? 'E — Steal car / Enter | F — Punch | WASD — Walk' : 'E — Exit car | WASD — Drive';
    ctx.fillText(hint, 36, FIELD.height - 34);

    // Message popup
    if (state.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(FIELD.width / 2 - 250, 100, 500, 46);
      ctx.fillStyle = PALETTE.objective;
      ctx.font = `bold 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(state.message, FIELD.width / 2, 128);
    }
  }

  function drawTitleScreen(best) {
    ctx.fillStyle = 'rgba(10,12,20,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.fillStyle = PALETTE.objective;
    ctx.font = `bold 54px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('VICE POINT', FIELD.width / 2, FIELD.height / 2 - 80);

    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    ctx.fillText('A small-time driver. A neon city. Five jobs.', FIELD.width / 2, FIELD.height / 2 - 30);

    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`Best Score: $${(best || 0).toLocaleString()}`, FIELD.width / 2, FIELD.height / 2 + 20);

    ctx.fillStyle = PALETTE.money;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('Press Space or click to start', FIELD.width / 2, FIELD.height / 2 + 90);
  }

  function drawPausedOverlay() {
    ctx.fillStyle = 'rgba(10,12,20,0.80)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 36px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — Space to resume', FIELD.width / 2, FIELD.height / 2);
  }

  function drawOverOverlay(state) {
    ctx.fillStyle = 'rgba(20,10,10,0.88)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.policeLightA;
    ctx.font = `bold 48px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.busted ? 'BUSTED' : 'WASTED', FIELD.width / 2, FIELD.height / 2 - 40);

    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    ctx.fillText(`Final Money: $${state.money.toLocaleString()}`, FIELD.width / 2, FIELD.height / 2 + 10);

    ctx.fillStyle = PALETTE.objective;
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText('Press Space to try again', FIELD.width / 2, FIELD.height / 2 + 70);
  }

  function drawWinOverlay(state) {
    ctx.fillStyle = 'rgba(10,20,10,0.88)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.money;
    ctx.font = `bold 48px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('KINGPIN OF VICE POINT', FIELD.width / 2, FIELD.height / 2 - 50);

    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    ctx.fillText(`Total Wealth Acquired: $${state.money.toLocaleString()}`, FIELD.width / 2, FIELD.height / 2 + 10);

    ctx.fillStyle = PALETTE.objective;
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText('Press Space to play again', FIELD.width / 2, FIELD.height / 2 + 80);
  }

  return {
    draw
  };
}
