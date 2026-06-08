import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Entry, Vertical } from "../shared/types";
import { defaultStore, type StoreData } from "./schema";

export type { StoreData };

export function openStore(userDataPath: string): StoreData {
  const storePath = path.join(userDataPath, "store.json");
  if (!fs.existsSync(storePath)) {
    const store = defaultStore();
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
    return store;
  }
  try {
    const raw = fs.readFileSync(storePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    // Backfill fields added after initial release so existing store.json files keep working.
    return migrate({
      recents: [],
      ...parsed,
      entries: parsed.entries ?? [],
      verticals: parsed.verticals ?? [],
      version: parsed.version ?? 1,
    });
  } catch {
    console.error("store.json corrupted, resetting to defaults");
    const store = defaultStore();
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
    return store;
  }
}

export function saveStore(userDataPath: string, data: StoreData): void {
  const storePath = path.join(userDataPath, "store.json");
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
}

function migrate(data: StoreData): StoreData {
  // Future version migrations go here.
  return data;
}

export function addEntry(
  store: StoreData,
  fields: Omit<Entry, "id" | "createdAt" | "updatedAt">,
  verticalLabel?: string
): { store: StoreData; entry: Entry } {
  const now = new Date().toISOString();
  const entry: Entry = { ...fields, id: randomUUID(), createdAt: now, updatedAt: now };

  let verticals = store.verticals;
  if (!verticals.find((v) => v.id === entry.vertical)) {
    verticals = [
      ...verticals,
      { id: entry.vertical, label: verticalLabel ?? entry.vertical, builtIn: false },
    ];
  }

  return {
    store: { ...store, entries: [...store.entries, entry], verticals },
    entry,
  };
}

export function updateEntry(
  store: StoreData,
  id: string,
  updates: Partial<Omit<Entry, "id" | "createdAt">>
): { store: StoreData; entry: Entry } {
  const idx = store.entries.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Entry not found: ${id}`);
  const updated: Entry = {
    ...store.entries[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const entries = [...store.entries];
  entries[idx] = updated;
  return { store: { ...store, entries }, entry: updated };
}

export function deleteEntry(store: StoreData, id: string): StoreData {
  return {
    ...store,
    entries: store.entries.filter((e) => e.id !== id),
    recents: store.recents.filter((rid) => rid !== id),
  };
}

export function recordAccess(store: StoreData, entryId: string): StoreData {
  const recents = [entryId, ...store.recents.filter((id) => id !== entryId)].slice(0, 10);
  return { ...store, recents };
}

export function ensureVertical(store: StoreData, vertical: Vertical): StoreData {
  if (store.verticals.find((v) => v.id === vertical.id)) return store;
  return { ...store, verticals: [...store.verticals, vertical] };
}
