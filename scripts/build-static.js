const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function copyRecursive(source, destination) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

copyRecursive(path.join(root, "index.html"), path.join(dist, "index.html"));
copyRecursive(path.join(root, "assets"), path.join(dist, "assets"));

console.log("Static build written to dist/.");
