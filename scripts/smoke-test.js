const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "assets/css/app.css",
  "assets/css/speed-dungeon.css",
  "assets/js/speed-dungeon.js",
  "assets/data/speedDungeon-search0-7.json",
  "assets/data/speedDungeon-search8-11.json",
  "assets/data/speedDungeon-search12-15.json",
  "assets/data/speedDungeon-search16+.json",
  "assets/data/speedDungeon-riddles0-7.json",
  "assets/data/speedDungeon-riddle8-11.json",
  "assets/data/speedDungeon-riddle12-15.json",
  "assets/data/speedDungeon-riddle16+.json",
  "assets/images/endboss/endboss_1a.webp",
  "assets/images/fightinggame/fight_1a.webp",
  "assets/images/lockgame/door3a.webp",
  "assets/images/riddlegame/riddle1.webp",
  "assets/images/searchinggame/image_room_group1a.webp",
];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "assets/js/speed-dungeon.js"), "utf8");

if (!index.includes("assets/js/speed-dungeon.js")) {
  throw new Error("index.html does not load the standalone game script.");
}

if (
  script.includes("\"/images/speedDungeon/") ||
  script.includes("'/images/speedDungeon/") ||
  script.includes("\"/data/speedDungeon-") ||
  script.includes("'/data/speedDungeon-")
) {
  throw new Error("Game script still contains portfolio-relative asset paths.");
}

console.log(`Smoke test passed for ${requiredFiles.length} required files.`);
