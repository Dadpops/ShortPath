import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Entry, Vertical } from "../shared/types";
import { defaultStore, STORE_VERSION, type StoreData } from "./schema";

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
    const data = JSON.parse(raw) as StoreData;
    return migrate(data);
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
  if (data.version === STORE_VERSION) return data;
  // Future migrations added here when STORE_VERSION bumps.
  return data;
}

export function addEntry(
  store: StoreData,
  fields: Omit<Entry, "id" | "createdAt" | "updatedAt">
): { store: StoreData; entry: Entry } {
  const now = new Date().toISOString();
  const entry: Entry = { ...fields, id: randomUUID(), createdAt: now, updatedAt: now };

  let verticals = store.verticals;
  if (!verticals.find((v) => v.id === entry.vertical)) {
    verticals = [...verticals, { id: entry.vertical, label: entry.vertical, builtIn: false }];
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
  return { ...store, entries: store.entries.filter((e) => e.id !== id) };
}

export function ensureVertical(store: StoreData, vertical: Vertical): StoreData {
  if (store.verticals.find((v) => v.id === vertical.id)) return store;
  return { ...store, verticals: [...store.verticals, vertical] };
}
