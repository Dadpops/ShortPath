/**
 * Build script for the ShortPath browser extension.
 * Usage: node build.js chrome | node build.js firefox
 *
 * Copies all extension files into dist/chrome/ or dist/firefox/ and renames
 * the appropriate manifest to manifest.json.
 */

const fs = require("fs");
const path = require("path");

const target = process.argv[2];
if (target !== "chrome" && target !== "firefox") {
  console.error("Usage: node build.js chrome | node build.js firefox");
  process.exit(1);
}

const src = __dirname;
const dest = path.join(src, "dist", target);

// Remove and recreate destination
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

// Files and directories to copy (relative to src)
const filesToCopy = [
  "background.js",
  "queue.js",
  `manifest.${target}.json`,
];
const dirsToCopy = ["popup", "icons"];

for (const file of filesToCopy) {
  const srcPath = path.join(src, file);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skipping missing file: ${file}`);
    continue;
  }
  const destName = file.startsWith("manifest.") ? "manifest.json" : file;
  fs.copyFileSync(srcPath, path.join(dest, destName));
}

for (const dir of dirsToCopy) {
  const srcDir = path.join(src, dir);
  if (!fs.existsSync(srcDir)) {
    console.warn(`Skipping missing directory: ${dir}`);
    continue;
  }
  copyDir(srcDir, path.join(dest, dir));
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcEntry = path.join(from, entry.name);
    const destEntry = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcEntry, destEntry);
    else fs.copyFileSync(srcEntry, destEntry);
  }
}

console.log(`Built dist/${target}/ — load unpacked from that directory.`);
