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
}

const DEFAULT_SETTINGS: AppSettings = {
  hotkey: "CommandOrControl+Shift+Space",
};

function settingsPath(userDataPath: string): string {
  return path.join(userDataPath, "settings.json");
}

export function loadSettings(userDataPath: string): AppSettings {
  const p = settingsPath(userDataPath);
  if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
  try {
    const raw = fs.readFileSync(p, "utf-8");
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(userDataPath: string, settings: AppSettings): void {
  fs.writeFileSync(settingsPath(userDataPath), JSON.stringify(settings, null, 2), "utf-8");
}
