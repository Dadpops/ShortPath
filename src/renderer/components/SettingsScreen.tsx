import { useState, useEffect } from "react";
import type { Entry, Vertical, SubFolder } from "@shared/types";
import { HELP_TOPICS } from "../features/help/topics";
import FolderIcon from "./FolderIcon";

interface Props {
  onClose: () => void;
  onNavigate: (mode: "import" | "split" | "add" | "export-select") => void;
  verticals: Vertical[];
  onVerticalRenamed: (id: string, newLabel: string) => void;
  onVerticalAdded: (v: Vertical) => void;
  entries: Entry[];
  verticalOrder: string[];
  onVerticalOrderChange: (order: string[]) => void;
  autoHideOnCopy: boolean;
  onAutoHideOnCopyChange: (val: boolean) => void;
  alwaysOnTop: boolean;
  onAlwaysOnTopChange: (val: boolean) => void;
  linkOpenMode: "browser" | "window";
  onLinkOpenModeChange: (val: "browser" | "window") => void;
  autoRestoreOnCompactAction: boolean;
  onAutoRestoreOnCompactActionChange: (val: boolean) => void;
  onReplayOnboarding?: () => void;
  initialSection?: SectionKey;
}

type SectionKey = "appearance" | "behavior" | "organization" | "data" | "sync";

