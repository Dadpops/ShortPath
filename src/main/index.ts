import { app, BrowserWindow, Tray, Menu, nativeImage, screen, globalShortcut } from "electron";
import path from "path";

const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 600;
const MARGIN = 12;

let tray: Tray | null = null;
let win: BrowserWindow | null = null;

function getBottomLeftPosition() {
  const display = screen.getPrimaryDisplay();
  const { x, y, height } = display.workArea;
  return {
    x: x + MARGIN,
    y: y + height - WINDOW_HEIGHT - MARGIN,
  };
}

function createWindow() {
  const pos = getBottomLeftPosition();

  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: pos.x,
    y: pos.y,
    resizable: true,
    frame: false,
    transparent: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.once("ready-to-show", () => {
    win?.show();
  });

  win.on("closed", () => {
    win = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(app.getAppPath(), "icons/png/tray-32.png")
  );
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show ShortPath", click: toggleWindow },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setToolTip("ShortPath");
  tray.setContextMenu(contextMenu);
  tray.on("click", toggleWindow);
}

function toggleWindow() {
  if (!win) {
    createWindow();
    return;
  }
  if (win.isVisible()) {
    win.hide();
  } else {
    const pos = getBottomLeftPosition();
    win.setPosition(pos.x, pos.y);
    win.show();
    win.focus();
  }
}

// Phase 4: replace this default with a user-configurable hotkey stored in settings.
const DEFAULT_HOTKEY = "CommandOrControl+Shift+Space";

app.whenReady().then(() => {
  createTray();
  createWindow();

  // Phase 4: registerHotkey is a stub — wires up globalShortcut to toggleWindow.
  registerHotkey(DEFAULT_HOTKEY);
});

function registerHotkey(accelerator: string) {
  // Stub: full implementation in Phase 4 (includes unregister-before-reregister,
  // conflict detection, and user-facing error if the key is taken).
  globalShortcut.register(accelerator, toggleWindow);
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Keep the app running when all windows are closed (tray app behavior)
app.on("window-all-closed", (e: Event) => {
  e.preventDefault();
});
