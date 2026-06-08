# Session — 2026-06-08 (Macro Overlay)

## Goal

Add an expandable macro view: clicking a result (or pressing Enter on a keyboard-focused result) opens a panel overlay with the full entry content, copy action, URL link, and tag chips.

## What changed

- **src/renderer/components/MacroOverlay.tsx** — new component. Renders a dimmed backdrop (`position: absolute; inset: 0`) containing a panel. Clicking the backdrop closes the overlay; clicking inside the panel does not (stopPropagation). Panel header shows vertical badge, type badge, title, Copy button (with 1.5s "Copied ✓" confirmation), and X close button. Body renders `entry.body` in a `<pre>` with `white-space: pre-wrap`. Footer (shown if `entry.link` or tags present) shows the URL as a clickable link via `window.shortpath.openExternal` and tag chips. Esc key captured at window level (capture phase) to close the overlay.

- **src/renderer/components/ResultItem.tsx** — added `onOpen: (entry: Entry) => void` prop. The whole `<li>` is now clickable (cursor pointer, `onClick={() => onOpen(entry)}`). The three action buttons (open link, edit, copy) now call `e.stopPropagation()` so they don't also trigger the overlay. Renamed `handleOpen` to `handleOpenLink` to avoid confusion.

- **src/renderer/components/VerticalGroup.tsx** — added `onOpen` prop, threaded through to each `ResultItem`.

- **src/renderer/App.tsx** — added `overlayEntry: Entry | null` state (null = closed). Added `handleOpenOverlay(entry)` and `handleCloseOverlay()`. Changed `handleEnter` to call `setOverlayEntry(entry)` instead of `performCopy` — Enter now opens the overlay, not silently copies. Updated `handleEscape`: dismisses overlay if open, then clears keyboard focus, then hides window (three-step Esc). Added `onOpen={handleOpenOverlay}` to both `ResultItem` (recents) and `VerticalGroupComponent` renders. Removed the now-unused `performCopy` function. Renders `<MacroOverlay>` inside the browse-mode shell when `overlayEntry` is set.

- **src/renderer/styles/global.css** — added `position: relative` to `.app-shell` (anchors the absolute-positioned backdrop). Added styles for: `.macro-backdrop`, `.macro-panel`, `.macro-header`, `.macro-header-meta`, `.macro-badge`, `.macro-badge-vertical`, `.macro-badge-type`, `.macro-title`, `.macro-header-actions`, `.macro-copy-btn`, `.macro-copy-btn.copied`, `.macro-close-btn`, `.macro-body`, `.macro-body-text`, `.macro-body-empty`, `.macro-footer`, `.macro-link`, `.macro-tags`, `.macro-tag-chip`.

## Decisions made

- **Enter opens overlay, not silently copies.** Previously Enter copied the focused entry. Now it opens the overlay, which has its own Copy button. The macro view is the primary interaction for keyboard users; copying from there is intentional.
- **Esc dismissal is three-step.** If overlay is open: close overlay. Else if result focused: clear focus. Else: hide window. This matches the progressive dismissal model already in place for focus.
- **MacroOverlay registers its own Esc listener at capture phase.** This intercepts Esc before the search bar sees it and before handleEscape in App runs. The overlay then calls `onClose`, which sets `overlayEntry` to null — no double-dismiss.
- **Backdrop uses `position: absolute` within `.app-shell`, not `position: fixed`.** The app is a small desktop popup with no browser chrome; fixed would also work, but absolute is more self-contained and keeps the overlay scoped to the app shell.
- **Copy inside overlay updates recents.** `onCopied` prop is wired to `handleCopy` in App, so copying from the overlay bumps the entry into the recents list the same way the inline copy button does.

## Commits in this session

- `04602f3` — feat: add expandable macro overlay with copy and external link support

## Next steps

Choose Phase 4 (shared-file sync) or Phase 6 (support tools section).
