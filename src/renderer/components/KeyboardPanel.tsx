import { useEffect, useRef } from "react";
import { formatAccelerator } from "@shared/platform";

interface Props {
  onClose: () => void;
  hotkey: string;
}

const SHORTCUT_GROUPS = [
  {
    category: "Navigate results",
    items: [
      { keys: ["↑ / ↓"], description: "Move focus between results" },
      { keys: ["Enter"], description: "Open focused entry detail" },
      { keys: ["Esc"], description: "Close detail → clear search → hide window" },
    ],
  },
  {
    category: "Filter and sort",
    items: [
      { keys: ["Tab"], description: "Cycle vertical filter tab forward" },
      { keys: ["Shift + Tab"], description: "Cycle vertical filter tab backward" },
    ],
  },
  {
    category: "Entries",
    items: [
      { keys: ["Ctrl + N"], description: "New entry (from main view)" },
      { keys: ["↑ in empty search"], description: "Cycle recent search queries" },
    ],
  },
  {
    category: "Panels",
    items: [
      { keys: ["Alt + K"], description: "Keyboard shortcuts (this panel)" },
      { keys: ["Alt + N"], description: "Notes" },
      { keys: ["Alt + H"], description: "Help" },
      { keys: ["Alt + S"], description: "Settings" },
    ],
  },
];

export default function KeyboardPanel({ onClose, hotkey }: Props) {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formattedHotkey = formatAccelerator(hotkey, window.shortpath.platform);

  return (
    <div className="help-shell">
      <div className="form-header">
        <button ref={backRef} className="form-back-btn" onClick={onClose}>← Back</button>
        <span className="form-title">Keyboard shortcuts</span>
      </div>

      <div className="keyboard-panel-body">
        <div className="keyboard-hotkey-row">
          <span className="keyboard-hotkey-label">Global summon hotkey</span>
          <kbd className="keyboard-key">{formattedHotkey}</kbd>
          <span className="keyboard-hotkey-note">Change in Settings → Behavior</span>
        </div>

        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.category} className="keyboard-group">
            <div className="keyboard-group-label">{group.category}</div>
            {group.items.map((item) => (
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
        ))}
      </div>
    </div>
  );
}