const ACCENT_PRESETS = [
  { label: "Ocean",  value: "#2563eb" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Rose",   value: "#e11d48" },
  { label: "Amber",  value: "#d97706" },
  { label: "Teal",   value: "#0d9488" },
  { label: "Slate",  value: "#475569" },
] as const;

export default function SettingsScreen({
  onClose, onNavigate, verticals, onVerticalRenamed, onVerticalAdded,
  entries, verticalOrder, onVerticalOrderChange, autoHideOnCopy, onAutoHideOnCopyChange,
  alwaysOnTop, onAlwaysOnTopChange, linkOpenMode, onLinkOpenModeChange,
  autoRestoreOnCompactAction, onAutoRestoreOnCompactActionChange, onReplayOnboarding,
  initialSection,
}: Props) {
  const [positionReset, setPositionReset] = useState(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(100);
  const [windowSize, setWindowSize] = useState<"small" | "medium" | "large" | null>(null);
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [fontFamily, setFontFamily] = useState("system");
  const [exportingAll, setExportingAll] = useState(false);

  // Vertical management
  const [editingVerticalId, setEditingVerticalId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [addingVertical, setAddingVertical] = useState(false);
  const [newVerticalLabel, setNewVerticalLabel] = useState("");

  // Sub-folder management
  const [expandedSubFolderVerticals, setExpandedSubFolderVerticals] = useState<Set<string>>(new Set());
  const [expandedSubFolderNodes, setExpandedSubFolderNodes] = useState<Set<string>>(new Set());
  const [addingSubFolderFor, setAddingSubFolderFor] = useState<{ verticalId: string; parentSubFolderId: string | null } | null>(null);
  const [newSubFolderLabel, setNewSubFolderLabel] = useState("");
  const [editingSubFolder, setEditingSubFolder] = useState<{ verticalId: string; subFolderId: string } | null>(null);
  const [editingSubFolderLabel, setEditingSubFolderLabel] = useState("");
  const [confirmRemoveSubFolder, setConfirmRemoveSubFolder] = useState<{ verticalId: string; subFolderId: string } | null>(null);
  const [confirmDeleteVertical, setConfirmDeleteVertical] = useState<string | null>(null);

  // Data info buttons
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  // Clear entries
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Tab order drag state
  const [tabOrderDragIdx, setTabOrderDragIdx] = useState<number | null>(null);
  const [tabOrderDragOverIdx, setTabOrderDragOverIdx] = useState<number | null>(null);

  // Update check
  type UpdateCheckState = "idle" | "checking" | "up-to-date" | { version: string; url: string };
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckState>("idle");

  // Page navigation — null shows the main settings menu
  const [activePage, setActivePage] = useState<SectionKey | null>(initialSection ?? null);

  // Sync management
  type SyncSource = { id: string; path: string; label: string; syncedCount: number; lastRefreshed: string | null };
  type SyncStatus = { sources: SyncSource[] } | null;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(null);
  const [syncRefreshingId, setSyncRefreshingId] = useState<string | null>(null);
  const [syncConfiguring, setSyncConfiguring] = useState(false);
  const [renamingSourceId, setRenamingSourceId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const FONT_FAMILIES_MAP: Record<string, string> = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
    rounded: '"Trebuchet MS", "Gill Sans", Optima, sans-serif',
  };

  const [confirmRemoveSample, setConfirmRemoveSample] = useState(false);
  const [clearingSample, setClearingSample] = useState(false);

  useEffect(() => {
    window.shortpath.getSettings().then(({ fontSize: fs, theme: t, accentColor: ac, opacity: op, windowSize: ws, density: d, fontFamily: ff }) => {
      setFontSize(fs);
      setTheme(t);
      setAccentColor(ac);
      setOpacity(op);
      setWindowSize(ws);
      setDensity(d);
      setFontFamily(ff ?? "system");
    });
    window.shortpath.getSyncStatus().then(setSyncStatus);
  }, []);

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


  function handleFontFamily(key: string) {
    setFontFamily(key);
    document.documentElement.style.setProperty("--font-sans", FONT_FAMILIES_MAP[key] ?? FONT_FAMILIES_MAP.system);
    void window.shortpath.setFontFamily(key);
  }

  function handleFontSize(size: number) {
    setFontSize(size);
    document.documentElement.style.setProperty("--font-size-base", `${size}px`);
    void window.shortpath.setFontSize(size);
  }

  function handleSetTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    void window.shortpath.setTheme(t);
    // Reapply accent dim for new theme
    if (accentColor) {
      const r = parseInt(accentColor.slice(1, 3), 16);
      const g = parseInt(accentColor.slice(3, 5), 16);
      const b = parseInt(accentColor.slice(5, 7), 16);
      const alpha = t === "light" ? 0.12 : 0.15;
      document.documentElement.style.setProperty("--color-accent-dim", `rgba(${r},${g},${b},${alpha})`);
    }
  }

  function handleSetAccent(color: string) {
    setAccentColor(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const alpha = isDark ? 0.15 : 0.12;
    document.documentElement.style.setProperty("--color-accent", color);
    document.documentElement.style.setProperty("--color-accent-dim", `rgba(${r},${g},${b},${alpha})`);
    void window.shortpath.setAccent(color);
  }

  function handleOpacityChange(value: number) {
    setOpacity(value);
    void window.shortpath.setOpacity(value);
  }

  function handleWindowSize(size: "small" | "medium" | "large") {
    setWindowSize(size);
    void window.shortpath.setWindowSize(size);
  }

  function handleDensity(d: "compact" | "comfortable") {
    setDensity(d);
    document.body.setAttribute("data-density", d === "compact" ? "compact" : "");
    void window.shortpath.setDensity(d);
  }

  function startEditVertical(v: Vertical) {
    setEditingVerticalId(v.id);
    setEditingLabel(v.label);
  }

  function saveEditVertical() {
    if (!editingVerticalId || !editingLabel.trim()) return;
    const trimmed = editingLabel.trim();
    void window.shortpath.renameVertical(editingVerticalId, trimmed);
    onVerticalRenamed(editingVerticalId, trimmed);
    setEditingVerticalId(null);
  }

  async function handleAddVertical() {
    const trimmed = newVerticalLabel.trim();
    if (!trimmed) return;
    const vertical = await window.shortpath.addVertical(trimmed);
    onVerticalAdded(vertical);
    setNewVerticalLabel("");
    setAddingVertical(false);
  }

  function toggleSubFolderExpand(verticalId: string) {
    setExpandedSubFolderVerticals((prev) => {
      const next = new Set(prev);
      next.has(verticalId) ? next.delete(verticalId) : next.add(verticalId);
      return next;
    });
  }

  function toggleSubFolderNode(id: string) {
    setExpandedSubFolderNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAddSubFolder() {
    if (!addingSubFolderFor || !newSubFolderLabel.trim()) return;
    await window.shortpath.addSubFolder(
      addingSubFolderFor.verticalId,
      newSubFolderLabel.trim(),
      addingSubFolderFor.parentSubFolderId ?? undefined
    );
    if (addingSubFolderFor.parentSubFolderId) {
      setExpandedSubFolderNodes((prev) => new Set(prev).add(addingSubFolderFor!.parentSubFolderId!));
    }
    setNewSubFolderLabel("");
    setAddingSubFolderFor(null);
  }

  async function handleDeleteVertical(verticalId: string) {
    await window.shortpath.deleteVertical(verticalId);
    onVerticalOrderChange(verticalOrder.filter((id) => id !== verticalId));
    setConfirmDeleteVertical(null);
  }

  async function handleSaveSubFolderRename() {
    if (!editingSubFolder || !editingSubFolderLabel.trim()) return;
    await window.shortpath.renameSubFolder(
      editingSubFolder.verticalId,
      editingSubFolder.subFolderId,
      editingSubFolderLabel.trim()
    );
    setEditingSubFolder(null);
    setEditingSubFolderLabel("");
  }

  async function handleRemoveSubFolder() {
    if (!confirmRemoveSubFolder) return;
    await window.shortpath.removeSubFolder(
      confirmRemoveSubFolder.verticalId,
      confirmRemoveSubFolder.subFolderId
    );
    setConfirmRemoveSubFolder(null);
  }

  async function handleCheckForUpdates() {
    setUpdateCheck("checking");
    const result = await window.shortpath.checkForUpdates();
    if (result) {
      setUpdateCheck(result);
    } else {
      setUpdateCheck("up-to-date");
      setTimeout(() => setUpdateCheck("idle"), 3000);
    }
  }

  async function handleClearEntries() {
    setClearing(true);
    await window.shortpath.clearLocalEntries();
    setClearing(false);
    setConfirmClear(false);
  }

  function toggleInfo(topicId: string) {
    setActiveInfoId((prev) => (prev === topicId ? null : topicId));
  }

  const activeInfoTopic = activeInfoId ? HELP_TOPICS.find((t) => t.id === activeInfoId) : null;

  // Tab order — compute ordered verticals list for drag-and-drop
  const orderedTabVerticals: Vertical[] = verticalOrder.length > 0
    ? [
        ...verticalOrder.map(id => verticals.find(v => v.id === id)).filter(Boolean) as Vertical[],
        ...verticals.filter(v => !verticalOrder.includes(v.id)),
      ]
    : [...verticals];

  function entryCountForVertical(verticalId: string): number {
    return entries.filter(e => e.vertical === verticalId).length;
  }

  function handleTabOrderDragStart(e: React.DragEvent, idx: number) {
    setTabOrderDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleTabOrderDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setTabOrderDragOverIdx(idx);
  }

  function handleTabOrderDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (tabOrderDragIdx === null || tabOrderDragIdx === idx) {
      setTabOrderDragIdx(null);
      setTabOrderDragOverIdx(null);
      return;
    }
    const newOrder = [...orderedTabVerticals];
    const [moved] = newOrder.splice(tabOrderDragIdx, 1);
    newOrder.splice(idx, 0, moved);
    onVerticalOrderChange(newOrder.map(v => v.id));
    setTabOrderDragIdx(null);
    setTabOrderDragOverIdx(null);
  }

  function handleTabOrderDragEnd() {
    setTabOrderDragIdx(null);
    setTabOrderDragOverIdx(null);
  }

  const sectionTitles: Record<SectionKey, string> = {
    appearance: "Appearance",
    behavior: "Behavior",
    organization: "Organization",
    sync: "Sync",
    data: "Data",
  };

  async function handleConfigureSync() {
    setSyncConfiguring(true);
    const result = await window.shortpath.configureSync();
    if (result.success) {
      const status = await window.shortpath.getSyncStatus();
      setSyncStatus(status);
    }
    setSyncConfiguring(false);
  }

  async function handleRefreshSync(sourceId: string) {
    setSyncRefreshingId(sourceId);
    await window.shortpath.refreshSynced(sourceId);
    const status = await window.shortpath.getSyncStatus();
    setSyncStatus(status);
    setSyncRefreshingId(null);
  }

  async function handleDisconnectSync(sourceId: string) {
    await window.shortpath.disconnectSync(sourceId);
    const status = await window.shortpath.getSyncStatus();
    setSyncStatus(status);
  }

  const dataActions: Array<{ label: string; topicId: string; onClick: () => void; disabled?: boolean }> = [
    { label: "+ Add entry", topicId: "adding-entries", onClick: () => onNavigate("add") },
    { label: "↑ Import CSV", topicId: "importing-csv", onClick: () => onNavigate("import") },
    { label: "✂ Paste and split", topicId: "adding-entries", onClick: () => onNavigate("split") },
    { label: "↓ Download template", topicId: "importing-csv", onClick: () => window.shortpath.downloadTemplateCsv() },
    { label: exportingAll ? "Saving…" : "Export all", topicId: "exporting-csv", onClick: handleExportAll, disabled: exportingAll },
    { label: "Export selected", topicId: "exporting-csv", onClick: () => onNavigate("export-select") },
  ];

  // Settings main menu
  if (!activePage) {
    const syncSources = syncStatus?.sources ?? [];
    return (
      <div className="settings-shell">
        <div className="form-header">
          <button className="form-back-btn" onClick={onClose}>← Back</button>
          <span className="form-title">Settings</span>
        </div>
        <div className="settings-nav-list">
          {(["appearance", "behavior", "organization", "sync", "data"] as SectionKey[]).map((key) => (
            <button key={key} className="settings-nav-item" onClick={() => setActivePage(key)}>
              <span className="settings-nav-label">{sectionTitles[key]}</span>
              {key === "sync" && syncSources.length > 0 && (
                <span className="settings-nav-badge">{syncSources.length} source{syncSources.length !== 1 ? "s" : ""}</span>
              )}
              <span className="settings-nav-chevron">›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={() => setActivePage(null)}>← Settings</button>
        <span className="form-title">{sectionTitles[activePage]}</span>
      </div>

      <div className="settings-body">
        {/* ── Appearance ────────────────────────────────────────── */}
        {activePage === "appearance" && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Text size</div>
                <div className="font-size-slider-wrap">
                  <span className="font-size-label-sm">A</span>
                  <input type="range" min={11} max={16} step={1} value={fontSize}
                    onChange={(e) => handleFontSize(Number(e.target.value))} className="font-size-slider" />
                  <span className="font-size-label-lg">A</span>
                  <span className="font-size-current">{fontSize}px</span>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Theme</div>
                <div className="font-size-control">
                  {(["dark", "light"] as const).map((t) => (
                    <button key={t} className={`font-size-btn${theme === t ? " active" : ""}`}
                      onClick={() => handleSetTheme(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Accent color</div>
                <div className="accent-swatches">
                  {ACCENT_PRESETS.map((preset) => {
                    const isActive = accentColor === preset.value;
                    return (
                      <button
                        key={preset.value}
                        className={`accent-swatch${isActive ? " active" : ""}`}
                        style={{
                          backgroundColor: preset.value,
                          outline: isActive ? `2px solid ${preset.value}` : "none",
                          outlineOffset: isActive ? "3px" : undefined,
                        }}
                        title={preset.label}
                        onClick={() => handleSetAccent(preset.value)}
                        aria-label={preset.label}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <div className="settings-row" style={{ width: "100%", gap: 12 }}>
                  <div className="settings-row-label">Opacity</div>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", minWidth: 30, textAlign: "right" }}>{opacity}%</span>
                  <input
                    type="range" min={70} max={100} step={1} value={opacity}
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                    className="font-size-slider"
                    style={{ width: 110 }}
                  />
                </div>
                <p className="settings-row-note">Useful if you keep ShortPath open alongside your helpdesk.</p>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Window size</div>
                <div className="font-size-control">
                  {(["small", "medium", "large"] as const).map((s) => (
                    <button
                      key={s}
                      className={`font-size-btn${windowSize === s ? " active" : ""}`}
                      onClick={() => handleWindowSize(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Density</div>
                <div className="font-size-control">
                  {(["comfortable", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      className={`font-size-btn${density === d ? " active" : ""}`}
                      onClick={() => handleDensity(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Font family</div>
                <div className="font-size-control">
                  {(["system", "serif", "mono", "rounded"] as const).map((key) => (
                    <button
                      key={key}
                      className={`font-size-btn${fontFamily === key ? " active" : ""}`}
                      onClick={() => handleFontFamily(key)}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* ── Behavior ──────────────────────────────────────────── */}
        {activePage === "behavior" && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Hide window after copying</div>
                <div className="font-size-control">
                  {([false, true] as const).map((val) => (
                    <button
                      key={String(val)}
                      className={`font-size-btn${autoHideOnCopy === val ? " active" : ""}`}
                      onClick={() => onAutoHideOnCopyChange(val)}
                    >
                      {val ? "On" : "Off"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-label">Keep window on top</div>
                <div className="font-size-control">
                  {([false, true] as const).map((val) => (
                    <button
                      key={String(val)}
                      className={`font-size-btn${alwaysOnTop === val ? " active" : ""}`}
                      onClick={() => onAlwaysOnTopChange(val)}
                    >
                      {val ? "On" : "Off"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-label">Open links in</div>
                <div className="font-size-control">
                  {(["browser", "window"] as const).map((val) => (
                    <button
                      key={val}
                      className={`font-size-btn${linkOpenMode === val ? " active" : ""}`}
                      onClick={() => onLinkOpenModeChange(val)}
                    >
                      {val === "browser" ? "New tab" : "New window"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-label">Auto-restore window after action in compact mode</div>
                <div className="font-size-control">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      className={`font-size-btn${autoRestoreOnCompactAction === val ? " active" : ""}`}
                      onClick={() => onAutoRestoreOnCompactActionChange(val)}
                    >
                      {val ? "On" : "Off"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="settings-row-note">
                Keyboard shortcuts (including the global summon hotkey) are managed in the Keyboard shortcuts panel.
              </p>
              <button className="btn-secondary settings-action-btn" onClick={() => { onClose(); }}>
                Open keyboard shortcuts (Alt+K)
              </button>

              {onReplayOnboarding && (
                <>
                  <div className="settings-row" style={{ marginTop: 8 }}>
                    <div className="settings-row-label">Onboarding</div>
                  </div>
                  <button className="btn-secondary settings-action-btn" onClick={onReplayOnboarding}>
                    Replay onboarding walkthrough
                  </button>
                </>
              )}

              <div className="settings-row" style={{ marginTop: 8 }}>
                <div className="settings-row-label">Position and size are saved automatically.</div>
              </div>
              <button className="btn-secondary settings-action-btn" onClick={handleResetPosition}>
                {positionReset ? "Reset ✓" : "Reset to default position"}
              </button>

              <div className="settings-row" style={{ marginTop: 8 }}>
                <div className="settings-row-label">Updates</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="btn-secondary settings-action-btn"
                    onClick={() => void handleCheckForUpdates()}
                    disabled={updateCheck === "checking"}
                  >
                    {updateCheck === "checking" ? "Checking…" : "Check for updates"}
                  </button>
                  {updateCheck === "up-to-date" && (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Up to date</span>
                  )}
                  {typeof updateCheck === "object" && (
                    <button
                      className="update-banner-link"
                      onClick={() => void window.shortpath.openExternal(updateCheck.url)}
                    >
                      v{updateCheck.version} available — Download
                    </button>
                  )}
                </div>
              </div>
              <p className="settings-row-note" style={{ marginTop: 2 }}>
                Checks GitHub for a newer release. If a newer version is found, a download link appears. After downloading, restart the app to install.
              </p>

              <p className="settings-row-note" style={{ marginTop: 8 }}>
                To customize in-app keyboard shortcuts, open the Keyboard shortcuts panel (Alt+K).
              </p>
            </div>
          )}

        {/* ── Organization ──────────────────────────────────────── */}
        {activePage === "organization" && (
            <div className="settings-section-body">
              <div className="settings-group-label">Tab order</div>
              <div className="tab-order-list">
                {orderedTabVerticals.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`tab-order-row${tabOrderDragOverIdx === idx ? " drag-over" : ""}`}
                    draggable
                    onDragStart={(e) => handleTabOrderDragStart(e, idx)}
                    onDragOver={(e) => handleTabOrderDragOver(e, idx)}
                    onDrop={(e) => handleTabOrderDrop(e, idx)}
                    onDragEnd={handleTabOrderDragEnd}
                  >
                    <span className="drag-handle" title="Drag to reorder">⠿</span>
                    <span className="tab-order-name">{v.label}</span>
                    <span className="tab-order-count">{entryCountForVertical(v.id)}</span>
                  </div>
                ))}
              </div>

              <div className="settings-group-label" style={{ marginTop: 12 }}>Verticals</div>
              {verticals.map((v) => {
                function renderSubFolderNode(sf: SubFolder, depth: number): React.ReactNode {
                  const isEditingSf = editingSubFolder?.verticalId === v.id && editingSubFolder.subFolderId === sf.id;
                  const isConfirmRemove = confirmRemoveSubFolder?.verticalId === v.id && confirmRemoveSubFolder.subFolderId === sf.id;
                  const isAddingUnder = addingSubFolderFor?.verticalId === v.id && addingSubFolderFor.parentSubFolderId === sf.id;
                  const nodeExpanded = expandedSubFolderNodes.has(sf.id);
                  const hasChildren = (sf.subFolders?.length ?? 0) > 0;

                  return (
                    <div key={sf.id} style={{ paddingLeft: depth * 16 }}>
                      <div className="settings-subfolder-row">
                        {hasChildren && (
                          <button
                            className="subfolder-tree-toggle"
                            onClick={() => toggleSubFolderNode(sf.id)}
                            tabIndex={-1}
                          >
                            <span className={`subfolder-chevron${nodeExpanded ? " expanded" : ""}`}>›</span>
                          </button>
                        )}
                        {isEditingSf ? (
                          <>
                            <input
                              className="form-input settings-vertical-input"
                              value={editingSubFolderLabel}
                              onChange={(e) => setEditingSubFolderLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void handleSaveSubFolderRename();
                                if (e.key === "Escape") setEditingSubFolder(null);
                              }}
                              autoFocus
                            />
                            <button className="btn-primary settings-action-btn" onClick={() => void handleSaveSubFolderRename()}>Save</button>
                            <button className="btn-secondary settings-action-btn" onClick={() => setEditingSubFolder(null)}>Cancel</button>
                          </>
                        ) : isConfirmRemove ? (
                          <>
                            <span className="settings-subfolder-label">Delete "{sf.label}"?</span>
                            <button className="btn-danger settings-action-btn" onClick={() => void handleRemoveSubFolder()}>Delete</button>
                            <button className="btn-secondary settings-action-btn" onClick={() => setConfirmRemoveSubFolder(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <FolderIcon size={13} />
                            <span className="settings-subfolder-label">{sf.label}</span>
                            <button className="btn-secondary settings-action-btn" onClick={() => { setEditingSubFolder({ verticalId: v.id, subFolderId: sf.id }); setEditingSubFolderLabel(sf.label); }}>Rename</button>
                            <button className="btn-secondary settings-action-btn" onClick={() => { setAddingSubFolderFor({ verticalId: v.id, parentSubFolderId: sf.id }); setNewSubFolderLabel(""); toggleSubFolderNode(sf.id); }} title="Add nested sub-folder">+ Nest</button>
                            <button className="settings-danger-btn settings-action-btn btn-secondary" onClick={() => setConfirmRemoveSubFolder({ verticalId: v.id, subFolderId: sf.id })}>Remove</button>
                          </>
                        )}
                      </div>
                      {(nodeExpanded || isAddingUnder) && (
                        <div>
                          {(sf.subFolders ?? []).map((child) => renderSubFolderNode(child, depth + 1))}
                          {isAddingUnder && (
                            <div className="settings-subfolder-row" style={{ paddingLeft: 16 }}>
                              <input
                                className="form-input settings-vertical-input"
                                placeholder="Sub-folder name"
                                value={newSubFolderLabel}
                                onChange={(e) => setNewSubFolderLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void handleAddSubFolder();
                                  if (e.key === "Escape") { setAddingSubFolderFor(null); setNewSubFolderLabel(""); }
                                }}
                                autoFocus
                              />
                              <button className="btn-primary settings-action-btn" onClick={() => void handleAddSubFolder()} disabled={!newSubFolderLabel.trim()}>Add</button>
                              <button className="btn-secondary settings-action-btn" onClick={() => { setAddingSubFolderFor(null); setNewSubFolderLabel(""); }}>Cancel</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={v.id} className="settings-vertical-block">
                    <div className="settings-vertical-row">
                      {editingVerticalId === v.id ? (
                        <>
                          <input
                            className="form-input settings-vertical-input"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditVertical();
                              if (e.key === "Escape") setEditingVerticalId(null);
                            }}
                            autoFocus
                          />
                          <button className="btn-primary settings-action-btn" onClick={saveEditVertical}>Save</button>
                          <button className="btn-secondary settings-action-btn" onClick={() => setEditingVerticalId(null)}>Cancel</button>
                        </>
                      ) : confirmDeleteVertical === v.id ? (
                        <>
                          <span className="settings-vertical-label">Delete "{v.label}"?</span>
                          <span className="settings-row-note" style={{ marginLeft: 4 }}>({entryCountForVertical(v.id)} entries)</span>
                          <button className="btn-danger settings-action-btn" onClick={() => void handleDeleteVertical(v.id)}>Delete</button>
                          <button className="btn-secondary settings-action-btn" onClick={() => setConfirmDeleteVertical(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="settings-vertical-label">{v.label}</span>
                          <button className="btn-secondary settings-action-btn" onClick={() => startEditVertical(v)}>Rename</button>
                          <button
                            className={`btn-secondary settings-action-btn${expandedSubFolderVerticals.has(v.id) ? " active" : ""}`}
                            onClick={() => toggleSubFolderExpand(v.id)}
                            title="Manage sub-folders"
                          >
                            <FolderIcon size={12} /> {(v.subFolders?.length ?? 0) > 0 ? v.subFolders!.length : "+"}
                          </button>
                          <button className="settings-danger-btn settings-action-btn btn-secondary" onClick={() => setConfirmDeleteVertical(v.id)}>Delete</button>
                        </>
                      )}
                    </div>

                    {expandedSubFolderVerticals.has(v.id) && (
                      <div className="settings-subfolders">
                        {(v.subFolders ?? []).map((sf) => renderSubFolderNode(sf, 0))}

                        {addingSubFolderFor?.verticalId === v.id && addingSubFolderFor.parentSubFolderId === null ? (
                          <div className="settings-subfolder-row">
                            <input
                              className="form-input settings-vertical-input"
                              placeholder="Sub-folder name"
                              value={newSubFolderLabel}
                              onChange={(e) => setNewSubFolderLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void handleAddSubFolder();
                                if (e.key === "Escape") { setAddingSubFolderFor(null); setNewSubFolderLabel(""); }
                              }}
                              autoFocus
                            />
                            <button className="btn-primary settings-action-btn" onClick={() => void handleAddSubFolder()} disabled={!newSubFolderLabel.trim()}>Add</button>
                            <button className="btn-secondary settings-action-btn" onClick={() => { setAddingSubFolderFor(null); setNewSubFolderLabel(""); }}>Cancel</button>
                          </div>
                        ) : (
                          <button className="settings-add-subfolder-btn" onClick={() => { setAddingSubFolderFor({ verticalId: v.id, parentSubFolderId: null }); setNewSubFolderLabel(""); }}>
                            + Add sub-folder
                          </button>
                        )}
                        <button
                          className="btn-secondary settings-action-btn"
                          onClick={() => toggleSubFolderExpand(v.id)}
                          style={{ alignSelf: "flex-start", marginTop: 6 }}
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingVertical ? (
                <div className="settings-vertical-row">
                  <input
                    className="form-input settings-vertical-input"
                    placeholder="New vertical name"
                    value={newVerticalLabel}
                    onChange={(e) => setNewVerticalLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddVertical();
                      if (e.key === "Escape") { setAddingVertical(false); setNewVerticalLabel(""); }
                    }}
                    autoFocus
                  />
                  <button className="btn-primary settings-action-btn" onClick={() => void handleAddVertical()} disabled={!newVerticalLabel.trim()}>Add</button>
                  <button className="btn-secondary settings-action-btn" onClick={() => { setAddingVertical(false); setNewVerticalLabel(""); }}>Cancel</button>
                </div>
              ) : (
                <button className="btn-secondary settings-action-btn" onClick={() => setAddingVertical(true)} style={{ alignSelf: "flex-start" }}>
                  + Add vertical
                </button>
              )}

              {verticals.length === 0 && !addingVertical && (
                <p className="settings-stub-note">No verticals yet.</p>
              )}
            </div>
          )}

        {/* ── Sync ──────────────────────────────────────────────── */}
        {activePage === "sync" && (
            <div className="settings-section-body">
              <div className="sync-setup-box">
                <div className="sync-setup-title">How sync works</div>
                <p className="sync-setup-text">
                  ShortPath watches a CSV file on your machine. When the file changes, entries update automatically. The easiest way to share entries with your team is to put the CSV inside a cloud-synced folder.
                </p>
                <div className="sync-setup-steps">
                  <div className="sync-setup-step">
                    <span className="sync-setup-step-num">1</span>
                    <div>
                      <strong>Install desktop sync</strong>
                      <p className="sync-setup-step-note">
                        Download Google Drive for Desktop, Dropbox, or OneDrive. Sign in and let it sync a local folder on your machine.
                      </p>
                    </div>
                  </div>
                  <div className="sync-setup-step">
                    <span className="sync-setup-step-num">2</span>
                    <div>
                      <strong>Put your CSV in that folder</strong>
                      <p className="sync-setup-step-note">
                        Create or upload a ShortPath CSV into your synced folder. In Google Drive: open drive.google.com, upload the file, then find it in your local Google Drive folder.
                      </p>
                    </div>
                  </div>
                  <div className="sync-setup-step">
                    <span className="sync-setup-step-num">3</span>
                    <div>
                      <strong>Connect ShortPath to the file</strong>
                      <p className="sync-setup-step-note">
                        Click "Add sync source" below and select the CSV. ShortPath will watch it for changes.
                      </p>
                    </div>
                  </div>
                  <div className="sync-setup-step">
                    <span className="sync-setup-step-num">4</span>
                    <div>
                      <strong>Keep the CSV updated</strong>
                      <p className="sync-setup-step-note">
                        Teammates edit the file in Google Sheets or Excel, save it as CSV, and ShortPath picks up the changes automatically when the file syncs to your machine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {syncStatus === null ? (
                <p className="settings-stub-note">Loading…</p>
              ) : (
                <>
                  {(syncStatus.sources ?? []).length > 0 && (
                    <div className="sync-sources-list">
                      <div className="sync-sources-label">Connected sources</div>
                      {syncStatus.sources.map((src) => (
                        <div key={src.id} className="sync-source-card">
                          <div className="sync-source-path" title={src.path}>
                            {renamingSourceId === src.id ? (
                              <>
                                <input
                                  className="form-input settings-vertical-input"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      void window.shortpath.renameSyncSource(src.id, renameValue.trim() || src.path).then(() => {
                                        setSyncStatus((prev) => prev ? {
                                          ...prev,
                                          sources: prev.sources.map((s) => s.id === src.id ? { ...s, label: renameValue.trim() } : s),
                                        } : prev);
                                        setRenamingSourceId(null);
                                      });
                                    }
                                    if (e.key === "Escape") setRenamingSourceId(null);
                                  }}
                                  autoFocus
                                />
                                <button
                                  className="btn-primary settings-action-btn"
                                  onClick={() => {
                                    void window.shortpath.renameSyncSource(src.id, renameValue.trim() || src.path).then(() => {
                                      setSyncStatus((prev) => prev ? {
                                        ...prev,
                                        sources: prev.sources.map((s) => s.id === src.id ? { ...s, label: renameValue.trim() } : s),
                                      } : prev);
                                      setRenamingSourceId(null);
                                    });
                                  }}
                                >Save</button>
                                <button className="btn-secondary settings-action-btn" onClick={() => setRenamingSourceId(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <strong>{src.label || src.path.split(/[/\\]/).pop()}</strong>
                                {src.label && <span className="sync-source-path-hint" title={src.path}>{src.path.split(/[/\\]/).pop()}</span>}
                              </>
                            )}
                          </div>
                          <div className="sync-source-meta">
                            <span>{src.syncedCount} entries</span>
                            {src.lastRefreshed && (
                              <span>Last refreshed {new Date(src.lastRefreshed).toLocaleTimeString()}</span>
                            )}
                          </div>
                          <div className="sync-source-actions">
                            {renamingSourceId !== src.id && (
                              <button
                                className="btn-secondary settings-action-btn"
                                onClick={() => { setRenamingSourceId(src.id); setRenameValue(src.label || ""); }}
                              >
                                Rename
                              </button>
                            )}
                            <button
                              className="btn-secondary settings-action-btn"
                              onClick={() => void handleRefreshSync(src.id)}
                              disabled={syncRefreshingId === src.id}
                            >
                              {syncRefreshingId === src.id ? "Refreshing…" : "Refresh"}
                            </button>
                            <button
                              className="settings-danger-btn settings-action-btn btn-secondary"
                              onClick={() => void handleDisconnectSync(src.id)}
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn-secondary settings-action-btn"
                    onClick={() => void handleConfigureSync()}
                    disabled={syncConfiguring}
                    style={{ marginTop: 8 }}
                  >
                    {syncConfiguring ? "Choosing file…" : "+ Add sync source"}
                  </button>
                </>
              )}
            </div>
          )}

        {/* ── Data ──────────────────────────────────────────────── */}
        {activePage === "data" && (
            <div className="settings-section-body">
              <div className="settings-data-grid">
                {dataActions.map((action) => (
                  <div key={action.label} className="settings-data-cell">
                    <button className="settings-data-btn" onClick={action.onClick} disabled={action.disabled}>
                      {action.label}
                    </button>
                    <button
                      className={`settings-info-btn${activeInfoId === action.topicId ? " active" : ""}`}
                      onClick={() => toggleInfo(action.topicId)}
                      title="What does this do?"
                    >
                      ⓘ
                    </button>
                  </div>
                ))}
              </div>
              {activeInfoTopic && (
                <div className="settings-info-popup">
                  <div className="settings-info-popup-title">{activeInfoTopic.title}</div>
                  <button className="settings-info-popup-close" onClick={() => setActiveInfoId(null)} aria-label="Close">✕</button>
                  <div className="settings-info-popup-body">{activeInfoTopic.content}</div>
                </div>
              )}

              <div className="settings-danger-zone">
                {(() => {
                  const sampleCount = entries.filter((e) => e.source === "sample").length;
                  if (sampleCount === 0) return null;
                  return confirmRemoveSample ? (
                    <div className="settings-danger-confirm">
                      <p className="settings-danger-warning">
                        Remove all {sampleCount} sample {sampleCount === 1 ? "entry" : "entries"}? This cannot be undone.
                      </p>
                      <div className="settings-danger-actions">
                        <button
                          className="btn-danger-lg"
                          disabled={clearingSample}
                          onClick={async () => {
                            setClearingSample(true);
                            await window.shortpath.clearSampleData();
                            setClearingSample(false);
                            setConfirmRemoveSample(false);
                          }}
                        >
                          {clearingSample ? "Removing…" : "Remove sample data"}
                        </button>
                        <button className="btn-secondary settings-action-btn" onClick={() => setConfirmRemoveSample(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-danger-outline" onClick={() => setConfirmRemoveSample(true)}>
                      Remove sample data ({sampleCount} {sampleCount === 1 ? "entry" : "entries"})
                    </button>
                  );
                })()}
                {confirmClear ? (
                  <div className="settings-danger-confirm">
                    <p className="settings-danger-warning">
                      ⚠ This will permanently delete all your local entries. Synced entries are not affected. This cannot be undone.
                    </p>
                    <div className="settings-danger-actions">
                      <button className="btn-danger-lg" onClick={handleClearEntries} disabled={clearing}>
                        {clearing ? "Clearing…" : "Yes, delete all entries"}
                      </button>
                      <button className="btn-secondary settings-action-btn" onClick={() => setConfirmClear(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-danger-outline" onClick={() => setConfirmClear(true)}>
                    Clear all entries
                  </button>
                )}
              </div>
            </div>
          )}

      </div>
    </div>
  );
}
