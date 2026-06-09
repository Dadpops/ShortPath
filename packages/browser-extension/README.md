# ShortPath Capture — Browser Extension

Save selected text and pages to ShortPath directly from your browser.

## What it does

- Adds a **"Save to ShortPath"** right-click menu item on any page or selected text.
- When ShortPath is running, the selection is sent directly and the app opens with the entry pre-filled.
- When ShortPath is not running, the capture is queued in browser storage and imported automatically the next time you open ShortPath.
- The popup (toolbar icon) shows connection status, lets you save the current page, and shows queue status.

## Setup

### 1. Generate placeholder icons (first time only)

```
node generate-icons.js
```

Replace the files in `icons/` with properly designed PNGs before publishing.

### 2. Build for Chrome

```
node build.js chrome
```

This creates `dist/chrome/` with all extension files.

### 3. Build for Firefox

```
node build.js firefox
```

This creates `dist/firefox/` with all extension files.

## Installing in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/chrome/` directory

## Installing in Firefox

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** in the sidebar
3. Click **Load Temporary Add-on...**
4. Select `dist/firefox/manifest.json`

Note: Temporary add-ons are removed when Firefox restarts. For a persistent install, sign the extension through Mozilla's add-on portal.

## How to use

### Right-click menu

1. Select text on any page (optional — leave unselected to capture the full page URL and title).
2. Right-click and choose **Save to ShortPath**.
3. If ShortPath is running, it opens with the entry pre-filled. If not, the capture is queued.

### Toolbar popup

Click the ShortPath icon in your browser toolbar:

- **Green dot — ShortPath is running**: Click "Save current page" to capture the active tab. If items are queued, an "Import now" button appears.
- **Red dot — ShortPath is not running**: Shows how many items are queued and troubleshooting guidance.

## Queue behavior

When ShortPath is not running, captured items are stored in browser local storage. They are sent to ShortPath automatically when:

- The browser extension starts up and ShortPath is already running.
- You click "Import now" in the popup.

Items remain in the queue until successfully imported. The queue is per-browser-profile and is not synced across devices.

## Troubleshooting

**ShortPath isn't running**
- Look for the ShortPath icon in your system tray (Windows) or menu bar (macOS).
- Press your configured hotkey (default: Ctrl+Shift+Space on Windows, Cmd+Shift+Space on macOS).
- If ShortPath is not installed, download it from [https://github.com/Dadpops/ShortPath/releases](https://github.com/Dadpops/ShortPath/releases)

**Extension can't connect even when ShortPath is open**
- ShortPath listens on port 57433 (localhost only). Make sure nothing else is using that port.
- Reload the extension in `chrome://extensions` or restart the browser.

**Captured text is missing or truncated**
- The extension sends whatever text was selected at the time of the right-click. Select the text before right-clicking.
