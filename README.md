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

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- JSON data files

## Project Structure

```text
speed-dungeon/
├─ index.html
├─ package.json
├─ assets/
│  ├─ css/
│  │  ├─ app.css
│  │  └─ speed-dungeon.css
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
   └─ smoke-test.js
```
