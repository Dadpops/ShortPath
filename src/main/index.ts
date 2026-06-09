import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  screen,
  globalShortcut,
  ipcMain,
  dialog,
  clipboard,
  shell,
  Notification,
} from "electron";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import chokidar from "chokidar";
import { autoUpdater } from "electron-updater";
import { openStore, saveStore, addEntry, updateEntry, deleteEntry, recordAccess, reorderEntry, replaceSyncedEntries, replaceEntriesFromSource, toggleFavorite, togglePin, incrementCopyCount, renameVertical, addVertical, clearLocalEntries, clearSampleData, addSubFolder, renameSubFolder, removeSubFolder, deleteVertical } from "../store/index";
import { openNotes, saveNotes, createNote as storeCreateNote, updateNote as storeUpdateNote, deleteNote as storeDeleteNote } from "../store/notes";
import { applySeed } from "../store/seed";
import { importCsv, exportCsv, parseCsvPreview, parseCsvPreviewWithMapping, importCsvWithMapping, parseSyncedCsv, CSV_TEMPLATE_CONTENT } from "../store/csv";
import { loadSettings, saveSettings, type AppSettings, type SyncSourceConfig } from "./settings";
import type { StoreData } from "../store/schema";
import type { Entry, Note, ColumnMapping, CapturePayload } from "../shared/types";

const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 640;
const MARGIN = 12;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on("update-available", (info) => {
  if (win && !win.isDestroyed()) {
    const url = `https://github.com/Dadpops/ShortPath/releases/tag/v${info.version}`;
    win.webContents.send("update-available", { version: info.version, url });
  }
});
autoUpdater.on("update-downloaded", () => {
  if (win && !win.isDestroyed()) win.webContents.send("update-downloaded");
});
autoUpdater.on("error", (err) => console.error("Updater:", err.message));

const SIZE_PRESETS = {
  small:  { width: 380, height: 520 },
  medium: { width: 480, height: 640 },
  large:  { width: 580, height: 760 },
} as const;

let tray: Tray | null = null;
let trayIconBase: ReturnType<typeof nativeImage.createFromPath> | null = null;
let trayIconActive: ReturnType<typeof nativeImage.createFromPath> | null = null;
let win: BrowserWindow | null = null;
let store: StoreData;
let notesData: { notes: Note[] };
let userDataPath: string;
let settings: AppSettings;

// Local HTTP capture server for the browser extension.
let captureServer: http.Server | null = null;

// Holds the last CSV string opened via preview-csv-import, waiting for commit-csv-import.
let pendingCsvImport: string | null = null;
// When the user provides a column mapping, it is stored here and used by commit-csv-import.
let pendingColumnMapping: ColumnMapping | null = null;

// Debounce timer for saving window bounds after move/resize.
let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;

// Sync state — multiple sources supported via syncWatchers map
const syncWatchers = new Map<string, chokidar.FSWatcher>();
const syncDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const syncLastRefreshed: Record<string, string> = {};

function getBottomLeftPosition() {
  const display = screen.getPrimaryDisplay();
  const { x, y, height } = display.workArea;
  return {
    x: x + MARGIN,
    y: y + height - WINDOW_HEIGHT - MARGIN,
  };
}

function createWindow() {
  const saved = settings.windowBounds;
  const pos = saved ?? getBottomLeftPosition();
  const preset = settings.windowSize ? SIZE_PRESETS[settings.windowSize] : null;
  const width = preset ? preset.width : (saved?.width ?? WINDOW_WIDTH);
  const height = preset ? preset.height : (saved?.height ?? WINDOW_HEIGHT);

  win = new BrowserWindow({
    width,
    height,
    x: pos.x,
    y: pos.y,
    opacity: settings.opacity !== undefined ? settings.opacity / 100 : 1,
    resizable: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    skipTaskbar: true,
    alwaysOnTop: settings.alwaysOnTop ?? false,
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
    if (tray && trayIconActive) tray.setImage(trayIconActive);
  });

  win.on("closed", () => {
    win = null;
  });

  win.on("hide", () => {
    if (tray && trayIconBase) tray.setImage(trayIconBase);
  });

  function scheduleSaveBounds() {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    saveBoundsTimer = setTimeout(() => {
      if (!win) return;
      const [width, height] = win.getSize();
      const [x, y] = win.getPosition();
      settings = { ...settings, windowBounds: { x, y, width, height } };
      saveSettings(userDataPath, settings);
    }, 400);
  }

  win.on("move", scheduleSaveBounds);
  win.on("resize", scheduleSaveBounds);
}

