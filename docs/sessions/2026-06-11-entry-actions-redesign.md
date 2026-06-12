# Session: 2026-06-11 — Entry actions redesign + compact mode drag fix

## Status: complete

## What was done

### Audit findings
- `ResultItem.tsx` is the primary action-button host (used by VerticalGroup and FavoritesView)
- `SupportToolsGroup.tsx` had a private `ToolItem` function with **duplicated** button implementations
- Current buttons were 26×22px, 4px gap, text characters (⎘ ★ ↗ ✎), no width-aware behavior, no explicit focus ring
- No ResizeObserver on result rows; only the header had one (< 420px breakpoint)
- `action-btn` CSS class was shared; button HTML was duplicated

### New shared component: `EntryActions`
Created `src/renderer/components/EntryActions.tsx` — consolidates all four quick-action buttons (Copy, Open Link, Favorite, Edit) into one component used by both `ResultItem` and `SupportToolsGroup.ToolItem`.

Layout (left to right): Copy (38×38px primary) → Open Link (38×38px primary) → Favorite (32px ghost) → Edit (32px ghost). Primary buttons use `--color-accent-dim` background and `--color-accent` color, hover inverts to solid accent with white icon. Secondary buttons are ghost (no background) with 32×32px hit area for a minimum 32px interactive zone.

SVG icons at 18px (primary) and 15px (secondary). `aria-label` on all buttons. `title` tooltip on all buttons. Visible `:focus-visible` ring matching accent color.

### Responsive collapse
`ResultItem` and `SupportToolsGroup.ToolItem` each attach a `ResizeObserver` on their `<li>` element. Threshold: **360px** (li width) — triggers when the window is dragged to its minimum (360px). Below threshold, Favorite and Edit collapse into a `...` overflow trigger (32px ghost button). Copy and Open Link are never hidden or collapsed at any width; entry title truncates instead.

Overflow menu rendered via `createPortal(document.body)` — never clipped by the row or list container. Keyboard navigable: ArrowUp/Down to move focus, Enter to select, Esc to close and return focus to trigger. Closes on selection, Esc, and outside click.

`EntryActions` also observes `document.body[data-density="compact"]` via `MutationObserver` and forces the collapsed layout when density compact mode is active.

### Compact mode drag bug fix
Root cause: `.compact-view:hover .compact-logo { transform: scale(1.08) }` — the hover scale re-fires repeatedly as `setPosition()` calls (16ms drag polling interval) cause the browser to re-evaluate hover state while the cursor is over the icon.

Fix: changed selector to `.compact-view:hover:not(:active) .compact-logo` so the scale is suppressed while the mouse button is pressed. Also added `onPointerCancel` handler in `App.tsx` to call `compactDragEnd` if the pointer is cancelled mid-drag (e.g. system gesture interrupts).

Removed the "Known issues" section from README since the bug is now fixed.

### Help topics updated
- `hover-actions` description updated to describe primary/secondary hierarchy and overflow collapse
- Favorites topic updated with new star button description
- Compact mode topic updated with drag behavior note; known issue removed

## Files changed
- `src/renderer/components/EntryActions.tsx` — new shared component
- `src/renderer/components/ResultItem.tsx` — uses EntryActions, ResizeObserver on li
- `src/renderer/components/SupportToolsGroup.tsx` — uses EntryActions in ToolItem, ResizeObserver on li
- `src/renderer/styles/global.css` — `.result-actions { gap: 8px }`, new `.ea-*` styles, compact hover fix
- `src/renderer/App.tsx` — `onPointerCancel` for compact drag cleanup
- `src/renderer/features/help/topics.ts` — updated hover-actions, favorites, compact-mode topics
- `README.md` — removed known issues section

## Verified
- Search results: Copy (accent-tinted primary) + Open Link (primary when entry has link) + Fav/Edit (ghost secondaries) visible on focused row
- Narrow window (~360px): Fav/Edit collapse to `...` overflow; Copy + Open Link stay full size
- Browse view: actions hidden until hover/focus
- Build: clean (no TypeScript errors)
