import { useState, useEffect } from "react";
import type { Vertical } from "@shared/types";
import { HELP_TOPICS } from "../features/help/topics";

interface Props {
  onClose: () => void;
  onNavigate: (mode: "import" | "split" | "add") => void;
  verticals: Vertical[];
  onVerticalRenamed: (id: string, newLabel: string) => void;
  onVerticalAdded: (v: Vertical) => void;
}

type HotkeyState = "idle" | "capturing" | "saving" | "error";
type SectionKey = "appearance" | "data" | "hotkey" | "window" | "verticals";

function buildAccelerator(e: KeyboardEvent): string | null {
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  const key = e.code.startsWith("Key")
    ? e.code.slice(3)
    : e.code.startsWith("Digit")
    ? e.code.slice(5)
    : e.key === " " ? "Space"
    : e.key.length === 1 ? e.key.toUpperCase()
    : e.key;
  if (!key) return null;
  parts.push(key);
  return parts.join("+");
}

function displayAccelerator(acc: string): string {
  return acc.replace("CommandOrControl", "Ctrl").replace(/\+/g, " + ");
}

export default function SettingsScreen({ onClose, onNavigate, verticals, onVerticalRenamed, onVerticalAdded }: Props) {
  const [currentHotkey, setCurrentHotkey] = useState("Loading…");
  const [hotkeyState, setHotkeyState] = useState<HotkeyState>("idle");
  const [capturedAccelerator, setCapturedAccelerator] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [positionReset, setPositionReset] = useState(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);

  // Vertical management
  const [editingVerticalId, setEditingVerticalId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [addingVertical, setAddingVertical] = useState(false);
  const [newVerticalLabel, setNewVerticalLabel] = useState("");

  // Sub-folder management
  const [expandedSubFolderVerticals, setExpandedSubFolderVerticals] = useState<Set<string>>(new Set());
  const [addingSubFolderFor, setAddingSubFolderFor] = useState<string | null>(null);
  const [newSubFolderLabel, setNewSubFolderLabel] = useState("");
  const [editingSubFolder, setEditingSubFolder] = useState<{ verticalId: string; subFolderId: string } | null>(null);
  const [editingSubFolderLabel, setEditingSubFolderLabel] = useState("");
  const [confirmRemoveSubFolder, setConfirmRemoveSubFolder] = useState<{ verticalId: string; subFolderId: string } | null>(null);

  // Data info buttons
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  // Clear entries
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [expanded, setExpanded] = useState<Set<SectionKey>>(
    new Set(["appearance", "data", "hotkey", "window", "verticals"])
  );

  function toggleSection(key: SectionKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  useEffect(() => {
    window.shortpath.getSettings().then(({ hotkey, fontSize: fs, theme: t }) => {
      setCurrentHotkey(hotkey);
      setFontSize(fs);
      setTheme(t);
    });
  }, []);

  useEffect(() => {
    if (hotkeyState !== "capturing") return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setHotkeyState("idle"); setCapturedAccelerator(null); return; }
      const acc = buildAccelerator(e);
      if (acc) setCapturedAccelerator(acc);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Escape") return;
      if (capturedAccelerator) void saveHotkey(capturedAccelerator);
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

  function handleFontSize(size: number) {
    setFontSize(size);
    document.documentElement.style.setProperty("--font-size-base", `${size}px`);
    void window.shortpath.setFontSize(size);
  }

  function handleSetTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    void window.shortpath.setTheme(t);
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

  async function handleAddSubFolder() {
    if (!addingSubFolderFor || !newSubFolderLabel.trim()) return;
    await window.shortpath.addSubFolder(addingSubFolderFor, newSubFolderLabel.trim());
    setNewSubFolderLabel("");
    setAddingSubFolderFor(null);
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

  function SectionHeader({ title, sectionKey }: { title: string; sectionKey: SectionKey }) {
    return (
      <button className="settings-section-header" onClick={() => toggleSection(sectionKey)}>
        <span className="settings-section-title">{title}</span>
        <span className={`settings-chevron${expanded.has(sectionKey) ? " expanded" : ""}`}>›</span>
      </button>
    );
  }

  const dataActions: Array<{ label: string; topicId: string; onClick: () => void; disabled?: boolean }> = [
    { label: "+ Add entry", topicId: "adding-entries", onClick: () => onNavigate("add") },
    { label: "↑ Import CSV", topicId: "importing-csv", onClick: () => onNavigate("import") },
    { label: "✂ Paste and split", topicId: "adding-entries", onClick: () => onNavigate("split") },
    { label: "↓ Download template", topicId: "importing-csv", onClick: () => window.shortpath.downloadTemplateCsv() },
    { label: exportingAll ? "Saving…" : "Export all", topicId: "exporting-csv", onClick: handleExportAll, disabled: exportingAll },
    { label: exportingMine ? "Saving…" : "Export mine", topicId: "exporting-csv", onClick: handleExportMine, disabled: exportingMine },
  ];

  return (
    <div className="settings-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onClose}>← Back</button>
        <span className="form-title">Settings</span>
      </div>

      <div className="settings-body">

        <section className="settings-section">
          <SectionHeader title="Appearance" sectionKey="appearance" />
          {expanded.has("appearance") && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Text size</div>
                <div className="font-size-slider-wrap">
                  <span className="font-size-label-sm">A</span>
                  <input type="range" min={11} max={16} step={1} value={fontSize}
                    onChange={(e) => handleFontSize(Number(e.target.value))} className="font-size-slider" />
                  <span className="font-size-label-lg">A</span>
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
            </div>
          )}
        </section>

        <section className="settings-section">
          <SectionHeader title="Data" sectionKey="data" />
          {expanded.has("data") && (
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
        </section>

        <section className="settings-section">
          <SectionHeader title="Verticals" sectionKey="verticals" />
          {expanded.has("verticals") && (
            <div className="settings-section-body">
              {verticals.map((v) => (
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
                    ) : (
                      <>
                        <span className="settings-vertical-label">{v.label}</span>
                        <button className="btn-secondary settings-action-btn" onClick={() => startEditVertical(v)}>Rename</button>
                        <button
                          className={`btn-secondary settings-action-btn${expandedSubFolderVerticals.has(v.id) ? " active" : ""}`}
                          onClick={() => toggleSubFolderExpand(v.id)}
                          title="Manage sub-folders"
                        >
                          📁 {(v.subFolders?.length ?? 0) > 0 ? v.subFolders!.length : "+"}
                        </button>
                      </>
                    )}
                  </div>

                  {expandedSubFolderVerticals.has(v.id) && (
                    <div className="settings-subfolders">
                      {(v.subFolders ?? []).map((sf) => (
                        <div key={sf.id} className="settings-subfolder-row">
                          {editingSubFolder?.verticalId === v.id && editingSubFolder.subFolderId === sf.id ? (
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
                          ) : confirmRemoveSubFolder?.verticalId === v.id && confirmRemoveSubFolder.subFolderId === sf.id ? (
                            <>
                              <span className="settings-subfolder-label">Delete "{sf.label}"?</span>
                              <button className="btn-danger settings-action-btn" onClick={() => void handleRemoveSubFolder()}>Delete</button>
                              <button className="btn-secondary settings-action-btn" onClick={() => setConfirmRemoveSubFolder(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <span className="settings-subfolder-icon">📁</span>
                              <span className="settings-subfolder-label">{sf.label}</span>
                              <button className="btn-secondary settings-action-btn" onClick={() => { setEditingSubFolder({ verticalId: v.id, subFolderId: sf.id }); setEditingSubFolderLabel(sf.label); }}>Rename</button>
                              <button className="settings-danger-btn settings-action-btn btn-secondary" onClick={() => setConfirmRemoveSubFolder({ verticalId: v.id, subFolderId: sf.id })}>Remove</button>
                            </>
                          )}
                        </div>
                      ))}

                      {addingSubFolderFor === v.id ? (
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
                        <button className="settings-add-subfolder-btn" onClick={() => { setAddingSubFolderFor(v.id); setNewSubFolderLabel(""); }}>
                          + Add sub-folder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

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
        </section>

        <section className="settings-section">
          <SectionHeader title="Global hotkey" sectionKey="hotkey" />
          {expanded.has("hotkey") && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Current shortcut</div>
                <div className="settings-hotkey-display">
                  {hotkeyState === "capturing"
                    ? capturedAccelerator ? displayAccelerator(capturedAccelerator) : "Press shortcut…"
                    : displayAccelerator(currentHotkey)}
                </div>
              </div>
              {hotkeyState === "idle" && (
                <button className="btn-secondary settings-action-btn"
                  onClick={() => { setHotkeyState("capturing"); setCapturedAccelerator(null); }}>
                  Change hotkey
                </button>
              )}
              {hotkeyState === "capturing" && (
                <div className="settings-capture-hint">Hold a key combination, then release. Press Esc to cancel.</div>
              )}
              {hotkeyState === "saving" && <div className="settings-capture-hint">Registering…</div>}
              {hotkeyState === "error" && (
                <>
                  <p className="form-error">{errorMsg}</p>
                  <button className="btn-secondary settings-action-btn"
                    onClick={() => { setHotkeyState("capturing"); setErrorMsg(""); setCapturedAccelerator(null); }}>
                    Try again
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        <section className="settings-section">
          <SectionHeader title="Window" sectionKey="window" />
          {expanded.has("window") && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Position and size are saved automatically.</div>
              </div>
              <button className="btn-secondary settings-action-btn" onClick={handleResetPosition}>
                {positionReset ? "Reset ✓" : "Reset to default position"}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
