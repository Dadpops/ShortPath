# Session — 2026-06-10

## Goal

Add a dedicated Compact Mode settings page so users can control pin, icon size, and icon color independently. Fix the bug where the compact icon was not staying pinned above other windows.

## What changed

- **Bug fix:** `enterCompact()` was using `alwaysOnTop` (the main-window setting) instead of a compact-specific flag. Compact icon now defaults to always-on-top independently of the main window.
- **New `AppSettings` fields:** `compactAlwaysOnTop` (default true), `compactSize` (48/64/80px, default 64), `compactAccentColor` (null = follow theme, hex = custom).
- **New IPC handlers:** `set-compact-always-on-top`, `set-compact-size`, `set-compact-accent-color`. The live `setAlwaysOnTop` call for the compact window is applied immediately when changed while in compact mode.
- **Preload and `global.d.ts`** updated to expose and type the three new IPC calls and the new `getSettings` return fields.
- **Settings > Compact Mode** section added (between Behavior and Organization in the nav). Controls: Pin icon above all windows, Icon size (S/M/L), Icon color (follow theme or preset swatch), Restore window after copying.
- `autoRestoreOnCompactAction` moved from Behavior to Compact Mode.
- **Compact logo** changed from hardcoded `44px` to `69%` so it scales proportionally with any window size.
- **Help topic** for compact mode updated to document all new settings and clarify that pin/always-on-top is now per-mode.
- **MacroOverlay CI fix:** `stripHtml` was never defined; replaced with `htmlToPlain` (the existing export) and added it to the import. This unblocked a failing lint/typecheck CI run.

## Decisions made

- `compactAlwaysOnTop` defaults to `true` — the expected behavior is that the compact icon floats above other windows. The previous code accidentally inherited the main-window setting which defaulted to `false`, causing the reported bug.
- `restoreFromCompact()` reverts to `alwaysOnTop` (main-window setting) so the two modes stay independent.
- Size stored as a raw number (48/64/80) rather than a string enum so the main process can use it directly in `setBounds`.
- Color `null` = follow theme rather than storing the current accent value — this means if the user changes the app accent later, the compact icon updates too without any extra work.
- Auto-restore moved to Compact Mode rather than kept in Behavior — it is a compact-specific behavior and logically belongs there.

## Commits in this session

- `04131ca` — feat: add Compact Mode settings page with pin, size, and color controls
- `0b25e90` — fix(renderer): restore stripHtml reference in MacroOverlay

## Next steps

- Session wrap and push (done).
- Consider adding a live resize when `compactSize` changes while in compact mode (currently takes effect on next compact entry).
- Help topics for v0.6.0 features (onboarding, search mode toggle, sample data removal, favorites card view) remain unwritten.
- SetupScreen defined but never rendered — wire it up or delete it.
- Code signing (Windows/macOS) for distribution.

## Open questions / blockers

None.
