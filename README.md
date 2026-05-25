# Speed Dungeon

Speed Dungeon is a standalone browser dungeon game built with vanilla JavaScript, HTML, CSS and JSON data.

The player clears short room challenges, collects Power Points and fights a final boss when the run timer expires. The game is designed to work on desktop and mobile, with age-based difficulty groups, different room types and touch controls for rooms that normally depend on keyboard input.

## Live Demo

```text
https://speed-dungeon.onrender.com
```

## What This Project Shows

- browser game state management without a backend
- age-based content and difficulty handling
- multiple mini-game room types in one game loop
- JSON-driven riddle and hidden-object content
- responsive CSS and mobile controls
- static deployment workflow with build and smoke test steps

## Game Concept

Speed Dungeon is a short run-based dungeon game. A run starts with a selected age group and a countdown timer. During the run, the player enters different rooms, solves quick challenges and collects Power Points. When the timer ends, the game switches into a boss fight where the collected points and player performance matter.

The goal is not only to make a small browser game, but to structure the logic so that different room types, content files and asset folders can be maintained separately.

## Core Features

- 3-minute dungeon run with final boss phase
- age groups: `0-7`, `8-11`, `12-15`, `16+`
- room rotation with different interaction styles
- Power Points as shared run progress
- keyboard support for desktop play
- touch controls for mobile play
- static build output for hosting on Render
- file-level smoke test before deployment

## Room Types

- Corridor room: lane-style movement and quick reactions
- Fight room: reaction-based combat challenge
- Lock room: math/code challenge
- Image search room: hidden-object style challenge
- Riddle room: question/answer challenge driven by JSON data
- Boss room: final phase after the run timer expires

## Technical Structure

The project is intentionally static. There is no database and no server-side game state. Game state, timers, room transitions and controls are handled in the browser.

```text
assets/js/speed-dungeon.js       main game logic
assets/data/                     JSON content by room/age group
assets/css/speed-dungeon/        split CSS by game area
assets/images/                   room and boss assets
scripts/build-static.js          creates deployable dist output
scripts/smoke-test.js            verifies important files before deploy
```

## Mobile Controls

Some rooms use keyboard-style input on desktop. For mobile players, the game provides on-screen controls so the core game loop remains usable without a physical keyboard.

This was one of the main UX challenges because each room type needs slightly different controls while still feeling like one connected game.

## Current Scope and WIP

This is a portfolio-ready static game project. The main game loop, room types, mobile controls and deployment flow are implemented.

Things that could be improved in a future version:

- more visual polish and animation feedback
- stronger balancing between age groups
- more room content and asset variety
- saved best times or local high scores
- cleaner split of the main JavaScript file into smaller modules

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- JSON data files
- Node.js scripts for build and smoke testing
- Render Static Site deployment

## Run Locally

```bash
npm install
npm start
```

Open the local URL shown by `serve`.

## Test and Build

Run the smoke test:

```bash
npm test
```

Build the static files for hosting:

```bash
npm run build
```

The deployable output is written to `dist/`.

## Deploy on Render

This repo includes a `render.yaml` Blueprint for Render Static Sites.

In Render:

1. Click **New +**.
2. Choose **Blueprint**.
3. Connect `STU6266/speed-dungeon`.
4. Select the `main` branch.
5. Confirm the `speed-dungeon` static service.

The Blueprint runs:

```bash
npm test && npm run build
```

Render publishes:

```text
./dist
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)

## Project Structure

```text
speed-dungeon/
|-- index.html
|-- package.json
|-- render.yaml
|-- assets/
|   |-- css/
|   |   |-- app.css
|   |   |-- speed-dungeon.css
|   |   `-- speed-dungeon/
|   |-- js/
|   |   `-- speed-dungeon.js
|   |-- data/
|   |   `-- speedDungeon-*.json
|   `-- images/
|       |-- endboss/
|       |-- fightinggame/
|       |-- lockgame/
|       |-- riddlegame/
|       `-- searchinggame/
|-- docs/
`-- scripts/
    |-- build-static.js
    `-- smoke-test.js
```
