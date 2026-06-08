# ShortPath icons

App icon for ShortPath. Path + chevron mark: the double ">" reads as a folder path and nods to the name, the underline is the search field.

## Files

- `icon.svg` — master vector source, full two-chevron mark (rounded). Edit this to rework the app icon.
- `tray.svg` — simplified single-chevron variant for the tray. The full mark turns muddy at 16px; this one stays crisp.
- `icon.icns` — macOS app icon.
- `icon.ico` — Windows app icon (multi-resolution: 16 to 256).
- `icon.png` — 512px, used by electron-builder for Linux and as a generic fallback.
- `png/icon-*.png` — full mark at 16, 24, 32, 48, 64, 128, 256, 512, 1024.
- `png/tray-*.png` — simplified mark at 16, 24, 32, 48, 64. Use these in the menu bar / tray.

## Tray icon

Use the simplified `tray-*.png`, not the full app icon, for the menu bar / tray:
- Windows / Linux tray: `png/tray-32.png` (or `tray-16.png` on standard-DPI displays).
- macOS menu bar: macOS prefers a monochrome template image. The colored one works, but for a native look make a black-only version of `tray.svg` later and name it `iconTemplate.png`.

## Wiring into electron-builder

In `electron-builder.yml`, point each platform at the right file. Paths are relative to the build resources dir, adjust to wherever you place this folder (e.g. `build/icons/`):

```yaml
mac:
  icon: build/icons/icon.icns
win:
  icon: build/icons/icon.ico
linux:
  icon: build/icons/icon.png
```

For the tray in the main process:

```js
const { Tray, nativeImage } = require('electron')
const path = require('path')
const trayIcon = nativeImage.createFromPath(
  path.join(__dirname, '../build/icons/png/tray-32.png')
)
const tray = new Tray(trayIcon)
```

## Colors

- Background blue: `#2563eb`
- Front chevron / underline: `#ffffff`
- Back chevron: `#93c5fd`
