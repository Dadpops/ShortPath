import { useEffect, useRef, useState } from "react";
import { formatAccelerator } from "@shared/platform";

const DEFAULT_SHORTCUTS: Record<string, string> = {
  notes: "Alt+N",
  keyboard: "Alt+K",
  help: "Alt+H",
  settings: "Alt+S",
  newEntry: "Ctrl+N",
  cycleTab: "Tab",
};

const SHORTCUT_DEFS = [
  { action: "notes",    label: "Notes" },
  { action: "keyboard", label: "Keyboard shortcuts panel" },
  { action: "help",     label: "Help" },
  { action: "settings", label: "Settings" },
  { action: "newEntry", label: "New entry" },
  { action: "cycleTab", label: "Cycle vertical tab" },
] as const;

const FIXED_SHORTCUTS = [
  { keys: ["↑ / ↓"], description: "Move focus between results" },
  { keys: ["Enter"], description: "Open focused entry detail" },
  { keys: ["Esc"], description: "Close detail / clear search / hide window" },
  { keys: ["Shift + Tab"], description: "Cycle vertical tab backward" },
  { keys: ["↑ in empty search"], description: "Cycle recent search queries" },
];

type HotkeyState = "idle" | "capturing" | "saving" | "error";

interface Props {
  onClose: () => void;
  hotkey: string;
  customShortcuts: Record<string, string | null>;
  onCustomShortcutsChange: (s: Record<string, string | null>) => void;
  onHotkeyChange: (h: string) => void;
}

