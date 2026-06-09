import fs from "fs";
import path from "path";

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppSettings {
  hotkey: string;
  windowBounds?: WindowBounds;
  syncPath?: string;
  fontSize?: number;  // px value, 11–16; default 13
  sourceMode?: "local" | "sync";
  sourceName?: string;
  theme?: "dark" | "light";
  // Phase 10
  accentColor?: string;
  opacity?: number;           // 70–100; default 100
  windowSize?: "small" | "medium" | "large";
  density?: "compact" | "comfortable";
  verticalOrder?: string[];   // ordered array of vertical IDs
  autoHideOnCopy?: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: "CommandOrControl+Shift+Space",
};

// Migrate string font sizes written by builds before the slider was added.
const LEGACY_FONT_SIZES: Record<string, number> = { small: 11, medium: 13, large: 15 };

function settingsPath(userDataPath: string): string {
  return path.join(userDataPath, "settings.json");
}

export function loadSettings(userDataPath: string): AppSettings {
  const p = settingsPath(userDataPath);
  if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.fontSize === "string") {
      parsed.fontSize = LEGACY_FONT_SIZES[parsed.fontSize] ?? 13;
    }
    return { ...DEFAULT_SETTINGS, ...(parsed as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(userDataPath: string, settings: AppSettings): void {
  fs.writeFileSync(settingsPath(userDataPath), JSON.stringify(settings, null, 2), "utf-8");
}
