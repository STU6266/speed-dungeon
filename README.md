# Speed Dungeon

Speed Dungeon is a standalone browser game built with vanilla JavaScript, HTML, CSS and JSON data.

The player clears short dungeon rooms, collects Power Points and fights a final boss when the run timer expires. Difficulty adapts by age group, and the game includes keyboard and mobile touch controls.

## Features

- 3-minute dungeon run with a final boss fight
- Age-based difficulty groups: 0-7, 8-11, 12-15, 16+
- Multiple room types:
  - corridor lane runner
  - reaction fight room
  - math lock room
  - image search room
  - riddle room
- JSON-driven riddle and image-search content
- Mobile controls for rooms that need keyboard input
- No backend required

## Run Locally

```bash
npm install
npm start
```

Open the local URL shown by `serve`.

For a quick file-level smoke test:

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

The Blueprint runs `npm test && npm run build` and publishes `./dist`.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- JSON data files

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)

## Project Structure

```text
speed-dungeon/
├─ index.html
├─ package.json
├─ render.yaml
├─ assets/
│  ├─ css/
│  │  ├─ app.css
│  │  ├─ speed-dungeon.css
│  │  └─ speed-dungeon/
│  │     ├─ layout.css
│  │     ├─ fight.css
│  │     ├─ image-room.css
│  │     ├─ riddle.css
│  │     ├─ corridor.css
│  │     ├─ lock.css
│  │     ├─ boss-and-picture-rooms.css
│  │     ├─ start-and-answers.css
│  │     └─ mobile-controls.css
│  ├─ js/
│  │  └─ speed-dungeon.js
│  ├─ data/
│  │  └─ speedDungeon-*.json
│  └─ images/
│     ├─ endboss/
│     ├─ fightinggame/
│     ├─ lockgame/
│     ├─ riddlegame/
│     └─ searchinggame/
└─ scripts/
   ├─ build-static.js
   └─ smoke-test.js
```