function buildGlobalAccelerator(e: KeyboardEvent): string | null {
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

export default function KeyboardPanel({ onClose, hotkey, customShortcuts, onCustomShortcutsChange, onHotkeyChange }: Props) {
  const backRef = useRef<HTMLButtonElement>(null);
  const [capturingAction, setCapturingAction] = useState<string | null>(null);
  const [capturedShortcut, setCapturedShortcut] = useState<string | null>(null);

  const [hotkeyState, setHotkeyState] = useState<HotkeyState>("idle");
  const [capturedHotkey, setCapturedHotkey] = useState<string | null>(null);
  const [hotkeyError, setHotkeyError] = useState("");

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  // Esc closes panel when not capturing
  useEffect(() => {
    if (capturingAction !== null || hotkeyState === "capturing") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, capturingAction, hotkeyState]);

  // In-app shortcut capture
  useEffect(() => {
    if (capturingAction === null) return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setCapturingAction(null); setCapturedShortcut(null); return; }
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      const key = e.code.startsWith("Key")
        ? e.code.slice(3)
        : e.code.startsWith("Digit")
        ? e.code.slice(5)
        : e.key === " " ? "Space"
        : e.key.length === 1 ? e.key.toUpperCase()
        : e.key;
      if (!key) return;
      parts.push(key);
      setCapturedShortcut(parts.join("+"));
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Escape") return;
      if (capturedShortcut && capturingAction) {
        const newMap = { ...customShortcuts, [capturingAction]: capturedShortcut };
        onCustomShortcutsChange(newMap);
        void window.shortpath.setCustomShortcuts(newMap);
        setCapturingAction(null);
        setCapturedShortcut(null);
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [capturingAction, capturedShortcut, customShortcuts, onCustomShortcutsChange]);

  // Global hotkey capture
  useEffect(() => {
    if (hotkeyState !== "capturing") return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setHotkeyState("idle"); setCapturedHotkey(null); return; }
      const acc = buildGlobalAccelerator(e);
      if (acc) setCapturedHotkey(acc);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Escape") return;
      if (capturedHotkey) void saveHotkey(capturedHotkey);
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [hotkeyState, capturedHotkey]);

  async function saveHotkey(accelerator: string) {
    setHotkeyState("saving");
    const result = await window.shortpath.changeHotkey(accelerator);
    if (result.ok) {
      onHotkeyChange(accelerator);
      setHotkeyState("idle");
      setCapturedHotkey(null);
    } else {
      setHotkeyError(`"${formatAccelerator(accelerator, window.shortpath.platform)}" is already in use by another app.`);
      setHotkeyState("error");
      setCapturedHotkey(null);
    }
  }

  const formattedHotkey = formatAccelerator(hotkey, window.shortpath.platform);

  return (
    <div className="help-shell">
      <div className="form-header">
        <button ref={backRef} className="form-back-btn" onClick={onClose}>← Back</button>
        <span className="form-title">Keyboard shortcuts</span>
      </div>

      <div className="keyboard-panel-body">

        {/* Global summon hotkey */}
        <div className="keyboard-group">
          <div className="keyboard-group-label">Global summon hotkey</div>
          <div className="keyboard-row keyboard-row-editable">
            <span className="keyboard-row-desc">Open ShortPath from any app</span>
            <div className="keyboard-row-controls">
              {hotkeyState === "capturing" ? (
                <>
                  <span className="keyboard-capture-display">
                    {capturedHotkey ? formatAccelerator(capturedHotkey, window.shortpath.platform) : "Press keys…"}
                  </span>
                  <button className="keyboard-shortcut-btn" onClick={() => { setHotkeyState("idle"); setCapturedHotkey(null); }}>Cancel</button>
                </>
              ) : (
                <>
                  <kbd className="keyboard-key">{formattedHotkey}</kbd>
                  <button
                    className="keyboard-shortcut-btn"
                    onClick={() => { setHotkeyState("capturing"); setCapturedHotkey(null); setHotkeyError(""); }}
                    disabled={hotkeyState === "saving"}
                  >
                    {hotkeyState === "saving" ? "Saving…" : "Change"}
                  </button>
                </>
              )}
            </div>
          </div>
          {hotkeyState === "capturing" && (
            <p className="keyboard-capture-hint">Hold a combination, then release. Esc to cancel.</p>
          )}
          {hotkeyState === "error" && (
            <>
              <p className="form-error keyboard-hotkey-error">{hotkeyError}</p>
              <button className="keyboard-shortcut-btn" onClick={() => { setHotkeyState("capturing"); setHotkeyError(""); setCapturedHotkey(null); }}>Try again</button>
            </>
          )}
        </div>

        {/* Customizable in-app shortcuts */}
        <div className="keyboard-group">
          <div className="keyboard-group-label">In-app shortcuts</div>
          {SHORTCUT_DEFS.map(({ action, label }) => {
            const current = action in customShortcuts ? customShortcuts[action] : DEFAULT_SHORTCUTS[action];
            const isDisabled = customShortcuts[action] === null;
            const isCapturing = capturingAction === action;
            return (
              <div key={action} className="keyboard-row keyboard-row-editable">
                <span className="keyboard-row-desc">{label}</span>
                <div className="keyboard-row-controls">
                  {isCapturing ? (
                    <>
                      <span className="keyboard-capture-display">{capturedShortcut ?? "Press keys…"}</span>
                      <button
                        className="keyboard-shortcut-btn"
                        onClick={() => { setCapturingAction(null); setCapturedShortcut(null); }}
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      <kbd className={`keyboard-key${isDisabled ? " keyboard-key-disabled" : ""}`}>
                        {isDisabled ? "Off" : (current ?? DEFAULT_SHORTCUTS[action])}
                      </kbd>
                      <button
                        className="keyboard-shortcut-btn"
                        onClick={() => { setCapturingAction(action); setCapturedShortcut(null); }}
                        disabled={isDisabled}
                      >Change</button>
                      <button
                        className={`keyboard-shortcut-btn${isDisabled ? " active" : ""}`}
                        onClick={() => {
                          const newMap = { ...customShortcuts };
                          if (isDisabled) { delete newMap[action]; } else { newMap[action] = null; }
                          onCustomShortcutsChange(newMap);
                          void window.shortpath.setCustomShortcuts(newMap);
                        }}
                      >{isDisabled ? "Enable" : "Off"}</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {capturingAction !== null && (
            <p className="keyboard-capture-hint">Hold a combination, then release. Esc to cancel.</p>
          )}
        </div>

        {/* Fixed shortcuts */}
        <div className="keyboard-group">
          <div className="keyboard-group-label">Fixed shortcuts</div>
          {FIXED_SHORTCUTS.map((item) => (
            <div key={item.description} className="keyboard-row">
              <span className="keyboard-row-desc">{item.description}</span>
              <div className="keyboard-keys">
                {item.keys.map((k) => (
                  <kbd key={k} className="keyboard-key">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
