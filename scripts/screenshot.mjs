// Screenshot driver for ShortPath — takes 3 reference screenshots for README
// Usage: node scripts/screenshot.mjs
import { _electron as electron } from "playwright-core";
import * as path from "path";
import * as url from "url";

const ROOT = path.resolve(url.fileURLToPath(import.meta.url), "../..");
const SHOTS = path.join(ROOT, "docs", "screenshots");
const ELECTRON_BIN = path.join(ROOT, "node_modules", "electron", "dist", "electron.exe");

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: [ROOT],
  timeout: 30_000,
});

await sleep(3000); // let the window render

const page = app.windows().find(w => !w.url().startsWith("devtools://"))
  ?? await app.firstWindow();

console.log("Window URL:", page.url());
console.log("Windows:", app.windows().map(w => w.url()));

// ── 1. Main window — type a query to show results ─────────────────────────
await page.waitForSelector(".search-input", { timeout: 10_000 });
await page.evaluate(() => { document.querySelector(".search-input")?.focus(); });
await page.keyboard.type("refund", { delay: 40 });
await sleep(600);
await page.screenshot({ path: path.join(SHOTS, "main.png") });
console.log("Saved main.png");

// ── 2. Settings — Appearance section ─────────────────────────────────────
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent?.includes("Settings") || b.title === "Settings");
  btn?.click();
});
await sleep(600);
await page.screenshot({ path: path.join(SHOTS, "settings.png") });
console.log("Saved settings.png");

// ── 3. Support Tools — navigate via tab filter ────────────────────────────
await page.evaluate(() => {
  // Go back to main view first
  const back = [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === "Back" || b.textContent?.includes("←"));
  back?.click();
});
await sleep(400);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === "Back");
  btn?.click();
});
await sleep(300);
// Clear search and click Support Tools tab
await page.evaluate(() => document.querySelector(".search-input")?.click());
await page.keyboard.press("Control+a");
await page.keyboard.press("Backspace");
await sleep(300);
// Click the tools vertical tab
await page.evaluate(() => {
  const tabs = [...document.querySelectorAll(".vtab, option")];
  const toolsTab = tabs.find(t => t.textContent?.toLowerCase().includes("tool") || t.value?.toLowerCase().includes("tool"));
  toolsTab?.click();
});
await sleep(400);
await page.screenshot({ path: path.join(SHOTS, "tools.png") });
console.log("Saved tools.png");

await app.close();
console.log("Done.");