function buildActiveIcon(base: ReturnType<typeof nativeImage.createFromPath>) {
  const { width, height } = base.getSize();
  const bitmap = base.getBitmap();
  for (let i = 0; i < bitmap.length; i += 4) {
    if (bitmap[i + 3] > 0) {
      bitmap[i]     = Math.min(bitmap[i]     + 70, 255);
      bitmap[i + 1] = Math.min(bitmap[i + 1] + 70, 255);
      bitmap[i + 2] = Math.min(bitmap[i + 2] + 70, 255);
    }
  }
  return nativeImage.createFromBitmap(bitmap, { width, height });
}

function buildTrayMenu() {
  const hotkeyLabel = settings?.hotkey ?? "CommandOrControl+Shift+Space";
  return Menu.buildFromTemplate([
    { label: "Show ShortPath", click: toggleWindow },
    { label: hotkeyLabel, enabled: false },
    { type: "separator" },
    { label: "Import CSV", click: handleImportFromTray },
    { label: "Export CSV", click: handleExportFromTray },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        if (!win) createWindow();
        else { win.show(); win.focus(); }
        win?.webContents.send("open-settings");
      },
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
}

function createTray() {
  trayIconBase = nativeImage.createFromPath(
    path.join(app.getAppPath(), "icons/png/tray-32.png")
  );
  trayIconActive = buildActiveIcon(trayIconBase);
  tray = new Tray(trayIconBase);

  const hotkeyLabel = settings?.hotkey ?? "CommandOrControl+Shift+Space";
  tray.setToolTip(`ShortPath — Press ${hotkeyLabel} to open`);
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", toggleWindow);
}

function toggleWindow() {
  if (!win) {
    createWindow();
    return;
  }
  if (win.isVisible()) {
    win.hide();
    if (tray && trayIconBase) tray.setImage(trayIconBase);
  } else {
    win.show();
    win.focus();
    win.webContents.send("focus-search");
    if (tray && trayIconActive) tray.setImage(trayIconActive);
  }
}

function pushStoreUpdate() {
  win?.webContents.send("store-updated", {
    entries: store.entries,
    verticals: store.verticals,
    recents: store.recents,
    favorites: store.favorites,
    pinned: store.pinned,
  });
}

async function handleImportFromTray() {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });
  if (!filePaths[0]) return;

  try {
    const csvString = fs.readFileSync(filePaths[0], "utf-8");
    const result = importCsv(store, csvString, "local");
    store = result.store;
    saveStore(userDataPath, store);
    pushStoreUpdate();
  } catch (err) {
    console.error("CSV import failed:", err);
  }
}

async function handleExportFromTray() {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "shortpath-export.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!filePath) return;

  try {
    fs.writeFileSync(filePath, exportCsv(store.entries, store.verticals), "utf-8");
  } catch (err) {
    console.error("CSV export failed:", err);
  }
}

function loadSyncedFile(sourceId: string, filePath: string): { ok: boolean; errors: string[] } {
  try {
    const csvString = fs.readFileSync(filePath, "utf-8");
    const { entries: syncedEntries, errors } = parseSyncedCsv(csvString);
    store = replaceEntriesFromSource(store, sourceId, syncedEntries);
    saveStore(userDataPath, store);
    syncLastRefreshed[sourceId] = new Date().toISOString();
    pushStoreUpdate();
    win?.webContents.send("sync-refreshed");
    return { ok: true, errors };
  } catch (err) {
    console.error("Sync file load failed:", err);
    return { ok: false, errors: [String(err)] };
  }
}

