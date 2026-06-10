/**
 * Takes 8 feature screenshots and saves them to docs/screenshots/.
 * Run with: node scripts/take-screenshots.mjs
 */

import { _electron as electron } from "playwright-core";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const SHOT_DIR = path.join(APP_DIR, "docs", "screenshots");
const SETTINGS_PATH = path.join(process.env.APPDATA, "ShortPath", "settings.json");
const ELECTRON_BIN = path.join(APP_DIR, "node_modules/electron/dist/electron.exe");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT_DIR, name) });
  console.log("  saved:", name);
}

async function clickByTitle(page, title) {
  await page.evaluate((t) => {
    const btn = document.querySelector(`[title="${t}"]`);
    btn?.click();
  }, title);
}

async function goBack(page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "← Back"
    );
    btn?.click();
  });
  await sleep(300);
}

// Reset hasOnboarded so onboarding overlay shows on launch
try {
  const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
  const settings = JSON.parse(raw);
  settings.hasOnboarded = false;
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log("Reset hasOnboarded=false");
} catch (e) {
  console.warn("Could not reset settings:", e.message);
}

console.log("Launching app...");
const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: [APP_DIR],
  env: { ...process.env },
  timeout: 30_000,
});

await sleep(4000);

const mainPage = () =>
  app.windows().find((w) => !w.url().startsWith("devtools://")) ?? app.firstWindow();

const page = await mainPage();

// ── 1. Onboarding: welcome step ───────────────────────────────────────────────
console.log("\n1. Onboarding welcome");
await shot(page, "onboarding.png");

// ── 2. Onboarding: data import step ──────────────────────────────────────────
console.log("2. Onboarding import step");
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.trim().includes("Next")
  )?.click();
});
await sleep(500);
await shot(page, "onboarding-import.png");

// Install sample data then skip the rest of onboarding
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.trim().includes("Set up with Sample Data")
  )?.click();
});
await sleep(600);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.trim().includes("Skip")
  )?.click();
});
await sleep(800);

// ── 3. Main browse with sample data ──────────────────────────────────────────
console.log("3. Main browse");
await shot(page, "main.png");

// ── 4. Search results ─────────────────────────────────────────────────────────
console.log("4. Search results");
await page.evaluate(() => {
  const input = document.querySelector("input[placeholder]");
  if (input) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    ).set;
    setter.call(input, "refund");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await sleep(700);
await shot(page, "search-results.png");

// Clear search
await page.evaluate(() => {
  const input = document.querySelector("input[placeholder]");
  if (input) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    ).set;
    setter.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await sleep(400);

// ── 5. Settings panel ────────────────────────────────────────────────────────
console.log("5. Settings");
await clickByTitle(page, "Settings (Alt+S)");
await sleep(700);
await shot(page, "settings.png");
await goBack(page);

// ── 6. Keyboard shortcuts panel ──────────────────────────────────────────────
console.log("6. Keyboard shortcuts");
await clickByTitle(page, "Keyboard shortcuts (Alt+K)");
await sleep(700);
await shot(page, "keyboard-shortcuts.png");
await goBack(page);

// ── 7. Favorites view ────────────────────────────────────────────────────────
console.log("7. Favorites — starring 3 entries first");
// Star the first 3 "Add to favorites" buttons visible on the main browse view
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('[title="Add to favorites"]')].slice(0, 3);
  btns.forEach((b) => b.click());
});
await sleep(500);
await clickByTitle(page, "Favorites");
await sleep(700);
await shot(page, "favorites.png");
await goBack(page);

// ── 8. Help window ────────────────────────────────────────────────────────────
console.log("8. Help window");
await clickByTitle(page, "Help (Alt+H)");
await sleep(1500); // help window takes a moment to open
const allWindows = app.windows();
const helpPage = allWindows.find(
  (w) => !w.url().startsWith("devtools://") && w !== page
);
if (helpPage) {
  await shot(helpPage, "help.png");
} else {
  console.warn("  Help window not found, skipping");
}

await app.close();
console.log("\nDone. Screenshots in docs/screenshots/");
