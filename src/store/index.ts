import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Entry, Vertical, SubFolder } from "../shared/types";
import { defaultStore, type StoreData } from "./schema";
import { uninstallSeedData } from "./seed";

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
      pinned: parsed.pinned ?? [],
      recentCopies: parsed.recentCopies ?? [],
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
    pinned: store.pinned.filter((pid) => pid !== id),
  };
}

export function togglePin(store: StoreData, entryId: string): StoreData {
  const already = store.pinned.includes(entryId);
  return {
    ...store,
    pinned: already
      ? store.pinned.filter((id) => id !== entryId)
      : [...store.pinned, entryId],
  };
}

export function incrementCopyCount(store: StoreData, entryId: string): StoreData {
  const now = new Date().toISOString();
  const entries = store.entries.map((e) => {
    if (e.id !== entryId) return e;
    if (e.source === "local" || e.source === "sample") {
      return { ...e, copyCount: (e.copyCount ?? 0) + 1, lastCopiedAt: now };
    }
    return { ...e, lastCopiedAt: now };
  });
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentCopies = [
    { id: entryId, copiedAt: now },
    ...(store.recentCopies ?? []).filter((r) => r.id !== entryId && r.copiedAt > cutoff),
  ].slice(0, 20);
  return { ...store, entries, recentCopies };
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

export function clearLocalEntries(store: StoreData): StoreData {
  const syncedIds = new Set(store.entries.filter((e) => e.source === "synced").map((e) => e.id));
  return {
    ...store,
    entries: store.entries.filter((e) => e.source === "synced"),
    recents: store.recents.filter((id) => syncedIds.has(id)),
    favorites: store.favorites.filter((id) => syncedIds.has(id)),
    pinned: store.pinned.filter((id) => syncedIds.has(id)),
    recentCopies: (store.recentCopies ?? []).filter((r) => syncedIds.has(r.id)),
  };
}

export function clearSampleData(store: StoreData): StoreData {
  return uninstallSeedData(store);
}

export function hasSampleData(store: StoreData): boolean {
  return store.entries.some((e) => e.source === "sample");
}

// ── SubFolder tree helpers ────────────────────────────────────────────────────

function getAllSubFolderIds(subFolders: SubFolder[]): string[] {
  return subFolders.flatMap((sf) => [sf.id, ...getAllSubFolderIds(sf.subFolders ?? [])]);
}

function addToTree(subFolders: SubFolder[], parentId: string | null, newSf: SubFolder): SubFolder[] {
  if (!parentId) return [...subFolders, newSf];
  return subFolders.map((sf) =>
    sf.id === parentId
      ? { ...sf, subFolders: [...(sf.subFolders ?? []), newSf] }
      : { ...sf, subFolders: addToTree(sf.subFolders ?? [], parentId, newSf) }
  );
}

function renameInTree(subFolders: SubFolder[], id: string, newLabel: string): SubFolder[] {
  return subFolders.map((sf) =>
    sf.id === id
      ? { ...sf, label: newLabel }
      : { ...sf, subFolders: renameInTree(sf.subFolders ?? [], id, newLabel) }
  );
}

function removeFromTree(subFolders: SubFolder[], id: string): SubFolder[] {
  return subFolders
    .filter((sf) => sf.id !== id)
    .map((sf) => ({ ...sf, subFolders: removeFromTree(sf.subFolders ?? [], id) }));
}

function collectSubtreeIds(subFolders: SubFolder[], rootId: string): string[] {
  for (const sf of subFolders) {
    if (sf.id === rootId) return [rootId, ...getAllSubFolderIds(sf.subFolders ?? [])];
    const found = collectSubtreeIds(sf.subFolders ?? [], rootId);
    if (found.length > 0) return found;
  }
  return [];
}

// ── SubFolder operations ──────────────────────────────────────────────────────

export function addSubFolder(
  store: StoreData,
  verticalId: string,
  label: string,
  parentSubFolderId?: string
): { store: StoreData; subFolder: SubFolder } {
  const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const existing = getAllSubFolderIds(store.verticals.find((v) => v.id === verticalId)?.subFolders ?? []);
  const baseId = slug || "folder";
  let id = baseId;
  let suffix = 1;
  while (existing.includes(id)) { id = `${baseId}-${suffix}`; suffix++; }
  const subFolder: SubFolder = { id, label };
  const verticals = store.verticals.map((v) =>
    v.id === verticalId
      ? { ...v, subFolders: addToTree(v.subFolders ?? [], parentSubFolderId ?? null, subFolder) }
      : v
  );
  return { store: { ...store, verticals }, subFolder };
}

export function renameSubFolder(store: StoreData, verticalId: string, subFolderId: string, newLabel: string): StoreData {
  const verticals = store.verticals.map((v) =>
    v.id === verticalId
      ? { ...v, subFolders: renameInTree(v.subFolders ?? [], subFolderId, newLabel) }
      : v
  );
  return { ...store, verticals };
}

export function removeSubFolder(store: StoreData, verticalId: string, subFolderId: string): StoreData {
  const removedIds = new Set(
    collectSubtreeIds(store.verticals.find((v) => v.id === verticalId)?.subFolders ?? [], subFolderId)
  );
  const verticals = store.verticals.map((v) =>
    v.id === verticalId ? { ...v, subFolders: removeFromTree(v.subFolders ?? [], subFolderId) } : v
  );
  const entries = store.entries.map((e) =>
    e.subFolderId && removedIds.has(e.subFolderId) ? { ...e, subFolderId: undefined } : e
  );
  return { ...store, verticals, entries };
}

export function deleteVertical(store: StoreData, verticalId: string): StoreData {
  const removedIds = new Set(store.entries.filter((e) => e.vertical === verticalId).map((e) => e.id));
  return {
    ...store,
    verticals: store.verticals.filter((v) => v.id !== verticalId),
    entries: store.entries.filter((e) => e.vertical !== verticalId),
    recents: store.recents.filter((id) => !removedIds.has(id)),
    favorites: store.favorites.filter((id) => !removedIds.has(id)),
    pinned: store.pinned.filter((id) => !removedIds.has(id)),
  };
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
// Legacy single-source path: clears ALL synced entries and replaces.
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

  // Prune recents, favorites, and pins that no longer exist after the replacement.
  const liveIds = new Set([...localEntries, ...newSyncedEntries].map((e) => e.id));
  const recents = store.recents.filter((id) => liveIds.has(id));
  const favorites = store.favorites.filter((id) => liveIds.has(id));
  const pinned = store.pinned.filter((id) => liveIds.has(id));

  return { ...store, entries: [...localEntries, ...newSyncedEntries], verticals, recents, favorites, pinned };
}

// Replace entries from one specific sync source. Entries from other sources are preserved.
// Removes legacy synced entries (no syncSource) the first time this is called.
export function replaceEntriesFromSource(store: StoreData, sourceId: string, newSyncedEntries: Entry[]): StoreData {
  // Keep local entries and synced entries from other identified sources.
  const kept = store.entries.filter(
    (e) => e.source === "local" || (e.source === "synced" && !!e.syncSource && e.syncSource !== sourceId)
  );
  const tagged: Entry[] = newSyncedEntries.map((e) => ({ ...e, syncSource: sourceId }));

  // Ensure verticals exist for all incoming entries.
  let verticals = [...store.verticals];
  for (const vid of new Set(tagged.map((e) => e.vertical))) {
    if (!verticals.find((v) => v.id === vid)) {
      verticals = [...verticals, { id: vid, label: vid, builtIn: false }];
    }
  }

  const liveIds = new Set([...kept, ...tagged].map((e) => e.id));
  const recents = store.recents.filter((id) => liveIds.has(id));
  const favorites = store.favorites.filter((id) => liveIds.has(id));
  const pinned = store.pinned.filter((id) => liveIds.has(id));

  return { ...store, entries: [...kept, ...tagged], verticals, recents, favorites, pinned };
}

// Returns entries in newSyncedEntries that share title+vertical with an existing local entry.
// Call before replaceEntriesFromSource so the local entries are still in store.
export function detectSyncDuplicates(
  store: StoreData,
  newSyncedEntries: Entry[]
): Array<{ title: string; vertical: string }> {
  const locals = store.entries.filter((e) => e.source === "local");
  const seen = new Set<string>();
  const dupes: Array<{ title: string; vertical: string }> = [];
  for (const synced of newSyncedEntries) {
    const key = `${synced.title.toLowerCase()}::${synced.vertical}`;
    if (seen.has(key)) continue;
    if (locals.some((l) => l.title.toLowerCase() === synced.title.toLowerCase() && l.vertical === synced.vertical)) {
      seen.add(key);
      dupes.push({ title: synced.title, vertical: synced.vertical });
    }
  }
  return dupes;
}
