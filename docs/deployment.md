# Deployment

The production site is deployed as a Render Static Site.

## Render Settings

Use these settings when creating the Static Site manually:

```text
Repository: STU6266/speed-dungeon
Branch: main
Build Command: npm test && npm run build
Publish Directory: dist
```

The included `render.yaml` documents the same setup for Blueprint-based deploys.

## Local Checks Before Deploy

```bash
npm test
npm run build
npm run start:dist
```

Open the local URL from `serve` and verify:

- the start screen loads
- the age selector works
- `Start Dungeon` begins the run
- room images and JSON-driven content load
- mobile controls appear on small screens where needed
