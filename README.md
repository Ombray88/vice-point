# Vice Point

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Ombray88/vice-point/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Ombray88/vice-point/reward.svg)](https://make.fun/bounty/gta6-01/reward.svg)

Vice Point is a 2D top-down open-world crime game set in a vibrant neon city. Steal cars, navigate traffic, outrun the police, and complete 5 chained missions to rule the streets. Featuring wanted heat, money tracking, minimap navigation, audio effects, and automatic save/load.

## How to Play
- **Controls:** WASD / Arrow Keys to move (or drive), **E** to enter/exit vehicles, **Space** to start/restart, **M** to toggle audio mute.
- **Objective:** Follow mission waypoints across the city, evade police pursuit when wanted, and earn cash.

## Running Locally
```sh
node serve.ts --port 8080
```
Then open `http://localhost:8080` in any modern browser. (Alternatively, open `game/index.html` directly).

## Technical Stack
- Built with vanilla HTML5 Canvas and plain ES Modules. Zero external runtime libraries or network requests.
- Procedural WebAudio synthesizer for sound effects and ambient soundscape.
- Seeded Mulberry32 PRNG for deterministic world generation and automated cinematic shots.

## File Layout
- `game/src/`: Core modules (`config.js`, `world.js`, `render.js`, `input.js`, `missions.js`, `audio.js`, `main.js`, `shots.js`, `random.js`)
- `main.ts`: Entry point and build script runner.
- `shots.json`: Automated screenshot staging configurations.
- `screenshots/`: Generated gameplay and cinematic previews.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9w5z28cm&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
