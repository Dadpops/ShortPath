# 2026-06-10 — Compact mode v2; Stream Deck removal; crash recovery; v0.6.7

## What we did

### Stream Deck removal (v0.6.6)
- Removed Stream Deck profile export feature entirely (it never worked reliably).
- Cleaned out all related code and bumped to v0.6.6.

### CSV duplicate folder fix
- `src/store/csv.ts`: all three import functions now match verticals by label (case-insensitive) as a fallback when the ID does not match. Previously, uploading a new CSV for an existing vertical created a duplicate folder.

### Crash recovery (v0.6.7)
- `src/main/index.ts`: added `render-process-gone` handler (recreates the window) and `unresponsive` handler (reloads).
- Added `uncaughtException` and `unhandledRejection` guards in the main process.

### Drag reliability fix
- Moved compact drag logic entirely to the main process. Renderer signals start/stop via IPC; main polls `screen.getCursorScreenPoint()` every 16 ms. This keeps the drag locked regardless of how fast the mouse moves.

### Compact mode v2 — 6 features

1. **Position memory** — `preCompactBounds` (snapshot of full-size position on compact entry) + `compactPosition` (last drag position of compact icon, persisted). `compact-drag-end` saves position. `enterCompact()` restores to last compact position (fallback: top-right of primary display).

2. **Compact toggle button in header** — Replaced the pin button with a ShortPath SVG logo button (13×13) in the top-left. Compact entry/exit is triggered from there.

3. **Always-on-top follows Settings** — Compact mode no longer forces `alwaysOnTop(true)`. Both `enterCompact()` and `restoreFromCompact()` call `win.setAlwaysOnTop(settings.alwaysOnTop ?? false)`. Pin button removed from header and its CSS removed from global.css.

4. **Compact hotkey** — Default `CommandOrControl+Shift+.`, stored as `compactHotkey` in settings. Registered at startup via `registerCompactHotkey()`. Added to `KeyboardPanel.tsx` alongside the summon hotkey — same capture/save/error flow, "Change" button style.

5. **Summon hotkey restores from compact** — `toggleWindow()` in main: when `isCompact`, calls `restoreFromCompact()` and sends `focus-search` to focus the search bar.

6. **Close-after-copy enters compact** — `handleCopy` in `App.tsx`: when `autoHideOnCopy` is set, calls `handleEnterCompact()` (with a 300 ms delay) instead of `hideWindow()`.

### Off-screen clamping
- Added `clampToDisplays(x, y, w, h)` in `src/main/index.ts`. Finds the display with the most overlap with the target bounds. Falls back to centering on the primary display if completely off-screen. Called in `restoreFromCompact()`.

### State sync (main → renderer)
- Added `compact-mode-changed` IPC event (bool payload). Main sends this when hotkey or tray click triggers a transition. Renderer subscribes in `App.tsx` to update `isCompact` state; restoring also increments `focusTrigger`.

### Help topics
- Updated the `compact-mode` topic in `src/renderer/features/help/topics.ts` to document all new behavior.

## Files changed

- `src/main/settings.ts` — added `compactPosition` and `compactHotkey` fields
- `src/main/index.ts` — `enterCompact`, `restoreFromCompact`, `toggleCompact`, `clampToDisplays`, `registerCompactHotkey`, `change-compact-hotkey` IPC handler, `compact-drag-end` saves position, `toggleWindow` restores from compact, startup compact placement
- `src/preload/index.ts` — added `changeCompactHotkey`, `onCompactModeChanged`; replaced `compactDragMove` with `compactDragEnd`
- `src/renderer/global.d.ts` — added `changeCompactHotkey`, `onCompactModeChanged`, `compactHotkey` in `getSettings` return
- `src/renderer/App.tsx` — compact toggle button in header, `onCompactModeChanged` subscription, `handleCopy` close-after-copy path, `compactHotkey` state passed to `KeyboardPanel`
- `src/renderer/components/KeyboardPanel.tsx` — compact hotkey row (capture/save/error) under "Global hotkeys"
- `src/renderer/styles/global.css` — removed pin button CSS, added minimal compact-toggle-btn rule
- `src/renderer/features/help/topics.ts` — compact-mode topic rewritten
- `src/store/csv.ts` — vertical label-match fallback (case-insensitive)

## Decisions

- `compactPosition` is a separate field from `preCompactBounds` so the two states never clobber each other.
- Compact hotkey default `Ctrl+Shift+.` was chosen to avoid conflicts with common system shortcuts.
- Drag polling stays in the main process (not renderer) so fast mouse movement cannot outrun the event queue.

## Known issues

- `src/renderer/components/MacroOverlay.tsx(109,51)`: `Cannot find name 'stripHtml'` — pre-existing, unrelated to this work.

## Next

- Build and release v0.6.8.
- Help topics for v0.6.0 features (onboarding, search mode toggle, sample data removal, favorites card view) still outstanding.
