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
    return migrate({
      version: parsed.version ?? 1,
      entries: parsed.entries ?? [],
      verticals: parsed.verticals ?? [],
      recents: parsed.recents ?? [],
      favorites: parsed.favorites ?? [],
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
  const entries = data.entries.map((e) => {
    const entry = { ...e };

    // Backfill source field added in Phase 1 additions.
    if (!entry.source) {
      entry.source = "local";
    }

    // Migrate comma-separated tags to pipe-separated.
    if (entry.tags && !entry.tags.includes("|") && entry.tags.includes(",")) {
      entry.tags = entry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join("|");
    }

    return entry;
  });

  return { ...data, entries };
}

// Callers never set source or id/timestamps — addEntry always assigns source: "local".
export function addEntry(
  store: StoreData,
  fields: Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">,
  verticalLabel?: string
): { store: StoreData; entry: Entry } {
  const now = new Date().toISOString();
  const entry: Entry = { ...fields, source: "local", id: randomUUID(), createdAt: now, updatedAt: now };

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

// source is excluded from updates — sync status is set at import time and never changed.
export function updateEntry(
  store: StoreData,
  id: string,
  updates: Partial<Omit<Entry, "id" | "createdAt" | "source">>
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
    favorites: store.favorites.filter((fid) => fid !== id),
  };
}

export function toggleFavorite(store: StoreData, entryId: string): StoreData {
  const already = store.favorites.includes(entryId);
  return {
    ...store,
    favorites: already
      ? store.favorites.filter((id) => id !== entryId)
      : [...store.favorites, entryId],
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

// Move an entry up or down within its vertical. Used for Support Tools ordering.
export function reorderEntry(store: StoreData, entryId: string, direction: "up" | "down"): StoreData {
  const entry = store.entries.find((e) => e.id === entryId);
  if (!entry) return store;

  const verticalEntries = store.entries.filter((e) => e.vertical === entry.vertical);
  const posInVertical = verticalEntries.findIndex((e) => e.id === entryId);

  if (direction === "up" && posInVertical <= 0) return store;
  if (direction === "down" && posInVertical >= verticalEntries.length - 1) return store;

  const swapId = verticalEntries[direction === "up" ? posInVertical - 1 : posInVertical + 1].id;

  const newEntries = [...store.entries];
  const globalIdx = newEntries.findIndex((e) => e.id === entryId);
  const globalSwapIdx = newEntries.findIndex((e) => e.id === swapId);
  [newEntries[globalIdx], newEntries[globalSwapIdx]] = [newEntries[globalSwapIdx], newEntries[globalIdx]];

  return { ...store, entries: newEntries };
}

export function addVertical(store: StoreData, label: string): { store: StoreData; vertical: Vertical } {
  const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const baseId = slug || "custom";
  let id = baseId;
  let suffix = 1;
  while (store.verticals.find((v) => v.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix++;
  }
  const vertical: Vertical = { id, label, builtIn: false };
  return { store: { ...store, verticals: [...store.verticals, vertical] }, vertical };
}

export function renameVertical(store: StoreData, id: string, newLabel: string): StoreData {
  return {
    ...store,
    verticals: store.verticals.map((v) => (v.id === id ? { ...v, label: newLabel } : v)),
  };
}

// Replace all synced entries atomically. Local entries are never touched.
export function replaceSyncedEntries(store: StoreData, newSyncedEntries: Entry[]): StoreData {
  const localEntries = store.entries.filter((e) => e.source === "local");

  // Ensure verticals exist for all incoming synced entries.
  let verticals = [...store.verticals];
  const seenVerticalIds = new Set(newSyncedEntries.map((e) => e.vertical));
  for (const vid of seenVerticalIds) {
    if (!verticals.find((v) => v.id === vid)) {
      verticals = [...verticals, { id: vid, label: vid, builtIn: false }];
    }
  }

  // Prune recents and favorites that no longer exist after the replacement.
  const liveIds = new Set([...localEntries, ...newSyncedEntries].map((e) => e.id));
  const recents = store.recents.filter((id) => liveIds.has(id));
  const favorites = store.favorites.filter((id) => liveIds.has(id));

  return { ...store, entries: [...localEntries, ...newSyncedEntries], verticals, recents, favorites };
}
