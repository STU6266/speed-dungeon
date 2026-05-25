# Architecture

Speed Dungeon is a static browser game. Render serves `index.html`, CSS, JavaScript, JSON data and image assets directly from the generated `dist/` folder.

## Runtime Flow

1. `index.html` provides the game shell, HUD, room containers and mobile controls.
2. `assets/js/speed-dungeon.js` owns game state, room transitions, timers, input handling and data loading.
3. JSON files in `assets/data/` provide image-search and riddle content.
4. WebP files in `assets/images/` provide room backgrounds and search-room images.

## CSS Organization

`assets/css/speed-dungeon.css` is a small entry file that imports focused CSS files:

- `layout.css` - page-level game layout, HUD and shared room containers
- `fight.css` - fight room and large target-key feedback
- `image-room.css` - object search layout and hotspots
- `riddle.css` - riddle room question and answer controls
- `corridor.css` - lane runner room and player/obstacle visuals
- `lock.css` - math lock room
- `boss-and-picture-rooms.css` - boss fight and shared picture-room framing
- `start-and-answers.css` - start panel and selected-answer state
- `mobile-controls.css` - mobile touch controls

## Deployment

Render runs:

```bash
npm test && npm run build
```

The build script copies `index.html` and `assets/` into `dist/`, which Render publishes as a static site.

## Future Refactor

The main JavaScript file is intentionally still kept in one file for this version to avoid changing game behavior during cleanup. A future refactor can split room logic into modules once browser-level regression testing is in place.
