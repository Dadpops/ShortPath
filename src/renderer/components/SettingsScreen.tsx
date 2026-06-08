import { useState, useEffect, useCallback } from "react";

interface Props {
  onClose: () => void;
  onNavigate: (mode: "import" | "split" | "add") => void;
}

type HotkeyState = "idle" | "capturing" | "saving" | "error";
type RefreshState = "idle" | "refreshing" | "done" | "error";

interface SyncStatus {
  syncPath: string | null;
  syncedCount: number;
  lastRefreshed: string | null;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function buildAccelerator(e: KeyboardEvent): string | null {
  // Ignore modifier-only keypresses.
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");

  const key = e.code.startsWith("Key")
    ? e.code.slice(3)                        // KeyA -> A
    : e.code.startsWith("Digit")
    ? e.code.slice(5)                        // Digit1 -> 1
    : e.key === " " ? "Space"
    : e.key.length === 1 ? e.key.toUpperCase()
    : e.key;                                 // F1, Tab, etc.

  if (!key) return null;
  parts.push(key);
  return parts.join("+");
}

function displayAccelerator(acc: string): string {
  return acc
    .replace("CommandOrControl", "Ctrl")
    .replace(/\+/g, " + ");
}

export default function SettingsScreen({ onClose, onNavigate }: Props) {
  const [currentHotkey, setCurrentHotkey] = useState("Loading…");
  const [hotkeyState, setHotkeyState] = useState<HotkeyState>("idle");
  const [capturedAccelerator, setCapturedAccelerator] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [positionReset, setPositionReset] = useState(false);

  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  const [exportingAll, setExportingAll] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [refreshError, setRefreshError] = useState("");
  const [clearConfirming, setClearConfirming] = useState(false);
  const [disconnectConfirming, setDisconnectConfirming] = useState(false);

  const reloadSyncStatus = useCallback(() => {
    window.shortpath.getSyncStatus().then(setSyncStatus);
  }, []);

  useEffect(() => {
    window.shortpath.getSettings().then(({ hotkey, fontSize: fs }) => {
      setCurrentHotkey(hotkey);
      setFontSize(fs);
    });
    reloadSyncStatus();
  }, [reloadSyncStatus]);

  // Keep sync status up to date when the watcher fires.
  useEffect(() => {
    return window.shortpath.onSyncRefreshed(reloadSyncStatus);
  }, [reloadSyncStatus]);

  useEffect(() => {
    if (hotkeyState !== "capturing") return;

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setHotkeyState("idle");
        setCapturedAccelerator(null);
        return;
      }
      const acc = buildAccelerator(e);
      if (acc) setCapturedAccelerator(acc);
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Escape") return;
      if (capturedAccelerator) {
        void saveHotkey(capturedAccelerator);
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [hotkeyState, capturedAccelerator]);

  async function saveHotkey(accelerator: string) {
    setHotkeyState("saving");
    const result = await window.shortpath.changeHotkey(accelerator);
    if (result.ok) {
      setCurrentHotkey(accelerator);
      setHotkeyState("idle");
      setCapturedAccelerator(null);
    } else {
      setErrorMsg(`"${displayAccelerator(accelerator)}" is already in use by another app.`);
      setHotkeyState("error");
      setCapturedAccelerator(null);
    }
  }

  async function handleResetPosition() {
    await window.shortpath.resetWindowPosition();
    setPositionReset(true);
    setTimeout(() => setPositionReset(false), 2000);
  }

  async function handleExportAll() {
    setExportingAll(true);
    await window.shortpath.exportCsv();
    setExportingAll(false);
  }

  async function handleExportMine() {
    setExportingMine(true);
    await window.shortpath.exportMine();
    setExportingMine(false);
  }

  const fontSizeMap: Record<"small" | "medium" | "large", string> = {
    small: "11px",
    medium: "13px",
    large: "15px",
  };

  function handleFontSize(size: "small" | "medium" | "large") {
    setFontSize(size);
    document.documentElement.style.setProperty("--font-size-base", fontSizeMap[size]);
    void window.shortpath.setFontSize(size);
  }

  async function handleConfigureSync() {
    const result = await window.shortpath.configureSync();
    if (result.success) reloadSyncStatus();
  }

  async function handleRefreshSynced() {
    setRefreshState("refreshing");
    setRefreshError("");
    const result = await window.shortpath.refreshSynced();
    if (result.success) {
      setRefreshState("done");
      reloadSyncStatus();
      setTimeout(() => setRefreshState("idle"), 2000);
    } else {
      setRefreshError(result.errors?.[0] ?? "Refresh failed.");
      setRefreshState("error");
    }
  }

  async function handleClearSynced() {
    if (!clearConfirming) {
      setClearConfirming(true);
      return;
    }
    await window.shortpath.clearSynced();
    setClearConfirming(false);
    reloadSyncStatus();
  }

  async function handleDisconnectSync() {
    if (!disconnectConfirming) {
      setDisconnectConfirming(true);
      return;
    }
    await window.shortpath.disconnectSync();
    setDisconnectConfirming(false);
    setClearConfirming(false);
    reloadSyncStatus();
  }

  return (
    <div className="settings-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onClose}>
          ← Back
        </button>
        <span className="form-title">Settings</span>
      </div>

      <div className="settings-body">
        <section className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="settings-row">
            <div className="settings-row-label">Text size</div>
            <div className="font-size-control">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  className={`font-size-btn${fontSize === size ? " active" : ""}`}
                  onClick={() => handleFontSize(size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Data</div>
          <div className="settings-data-grid">
            <button className="settings-data-btn" onClick={() => onNavigate("add")}>
              + Add entry
            </button>
            <button className="settings-data-btn" onClick={() => onNavigate("import")}>
              ↑ Import CSV
            </button>
            <button className="settings-data-btn" onClick={() => onNavigate("split")}>
              ✂ Paste and split
            </button>
            <button className="settings-data-btn" onClick={() => window.shortpath.downloadTemplateCsv()}>
              ↓ Download template
            </button>
            <button className="settings-data-btn" onClick={handleExportAll} disabled={exportingAll}>
              {exportingAll ? "Saving…" : "Export all"}
            </button>
            <button className="settings-data-btn" onClick={handleExportMine} disabled={exportingMine}>
              {exportingMine ? "Saving…" : "Export mine"}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Global hotkey</div>

          <div className="settings-row">
            <div className="settings-row-label">Current shortcut</div>
            <div className="settings-hotkey-display">
              {hotkeyState === "capturing"
                ? capturedAccelerator
                  ? displayAccelerator(capturedAccelerator)
                  : "Press shortcut…"
                : displayAccelerator(currentHotkey)}
            </div>
          </div>

          {hotkeyState === "idle" && (
            <button className="btn-secondary settings-action-btn" onClick={() => { setHotkeyState("capturing"); setCapturedAccelerator(null); }}>
              Change hotkey
            </button>
          )}

          {hotkeyState === "capturing" && (
            <div className="settings-capture-hint">
              Hold a key combination, then release. Press Esc to cancel.
            </div>
          )}

          {hotkeyState === "saving" && (
            <div className="settings-capture-hint">Registering…</div>
          )}

          {hotkeyState === "error" && (
            <>
              <p className="form-error">{errorMsg}</p>
              <button className="btn-secondary settings-action-btn" onClick={() => { setHotkeyState("capturing"); setErrorMsg(""); setCapturedAccelerator(null); }}>
                Try again
              </button>
            </>
          )}
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Window</div>
          <div className="settings-row">
            <div className="settings-row-label">Position and size are saved automatically.</div>
          </div>
          <button className="btn-secondary settings-action-btn" onClick={handleResetPosition}>
            {positionReset ? "Reset ✓" : "Reset to default position"}
          </button>
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Shared file sync</div>

          {syncStatus?.syncPath ? (
            <>
              <div className="settings-row settings-row-stack">
                <div className="settings-row-label">Sync file</div>
                <div className="settings-sync-path">{syncStatus.syncPath}</div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">
                  {syncStatus.syncedCount} synced {syncStatus.syncedCount === 1 ? "entry" : "entries"}
                  {syncStatus.lastRefreshed && ` · last refreshed ${formatRelativeTime(syncStatus.lastRefreshed)}`}
                </div>
              </div>
              {refreshState === "error" && <p className="form-error">{refreshError}</p>}
              <div className="settings-sync-actions">
                <button className="btn-secondary settings-action-btn" onClick={handleRefreshSynced} disabled={refreshState === "refreshing"}>
                  {refreshState === "refreshing" ? "Refreshing…" : refreshState === "done" ? "Refreshed ✓" : "Refresh now"}
                </button>
                <button className="btn-secondary settings-action-btn" onClick={handleConfigureSync}>
                  Change file
                </button>
                <button
                  className="btn-secondary settings-action-btn settings-danger-btn"
                  onClick={handleClearSynced}
                >
                  {clearConfirming ? "Confirm clear" : "Clear synced entries"}
                </button>
                <button
                  className="btn-secondary settings-action-btn settings-danger-btn"
                  onClick={handleDisconnectSync}
                >
                  {disconnectConfirming ? "Confirm disconnect" : "Disconnect sync"}
                </button>
              </div>
              {clearConfirming && (
                <p className="settings-stub-note">This removes all {syncStatus.syncedCount} synced entries but sync keeps running. Use "Disconnect sync" to stop.</p>
              )}
              {disconnectConfirming && (
                <p className="settings-stub-note">This stops the file watcher, clears the sync path, and removes all synced entries.</p>
              )}
            </>
          ) : (
            <>
              <div className="settings-row">
                <div className="settings-row-label">
                  Point to a shared CSV in Dropbox, Drive, or OneDrive. ShortPath watches it for changes and reloads automatically.
                </div>
              </div>
              <button className="btn-secondary settings-action-btn" onClick={handleConfigureSync}>
                Configure sync file
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
