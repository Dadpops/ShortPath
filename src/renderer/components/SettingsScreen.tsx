import { useState, useEffect } from "react";
import type { Vertical } from "@shared/types";

interface Props {
  onClose: () => void;
  onNavigate: (mode: "import" | "split" | "add") => void;
  verticals: Vertical[];
  onVerticalRenamed: (id: string, newLabel: string) => void;
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
  return acc
    .replace("CommandOrControl", "Ctrl")
    .replace(/\+/g, " + ");
}

export default function SettingsScreen({ onClose, onNavigate, verticals, onVerticalRenamed }: Props) {
  const [currentHotkey, setCurrentHotkey] = useState("Loading…");
  const [hotkeyState, setHotkeyState] = useState<HotkeyState>("idle");
  const [capturedAccelerator, setCapturedAccelerator] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [positionReset, setPositionReset] = useState(false);

  const [fontSize, setFontSize] = useState<number>(13);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [exportingAll, setExportingAll] = useState(false);
  const [exportingMine, setExportingMine] = useState(false);

  const [editingVerticalId, setEditingVerticalId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

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

  function SectionHeader({ title, sectionKey }: { title: string; sectionKey: SectionKey }) {
    return (
      <button className="settings-section-header" onClick={() => toggleSection(sectionKey)}>
        <span className="settings-section-title">{title}</span>
        <span className={`settings-chevron${expanded.has(sectionKey) ? " expanded" : ""}`}>›</span>
      </button>
    );
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
          <SectionHeader title="Appearance" sectionKey="appearance" />
          {expanded.has("appearance") && (
            <div className="settings-section-body">
              <div className="settings-row">
                <div className="settings-row-label">Text size</div>
                <div className="font-size-slider-wrap">
                  <span className="font-size-label-sm">A</span>
                  <input
                    type="range"
                    min={11}
                    max={16}
                    step={1}
                    value={fontSize}
                    onChange={(e) => handleFontSize(Number(e.target.value))}
                    className="font-size-slider"
                  />
                  <span className="font-size-label-lg">A</span>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-label">Theme</div>
                <div className="font-size-control">
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      className={`font-size-btn${theme === t ? " active" : ""}`}
                      onClick={() => handleSetTheme(t)}
                    >
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
            </div>
          )}
        </section>

        <section className="settings-section">
          <SectionHeader title="Verticals" sectionKey="verticals" />
          {expanded.has("verticals") && (
            <div className="settings-section-body">
              {verticals.map((v) => (
                <div key={v.id} className="settings-vertical-row">
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
                      <button className="btn-primary settings-action-btn" onClick={saveEditVertical}>
                        Save
                      </button>
                      <button className="btn-secondary settings-action-btn" onClick={() => setEditingVerticalId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="settings-vertical-label">{v.label}</span>
                      <button className="btn-secondary settings-action-btn" onClick={() => startEditVertical(v)}>
                        Rename
                      </button>
                    </>
                  )}
                </div>
              ))}
              {verticals.length === 0 && (
                <p className="settings-stub-note">No verticals yet. Add entries to create verticals.</p>
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
                    ? capturedAccelerator
                      ? displayAccelerator(capturedAccelerator)
                      : "Press shortcut…"
                    : displayAccelerator(currentHotkey)}
                </div>
              </div>

              {hotkeyState === "idle" && (
                <button
                  className="btn-secondary settings-action-btn"
                  onClick={() => { setHotkeyState("capturing"); setCapturedAccelerator(null); }}
                >
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
                  <button
                    className="btn-secondary settings-action-btn"
                    onClick={() => { setHotkeyState("capturing"); setErrorMsg(""); setCapturedAccelerator(null); }}
                  >
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
