# Session — 2026-06-08 (Post-phase features)

## Goal

Implement five user-requested features outside the original phase plan: adjustable text size, favorites, source-mode setup screen, in-overlay editing, and a proper disconnect-sync action.

## What changed

### Feature 1: Adjustable text size

- **src/main/settings.ts** — added `fontSize?: "small" | "medium" | "large"` to `AppSettings`
- **src/main/index.ts** — `set-font-size` IPC handler saves to settings; `load-entries` and `get-settings` return `fontSize`
- **src/renderer/styles/global.css** — `--font-size-base: 13px` CSS variable on `:root`; `body`, `.result-title`, and `.macro-body-text` now use it; font-size control styles
- **src/renderer/components/SettingsScreen.tsx** — Appearance section with Small/Medium/Large segmented buttons; applying via `document.documentElement.style.setProperty`
- **src/renderer/App.tsx** — reads `fontSize` from `loadEntries()`, applies CSS variable on startup

### Feature 2: Favorites

- **src/store/schema.ts** — `favorites: string[]` field on `StoreData`, `defaultStore()` initializes to `[]`
- **src/store/index.ts** — `openStore` backfills `favorites: []` for old stores; `deleteEntry` prunes favorites; `replaceSyncedEntries` prunes favorites; new `toggleFavorite(store, entryId)` function
- **src/main/index.ts** — `toggle-favorite` IPC handler; `pushStoreUpdate` and `load-entries` include `favorites`
- **src/preload/index.ts** and **src/renderer/global.d.ts** — `toggleFavorite`, `onStoreUpdated` carries favorites
- **src/renderer/components/ResultItem.tsx** — `isFavorite` / `onToggleFavorite` props; star button outside `.result-actions` (always visible when starred, hover-only when not)
- **src/renderer/components/VerticalGroup.tsx** — threads `favorites` and `onToggleFavorite` through to ResultItem
- **src/renderer/components/FavoritesView.tsx** — new component; lists favorited entries as a flat result list with full edit/copy/open behavior
- **src/renderer/components/MacroOverlay.tsx** — star button in the header meta row
- **src/renderer/App.tsx** — `favorites: Set<string>` state; `handleToggleFavorite`; ☆ header icon opens favorites mode; FavoritesView rendered for mode `"favorites"`

### Feature 3: Source-mode setup and header indicator

- **src/main/settings.ts** — `sourceMode?: "local" | "sync"` and `sourceName?: string`
- **src/main/index.ts** — `save-source-mode` IPC handler; `load-entries` and `get-settings` return `sourceMode`, `sourceName`
- **src/renderer/components/SetupScreen.tsx** — new component; step 1 chooses Local or File Share Sync; step 2 (sync) captures a source name and shows the sync tutorial text
- **src/renderer/App.tsx** — checks `sourceMode` on load; sets `mode="setup"` on first launch; `handleSetupComplete`; header `<span>` replaced with clickable `<button className="app-path-btn">` showing source name; `handleGoHome` resets query and returns to browse

### Feature 4: In-overlay editing

- **src/renderer/components/MacroOverlay.tsx** — `onEdit` and `onDuplicate` props; edit strip below body content; local entries get "✎ Edit entry"; synced entries get "⊕ Duplicate to local and edit" with plain-language explanation
- **src/renderer/App.tsx** — `handleEditFromOverlay` closes overlay then opens edit form; `handleDuplicateEntry` calls `createEntry` with synced entry fields, adds result to local state, opens in edit mode

### Feature 5: Disconnect sync

- **src/main/index.ts** — `disconnect-sync` IPC handler: stops watcher, clears `settings.syncPath`, calls `replaceSyncedEntries(store, [])`, saves store and settings, pushes store update
- **src/renderer/components/SettingsScreen.tsx** — "Disconnect sync" button with 2-click confirm and caption; "Clear synced entries" button copy updated to explain the watcher keeps running; both use `disconnectConfirming` / `clearConfirming` state

## Decisions made

- **`favorites` as a `Set<string>` in renderer state, `string[]` in store.** Sets give O(1) membership tests in the hot render path. The store and IPC layer use plain arrays (JSON-serializable).
- **Star button outside `.result-actions`.** `.result-actions` has `opacity: 0` by default; individual children can't override a parent's opacity. Moving the star outside the container lets it be always visible when starred via a separate CSS rule.
- **Duplicate-to-local creates a copy, does not move.** The original synced entry remains. On the next sync refresh it is still present. The user gets a local copy they own, named identically. This is the only safe behavior given that sync overwrites the entire synced set.
- **`disconnect-sync` vs `clear-synced` are separate actions.** The confusion between them was a known limitation. "Clear synced" is useful when you want to temporarily empty synced content without changing sync configuration. "Disconnect sync" is what fully stops syncing.
- **Source name in header, not in settings.** Users need to see at a glance whose data they are viewing. Putting it in the header path (next to "shortpath /") makes it always visible without taking up a row.

## Commits in this session

- `6595be6` — feat: add favorites to store — field, toggle, migrate, prune
- `49aa03f` — feat: expand AppSettings with fontSize, sourceMode, sourceName
- `1a7341d` — feat: IPC handlers for favorites, font size, source mode, disconnect sync; update preload bridge
- `f61d390` — feat: adjustable text size — CSS variable, Settings control, applies on load
- `126f4da` — feat: favorites — star toggle on result items, favorites view
- `7854adb` — feat: overlay star toggle, edit/duplicate, first-launch setup screen
- `9aef39c` — feat: Help topics for text size, favorites, source mode, overlay editing, disconnect sync

## Next steps

**Phase 9 — Packaging**
- electron-builder NSIS (Windows) and DMG (Mac) targets
- Code signing documentation
- Build and release scripts
- First tagged release (v0.1.0)
