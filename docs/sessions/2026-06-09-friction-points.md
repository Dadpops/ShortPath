# Session — 2026-06-09

## Goal

Close friction points across onboarding, hotkey discoverability, copy history persistence, sort modes, keyboard shortcuts, and entry management UX.

## What changed

- **Sample data onboarding**: All seed entries tagged `source:"sample"`. Renderer computes `hasSampleData` from entries. Dismissable banner appears above results when sample data is present. "Clear sample data" calls new `clear-sample-data` IPC which runs `clearSampleData()` in the store. `clearSampleData` removes entries, recents, favorites, pinned, and recentCopies where source is "sample".

- **Recent copies persistence**: `recentCopies: Array<{id, copiedAt}>` added to StoreData. `incrementCopyCount` maintains a 24h rolling window (max 20 entries), pruning on every copy. `load-entries` IPC returns recentCopies filtered to the last 24h. Renderer uses this instead of the previous session-only in-memory list. A persistent clipboard strip at the bottom of the popup replaces the old clipboard header icon.

- **Recently used sort**: New `SortMode` value `"recently-used"` sorts by `lastCopiedAt` on each Entry. `incrementCopyCount` now sets `lastCopiedAt` on all entries (not just local) so synced entries participate in the sort. Local/sample entries also get `copyCount` incremented.

- **Hotkey discoverability**: Tray tooltip now reads "ShortPath -- Press {hotkey} to open". Hotkey appears as a grayed-out (non-clickable) item in the tray right-click menu. A one-time tray notification fires 3s after first launch and sets `firstLaunchNotified: true` in settings so it never shows again. Hotkey changes rebuild the tray menu and tooltip immediately.

- **Configurable pin cap**: `pinCap: number` (default 8) added to AppSettings. `toggle-pin` IPC enforces this cap. `set-pin-cap` IPC updates it. Settings > Behavior shows a 4/8/12 toggle. App.tsx reads `pinCap` from `load-entries` and displays it in the pin-limit message.

- **Stream Deck re-export timestamp**: `lastStreamDeckExport` ISO timestamp saved to AppSettings after each export. Returned from `get-settings`. SettingsScreen shows "Re-export Stream Deck (HH:MM)" once a previous export exists.

- **Ctrl+N shortcut**: Window-level keydown handler opens the add-entry form when Ctrl+N (or Cmd+N on Mac) is pressed.

- **Search history**: `queryHistory: string[]` and `queryHistoryIdx` in App state. Pressing Enter records the query. Up-arrow in search bar (when no focused entry) cycles through the last 10 queries.

- **Empty search state**: When a query returns no results, a "Save {query} as new entry" button appears in the empty state. Clicking it opens the add form with the query pre-filled as the title.

- **rawGroups fix**: Removed a dead `applySortToItems` call on a throwaway mapped array in the non-searching branch of rawGroups.

## Decisions made

- **recentCopies in store, not settings**: The list is tied to entry IDs so it belongs with the entry data, not with UI preferences. Pruned on both write (incrementCopyCount) and read (load-entries IPC) as two lines of defense.

- **hasSampleData in renderer, not IPC**: The renderer already has all entries; computing `entries.some(e => e.source === "sample")` avoids an extra round-trip and keeps the main process free of presentation logic.

- **Search history is session-only**: A session's query list doesn't need to survive restarts. Persisting it would add store complexity for marginal gain. In-memory state is enough.

- **pinCap default 8**: Matches the existing behavior (was hardcoded). The 4/8/12 toggle gives enough range for most workflows without opening an arbitrary number input.

## Commits in this session

- `64024d9` — feat: data model for friction-point features
- `daeae52` — feat: main process for friction-point features
- `e5413e1` — feat: renderer UX for friction-point features

## Next steps

1. Wire up SetupScreen for first-time users (currently defined but never rendered).
2. Commit or clean up untracked test scripts and QA screenshots.
3. Code signing (Windows cert, Apple Developer ID).
4. Browser extension artwork and store submissions.
5. Duplicate detection across sync sources (deferred from this session).
6. Entry preview on hover (deferred from this session).

## Open questions / blockers

- SetupScreen (`src/renderer/components/SetupScreen.tsx`) exists but is not imported or rendered anywhere. Needs a first-launch detection hook (e.g. `entries.length === 0 && !settings.onboardingDone`) to decide when to show it.
- No blocker on macOS build; the dist:mac script is ready but the machine running builds is Windows-only.