function startSyncWatcher(sourceId: string, filePath: string) {
  stopSyncWatcher(sourceId);
  const watcher = chokidar.watch(filePath, {
    persistent: false,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignoreInitial: true,
  });
  watcher.on("change", () => {
    const existing = syncDebounceTimers.get(sourceId);
    if (existing) clearTimeout(existing);
    syncDebounceTimers.set(sourceId, setTimeout(() => loadSyncedFile(sourceId, filePath), 200));
  });
  watcher.on("error", (err) => console.error("Sync watcher error:", err));
  syncWatchers.set(sourceId, watcher);
}

function stopSyncWatcher(sourceId: string) {
  const timer = syncDebounceTimers.get(sourceId);
  if (timer) { clearTimeout(timer); syncDebounceTimers.delete(sourceId); }
  const watcher = syncWatchers.get(sourceId);
  if (watcher) { void watcher.close(); syncWatchers.delete(sourceId); }
}

function stopAllSyncWatchers() {
  for (const id of syncWatchers.keys()) stopSyncWatcher(id);
}

// ── Capture server helpers ────────────────────────────────────────────────────

function startCaptureServer() {
  captureServer = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", version: app.getVersion() }));
      return;
    }

    if (req.method === "POST" && req.url === "/capture") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body) as CapturePayload;
          if (!payload.title || typeof payload.title !== "string" || !payload.url || typeof payload.url !== "string") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
            return;
          }
          if (win && !win.isDestroyed()) {
            win.show();
            win.focus();
            win.webContents.send("capture-entry", payload);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  captureServer.on("error", (err) => console.error("Capture server error:", err.message));
  captureServer.listen(57433, "127.0.0.1");
}

// ── URL fetch + Readability ───────────────────────────────────────────────────

function fetchHtml(url: string): Promise<{ ok: true; html: string; finalUrl: string } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith("https://") ? https : http;
    const req = client.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        fetchHtml(redirectUrl).then(resolve);
        res.resume();
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        resolve({ ok: false, error: `HTTP ${res.statusCode ?? "error"}` });
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve({ ok: true, html: Buffer.concat(chunks).toString("utf-8"), finalUrl: url }));
    });
    req.on("error", (err) => resolve({ ok: false, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "Request timeout" }); });
  });
}

// ── Markdown import helpers ───────────────────────────────────────────────────

interface ImportSection { title: string; body: string; selected: boolean }

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/!\[.*?\]\(.+?\)/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

function splitMarkdownSections(text: string): ImportSection[] {
  const lines = text.split("\n");
  const sections: ImportSection[] = [];
  let currentTitle = "";
  const bodyLines: string[] = [];

  function flush() {
    const body = stripMarkdown(bodyLines.join("\n"));
    if (currentTitle && body) sections.push({ title: currentTitle, body, selected: true });
    bodyLines.length = 0;
  }

  for (const line of lines) {
    const h3 = /^###\s+(.+)$/.exec(line);
    const h2 = !h3 && /^##(?!#)\s+(.+)$/.exec(line);
    if (h2 || h3) {
      flush();
      currentTitle = (h2 ? h2[1] : h3![1]).trim();
    } else {
      bodyLines.push(line);
    }
  }
  flush();
  return sections;
}

// ── PDF text splitter ─────────────────────────────────────────────────────────

function splitPdfText(text: string): ImportSection[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const sections: ImportSection[] = [];
  let currentTitle = "Content";
  const bodyParts: string[] = [];

  function flush() {
    const body = bodyParts.filter(Boolean).join("\n\n").trim();
    if (body) sections.push({ title: currentTitle, body, selected: true });
    bodyParts.length = 0;
  }

  for (const para of paragraphs) {
    const firstLine = para.split("\n")[0].trim();
    const lines = para.split("\n");
    const isHeading =
      (firstLine.length > 3 && firstLine.length < 80 && firstLine === firstLine.toUpperCase() && /[A-Z]/.test(firstLine)) ||
      (lines.length === 1 && firstLine.length < 60 && !firstLine.endsWith(".") && firstLine.length > 3);

    if (isHeading && bodyParts.length > 0) {
      flush();
      currentTitle = firstLine;
      const rest = lines.slice(1).join("\n").trim();
      if (rest) bodyParts.push(rest);
    } else if (isHeading) {
      currentTitle = firstLine;
      const rest = lines.slice(1).join("\n").trim();
      if (rest) bodyParts.push(rest);
    } else {
      bodyParts.push(para);
    }
  }
  flush();
  return sections.length > 0 ? sections : [{ title: "Content", body: text.trim(), selected: true }];
}

