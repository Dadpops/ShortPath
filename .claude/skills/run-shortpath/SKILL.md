---
description: Launch ShortPath and capture screenshots via Playwright electron driver
---

# Run ShortPath

Launches the built Electron app, dismisses the onboarding overlay if present, drives it to the requested screens, and saves screenshots to `scripts/shots/`.

## Prerequisites

- `playwright-core` is in devDependencies — already present, no install needed.
- The app must be built before launching. Run `npm run build` if `dist/` is stale.

## Build

```bash
npm run build
```

Takes ~5–10 seconds. Output lands in `dist/main/` and `dist/renderer/`.

## Driver pattern

Write a script at `scripts/run-driver.mjs` (delete after use — not a repo artifact):

```js
import { _electron as electron } from "playwright-core";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = path.join(root, "scripts", "shots");
mkdirSync(shots, { recursive: true });

const app = await electron.launch({
  args: [path.join(root, "dist", "main", "index.js")],
  env: { ...process.env, NODE_ENV: "production" },
});

const win = await app.firstWindow();
await win.waitForLoadState("domcontentloaded");
await win.waitForTimeout(1800);  // wait for React render + tray init

// Always dismiss onboarding overlay first — it blocks all keyboard shortcuts
const skipBtn = win.locator("text=Skip");
if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  await skipBtn.click();
  await win.waitForTimeout(500);
}

// --- your interactions here ---
await win.screenshot({ path: path.join(shots, "01-main.png") });

await app.close();
```

Run it:

```bash
node scripts/run-driver.mjs
```

## Key facts

**Window startup:** `app.firstWindow()` returns the main popup. Wait 1800ms after `domcontentloaded` before interacting — the React tree and tray need time to initialise.

**Onboarding overlay:** Always present on a fresh userData directory. It intercepts Alt+S, Alt+H, and all other keyboard shortcuts. Dismiss with `win.locator("text=Skip").click()` before doing anything else.

**Settings navigation:** Use `.settings-nav-item` with `hasText` to click pages reliably:
```js
await win.keyboard.press("Alt+s");
await win.waitForTimeout(800);
await win.locator(".settings-nav-item", { hasText: "Compact Mode" }).click();
// go back:
await win.locator("text=← Settings").click();
```

**Help panel:** Opens in a **second BrowserWindow** — `win.keyboard.press("Alt+h")` fires `open-help-window` IPC which creates a new window. Capture it like this:
```js
const helpWindowPromise = app.waitForEvent("window");
await win.keyboard.press("Alt+h");
const helpWin = await helpWindowPromise;
await helpWin.waitForLoadState("domcontentloaded");
await helpWin.waitForTimeout(1000);
await helpWin.screenshot({ path: path.join(shots, "help.png") });
```

**Global hotkey:** Does not fire inside Playwright (no system-level hook registration). Use IPC or UI buttons instead of the `Ctrl+Shift+Space` summon hotkey.

**Compact mode:** To enter compact mode from a driver, click the compact icon button in the header rather than using the hotkey.

## Cleanup

Delete `scripts/run-driver.mjs` and `scripts/shots/` after the session — they are throwaway verification tools.

```bash
Remove-Item -Force scripts\run-driver.mjs
Remove-Item -Recurse -Force scripts\shots
```
