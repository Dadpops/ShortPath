import { useState, useEffect } from "react";

interface Props {
  onClose: () => void;
}

type HotkeyState = "idle" | "capturing" | "saving" | "error";

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

export default function SettingsScreen({ onClose }: Props) {
  const [currentHotkey, setCurrentHotkey] = useState("Loading…");
  const [hotkeyState, setHotkeyState] = useState<HotkeyState>("idle");
  const [capturedAccelerator, setCapturedAccelerator] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [positionReset, setPositionReset] = useState(false);

  useEffect(() => {
    window.shortpath.getSettings().then(({ hotkey }) => setCurrentHotkey(hotkey));
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

        <section className="settings-section settings-section-stub">
          <div className="settings-section-title">Shared file sync</div>
          <div className="settings-stub-note">Configured in Phase 4 — not yet available.</div>
        </section>
      </div>
    </div>
  );
}