function registerIpcHandlers() {
  ipcMain.handle("load-entries", () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentCopies = (store.recentCopies ?? []).filter((r) => r.copiedAt > cutoff);
    return {
      entries: store.entries,
      verticals: store.verticals,
      recents: store.recents,
      favorites: store.favorites,
      pinned: store.pinned,
      recentCopies,
      fontSize: settings.fontSize ?? 13,
      theme: settings.theme ?? "dark",
      accentColor: settings.accentColor ?? null,
      opacity: settings.opacity ?? 100,
      windowSize: settings.windowSize ?? null,
      density: settings.density ?? "comfortable",
      verticalOrder: settings.verticalOrder ?? [],
      autoHideOnCopy: settings.autoHideOnCopy ?? false,
      alwaysOnTop: settings.alwaysOnTop ?? false,
      pinCap: settings.pinCap ?? 8,
      lastStreamDeckExport: settings.lastStreamDeckExport ?? null,
    };
  });

  ipcMain.handle(
    "create-entry",
    (_e, fields: Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">, verticalLabel?: string) => {
      const result = addEntry(store, fields, verticalLabel);
      store = result.store;
      saveStore(userDataPath, store);
      return { entry: result.entry, verticals: store.verticals };
    }
  );

  ipcMain.handle("reorder-entry", (_e, entryId: string, direction: "up" | "down") => {
    store = reorderEntry(store, entryId, direction);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("record-access", (_e, entryId: string) => {
    store = recordAccess(store, entryId);
    saveStore(userDataPath, store);
  });

  ipcMain.handle(
    "update-entry",
    (_e, id: string, updates: Partial<Omit<Entry, "id" | "createdAt" | "source">>) => {
      const result = updateEntry(store, id, updates);
      store = result.store;
      saveStore(userDataPath, store);
      return result.entry;
    }
  );

  ipcMain.handle("delete-entry", (_e, id: string) => {
    store = deleteEntry(store, id);
    saveStore(userDataPath, store);
  });

  // Two-step import: preview then commit. Used by the in-app import screen.
  ipcMain.handle("preview-csv-import", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    try {
      const csvString = fs.readFileSync(filePaths[0], "utf-8");
      pendingCsvImport = csvString;
      pendingColumnMapping = null;
      const preview = parseCsvPreview(csvString);
      return { success: true, ...preview };
    } catch (err) {
      pendingCsvImport = null;
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("commit-csv-import", (_e, resolutions: Record<number, string> = {}) => {
    if (!pendingCsvImport) return { success: false, errors: ["No pending import. Open a file first."] };

    try {
      const result = pendingColumnMapping
        ? importCsvWithMapping(store, pendingCsvImport, pendingColumnMapping, "local", resolutions as Record<number, import("../store/csv").RowResolution>)
        : importCsv(store, pendingCsvImport, "local", resolutions as Record<number, import("../store/csv").RowResolution>);
      store = result.store;
      saveStore(userDataPath, store);
      pendingCsvImport = null;
      pendingColumnMapping = null;
      pushStoreUpdate();
      return {
        success: true,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  // Stage a CSV file by path (used by drag-and-drop in the import screen).
  ipcMain.handle("stage-csv-file", (_e, filePath: string) => {
    try {
      const csvString = fs.readFileSync(filePath, "utf-8");
      pendingCsvImport = csvString;
      pendingColumnMapping = null;
      const preview = parseCsvPreview(csvString);
      return { success: true, ...preview };
    } catch (err) {
      pendingCsvImport = null;
      return { success: false, errors: [String(err)] };
    }
  });

  // Re-parse the staged CSV using the user-supplied column mapping.
  ipcMain.handle("preview-csv-with-mapping", (_e, mapping: ColumnMapping) => {
    if (!pendingCsvImport) return { success: false, errors: ["No staged file."] };
    try {
      pendingColumnMapping = mapping;
      const preview = parseCsvPreviewWithMapping(pendingCsvImport, mapping);
      return { success: true, ...preview };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  // Single-step import — used by the tray menu path via IPC (kept for compatibility).
  ipcMain.handle("import-csv", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    try {
      const csvString = fs.readFileSync(filePaths[0], "utf-8");
      const result = importCsv(store, csvString, "local");
      store = result.store;
      saveStore(userDataPath, store);
      pushStoreUpdate();
      return {
        success: true,
        entries: store.entries,
        verticals: store.verticals,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-csv", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      fs.writeFileSync(filePath, exportCsv(store.entries, store.verticals), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-mine", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-mine.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      const localEntries = store.entries.filter((e) => e.source === "local");
      fs.writeFileSync(filePath, exportCsv(localEntries, store.verticals), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-selected", async (_e, ids: string[]) => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      const idSet = new Set(ids);
      const selected = store.entries.filter((e) => idSet.has(e.id));
      fs.writeFileSync(filePath, exportCsv(selected, store.verticals), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-streamdeck-profile", async (_e, cols: number = 5, rows: number = 3) => {
    const MAX_BUTTONS = cols * rows;
    const entries = store.entries.slice(0, MAX_BUTTONS);
    const capped = store.entries.length > MAX_BUTTONS;

    const profileUuid = randomUUID().toUpperCase();
    const pageUuid = randomUUID().toLowerCase();

    const outerManifest = {
      AppIdentifier: "com.elgato.StreamDeck",
      Version: "3.0",
      Name: "ShortPath",
      Pages: { Current: pageUuid },
    };

    const actions: Record<string, unknown> = {};
    entries.forEach((e, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const actionId = randomUUID().toUpperCase();
      actions[`${col},${row}`] = {
        ActionID: actionId,
        LinkedTitle: true,
        Name: e.title,
        UUID: "com.elgato.streamdeck.system.open",
        Settings: { openInBrowser: false, path: "" },
        State: 0,
        States: [
          {
            Title: e.title,
            Image: "",
            ShowTitle: true,
            TitleAlignment: "bottom",
            TitleColor: "#ffffff",
            FontSize: 9,
          },
        ],
      };
    });

    const pageManifest = {
      Controllers: [{ Actions: actions, Type: "Keypad" }],
    };

    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "ShortPath.streamDeckProfile",
      filters: [{ name: "Stream Deck Profile", extensions: ["streamDeckProfile"] }],
    });
    if (!filePath) return { success: false };

    try {
      const zip = new JSZip();
      const profileDir = `${profileUuid}.sdProfile/`;
      zip.file(`${profileDir}manifest.json`, JSON.stringify(outerManifest, null, 2));
      zip.file(`${profileDir}Profiles/${pageUuid}/manifest.json`, JSON.stringify(pageManifest, null, 2));
      const content = await zip.generateAsync({ type: "nodebuffer" });
      fs.writeFileSync(filePath, content);
      settings = { ...settings, lastStreamDeckExport: new Date().toISOString() };
      saveSettings(userDataPath, settings);
      return { success: true, capped };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("download-template-csv", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-template.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      fs.writeFileSync(filePath, CSV_TEMPLATE_CONTENT, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("read-clipboard", () => clipboard.readText());

  ipcMain.handle("open-external", (_e, url: string) => shell.openExternal(url));

  ipcMain.handle("hide-window", () => win?.hide());

  ipcMain.handle("get-settings", () => ({
    hotkey: settings.hotkey,
    fontSize: settings.fontSize ?? 13,
    theme: settings.theme ?? "dark",
    accentColor: settings.accentColor ?? null,
    opacity: settings.opacity ?? 100,
    windowSize: settings.windowSize ?? null,
    density: settings.density ?? "comfortable",
    verticalOrder: settings.verticalOrder ?? [],
    autoHideOnCopy: settings.autoHideOnCopy ?? false,
    alwaysOnTop: settings.alwaysOnTop ?? false,
    pinCap: settings.pinCap ?? 8,
    lastStreamDeckExport: settings.lastStreamDeckExport ?? null,
  }));

  ipcMain.handle("toggle-favorite", (_e, entryId: string) => {
    store = toggleFavorite(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("set-font-size", (_e, size: number) => {
    settings = { ...settings, fontSize: size };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-theme", (_e, theme: "dark" | "light") => {
    settings = { ...settings, theme };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-accent", (_e, color: string) => {
    settings = { ...settings, accentColor: color };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-opacity", (_e, value: number) => {
    const clamped = Math.max(70, Math.min(100, value));
    win?.setOpacity(clamped / 100);
    settings = { ...settings, opacity: clamped };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-window-size", (_e, size: "small" | "medium" | "large") => {
    const dims = SIZE_PRESETS[size];
    if (!dims || !win) return;
    win.setSize(dims.width, dims.height);
    settings = { ...settings, windowSize: size };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-density", (_e, density: "compact" | "comfortable") => {
    settings = { ...settings, density };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-vertical-order", (_e, order: string[]) => {
    settings = { ...settings, verticalOrder: order };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-auto-hide-on-copy", (_e, value: boolean) => {
    settings = { ...settings, autoHideOnCopy: value };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-always-on-top", (_e, value: boolean) => {
    settings = { ...settings, alwaysOnTop: value };
    saveSettings(userDataPath, settings);
    win?.setAlwaysOnTop(value);
  });

  ipcMain.handle("toggle-pin", (_e, entryId: string) => {
    store = togglePin(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
    return { ok: true, pinned: store.pinned.includes(entryId) };
  });

  ipcMain.handle("increment-copy-count", (_e, entryId: string) => {
    store = incrementCopyCount(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("minimize-window", () => win?.minimize());

  ipcMain.handle("rename-vertical", (_e, id: string, newLabel: string) => {
    store = renameVertical(store, id, newLabel);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("save-source-mode", (_e, mode: "local" | "sync", name?: string) => {
    settings = { ...settings, sourceMode: mode, sourceName: name };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("disconnect-sync", (_e, sourceId: string) => {
    stopSyncWatcher(sourceId);
    store = replaceEntriesFromSource(store, sourceId, []);
    saveStore(userDataPath, store);
    settings = { ...settings, syncSources: (settings.syncSources ?? []).filter((s) => s.id !== sourceId) };
    saveSettings(userDataPath, settings);
    delete syncLastRefreshed[sourceId];
    pushStoreUpdate();
    win?.webContents.send("sync-refreshed");
  });

  ipcMain.handle("change-hotkey", (_e, accelerator: string) => {
    const ok = registerHotkey(accelerator);
    if (ok) {
      settings = { ...settings, hotkey: accelerator };
      saveSettings(userDataPath, settings);
      if (tray) {
        tray.setToolTip(`ShortPath — Press ${accelerator} to open`);
        tray.setContextMenu(buildTrayMenu());
      }
    }
    return { ok };
  });

  ipcMain.handle("reset-window-position", () => {
    if (!win) return;
    const pos = getBottomLeftPosition();
    win.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
    win.setPosition(pos.x, pos.y);
    settings = { ...settings, windowBounds: { ...pos, width: WINDOW_WIDTH, height: WINDOW_HEIGHT } };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("configure-sync", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      title: "Select shared sync CSV",
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    const filePath = filePaths[0];
    const id = randomUUID();
    const label = path.basename(filePath, path.extname(filePath));
    const newSource: SyncSourceConfig = { id, path: filePath, label };
    settings = { ...settings, syncSources: [...(settings.syncSources ?? []), newSource] };
    saveSettings(userDataPath, settings);

    const result = loadSyncedFile(id, filePath);
    startSyncWatcher(id, filePath);
    return { success: true, source: newSource, errors: result.errors };
  });

  ipcMain.handle("refresh-synced", (_e, sourceId?: string) => {
    const sources = settings.syncSources ?? [];
    if (sourceId) {
      const source = sources.find((s) => s.id === sourceId);
      if (!source) return { success: false, errors: ["Source not found."] };
      const result = loadSyncedFile(source.id, source.path);
      return { success: result.ok, errors: result.errors };
    }
    // Refresh all sources
    const errors: string[] = [];
    for (const source of sources) {
      const result = loadSyncedFile(source.id, source.path);
      errors.push(...result.errors);
    }
    return { success: true, errors };
  });

  ipcMain.handle("clear-synced", () => {
    store = replaceSyncedEntries(store, []);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("get-sync-status", () => {
    const sources = settings.syncSources ?? [];
    return {
      sources: sources.map((s) => ({
        id: s.id,
        path: s.path,
        label: s.label,
        syncedCount: store.entries.filter((e) => e.source === "synced" && e.syncSource === s.id).length,
        lastRefreshed: syncLastRefreshed[s.id] ?? null,
      })),
    };
  });

  ipcMain.handle("rename-sync-source", (_e, sourceId: string, newLabel: string) => {
    settings = {
      ...settings,
      syncSources: (settings.syncSources ?? []).map((s) =>
        s.id === sourceId ? { ...s, label: newLabel } : s
      ),
    };
    saveSettings(userDataPath, settings);
    return { success: true };
  });

  ipcMain.handle("ping", () => "pong");

  ipcMain.handle("notes:load", () => notesData.notes);

  ipcMain.handle("add-vertical", (_e, label: string) => {
    const result = addVertical(store, label);
    store = result.store;
    saveStore(userDataPath, store);
    return result.vertical;
  });

  ipcMain.handle("clear-local-entries", () => {
    store = clearLocalEntries(store);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("clear-sample-data", () => {
    store = clearSampleData(store);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("set-pin-cap", (_e, cap: number) => {
    settings = { ...settings, pinCap: cap };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("add-subfolder", (_e, verticalId: string, label: string, parentSubFolderId?: string) => {
    const result = addSubFolder(store, verticalId, label, parentSubFolderId);
    store = result.store;
    saveStore(userDataPath, store);
    pushStoreUpdate();
    return result.subFolder;
  });

  ipcMain.handle("delete-vertical", (_e, verticalId: string) => {
    store = deleteVertical(store, verticalId);
    saveStore(userDataPath, store);
    if (settings.verticalOrder?.includes(verticalId)) {
      settings.verticalOrder = settings.verticalOrder.filter((id) => id !== verticalId);
      saveSettings(userDataPath, settings);
    }
    pushStoreUpdate();
  });

  ipcMain.handle("rename-subfolder", (_e, verticalId: string, subFolderId: string, newLabel: string) => {
    store = renameSubFolder(store, verticalId, subFolderId, newLabel);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("remove-subfolder", (_e, verticalId: string, subFolderId: string) => {
    store = removeSubFolder(store, verticalId, subFolderId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("notes:create", (_e, fields: { title?: string; body: string; entryId?: string; entryTitle?: string }) => {
    const result = storeCreateNote(notesData, fields);
    notesData = result.data;
    saveNotes(userDataPath, notesData);
    return result.note;
  });

  ipcMain.handle("notes:update", (_e, id: string, updates: { title?: string; body: string }) => {
    const result = storeUpdateNote(notesData, id, updates);
    notesData = result.data;
    saveNotes(userDataPath, notesData);
    return result.note;
  });

  ipcMain.handle("notes:delete", (_e, id: string) => {
    notesData = storeDeleteNote(notesData, id);
    saveNotes(userDataPath, notesData);
  });

  ipcMain.handle("check-for-updates", async () => {
    if (!app.isPackaged) return null;
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) return null;
      const { version } = result.updateInfo;
      if (version === app.getVersion()) return null;
      return { version, url: `https://github.com/Dadpops/ShortPath/releases/tag/v${version}` };
    } catch {
      return null;
    }
  });

  ipcMain.handle("download-update", () => { autoUpdater.downloadUpdate().catch(console.error); });
  ipcMain.handle("install-update", () => { autoUpdater.quitAndInstall(); });

  // Fetch the raw HTML in main and return it to the renderer for parsing.
  // Readability + DOMParser run in the renderer (browser context) — JSDOM is
  // ESM-only and cannot be required from Electron's CJS main process.
  ipcMain.handle("fetch-url-content", async (_e, url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { error: "URL must start with http:// or https://" };
    }
    try {
      const result = await fetchHtml(url);
      if (!result.ok) return { error: result.error };
      return { html: result.html, finalUrl: result.finalUrl };
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle("preview-md-import", async (_e, filePath: string) => {
    try {
      const text = fs.readFileSync(filePath, "utf-8");
      const sections = splitMarkdownSections(text);
      return { sections };
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle("commit-md-import", (_e, entries: Array<Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">>) => {
    try {
      for (const fields of entries) {
        const result = addEntry(store, fields);
        store = result.store;
      }
      saveStore(userDataPath, store);
      pushStoreUpdate();
      return { success: true, imported: entries.length };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle("preview-pdf-import", async (_e, filePath: string) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const { default: pdfParse } = await import("pdf-parse");
      const data = await pdfParse(buffer, { max: 0 });
      const sections = splitPdfText(data.text);
      return { sections };
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.handle("commit-pdf-import", (_e, entries: Array<Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">>) => {
    try {
      for (const fields of entries) {
        const result = addEntry(store, fields);
        store = result.store;
      }
      saveStore(userDataPath, store);
      pushStoreUpdate();
      return { success: true, imported: entries.length };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}

app.whenReady().then(() => {
  userDataPath = app.getPath("userData");
  store = openStore(userDataPath);
  settings = loadSettings(userDataPath);
  notesData = openNotes(userDataPath);

  if (store.entries.length === 0) {
    store = applySeed(store);
    saveStore(userDataPath, store);
  }

  registerIpcHandlers();
  createTray();
  createWindow();
  registerHotkey(settings.hotkey);
  startCaptureServer();

  // One-time first-launch notification informing the user of the global hotkey.
  if (!settings.firstLaunchNotified) {
    setTimeout(() => {
      new Notification({
        title: "ShortPath is running",
        body: `Press ${settings.hotkey} to open ShortPath from any app.`,
      }).show();
      settings = { ...settings, firstLaunchNotified: true };
      saveSettings(userDataPath, settings);
    }, 3000);
  }

  // Migrate legacy single-source sync to syncSources array.
  if (settings.syncPath && !(settings.syncSources ?? []).length) {
    const legacyPath = settings.syncPath;
    const id = randomUUID();
    const label = path.basename(legacyPath, path.extname(legacyPath));
    const migrated: SyncSourceConfig = { id, path: legacyPath, label };
    settings = { ...settings, syncSources: [migrated], syncPath: undefined };
    saveSettings(userDataPath, settings);
    // Re-tag existing synced entries with this sourceId
    store = { ...store, entries: store.entries.map((e) => e.source === "synced" ? { ...e, syncSource: id } : e) };
    saveStore(userDataPath, store);
  }
  // Resume file-watch sync for all configured sources.
  for (const source of settings.syncSources ?? []) {
    if (fs.existsSync(source.path)) {
      loadSyncedFile(source.id, source.path);
      startSyncWatcher(source.id, source.path);
    }
  }

  // Auto-check for updates after renderer has had time to load (packaged builds only).
  if (app.isPackaged) {
    setTimeout(() => { autoUpdater.checkForUpdates().catch(console.error); }, 5000);
  }
});

let currentHotkey: string | null = null;

function registerHotkey(accelerator: string): boolean {
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }
  const ok = globalShortcut.register(accelerator, toggleWindow);
  if (ok) {
    currentHotkey = accelerator;
  } else {
    win?.webContents.send("hotkey-failed", accelerator);
  }
  return ok;
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopAllSyncWatchers();
  if (captureServer) { captureServer.close(); captureServer = null; }
});

// Keep the app running when all windows are closed (tray app behavior).
app.on("window-all-closed", () => {
  // intentionally empty
});
