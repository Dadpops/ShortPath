import React, { useState, useEffect, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { Entry, Vertical, VerticalGroup, SearchResult } from "@shared/types";
import SearchBar from "./components/SearchBar";
import VerticalGroupComponent from "./components/VerticalGroup";
import EntryForm from "./components/EntryForm";

type AppStatus = "loading" | "ready" | "error";
type AppMode = "browse" | "add" | "edit";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [status, setStatus] = useState<AppStatus>("loading");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<AppMode>("browse");
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const debouncedQuery = useDebounce(query, 120);

  useEffect(() => {
    window.shortpath
      .loadEntries()
      .then(({ entries: e, verticals: v, recents: r }) => {
        setEntries(e);
        setVerticals(v);
        setRecents(r);
        setExpandedGroups(new Set(v.map((vert) => vert.id)));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load entries:", err);
        setStatus("error");
      });

    const unsubscribe = window.shortpath.onStoreUpdated(({ entries: e, verticals: v, recents: r }) => {
      setEntries(e);
      setVerticals(v);
      setRecents(r);
    });
    return unsubscribe;
  }, []);

  const fuse = useMemo(() => {
    if (!entries.length) return null;
    return new Fuse(entries, {
      keys: [
        { name: "title", weight: 3 },
        { name: "tags", weight: 2 },
        { name: "body", weight: 1 },
      ],
      threshold: 0.3,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [entries]);

  const groups = useMemo((): VerticalGroup[] => {
    const verticalMap = new Map(verticals.map((v) => [v.id, v]));
    const trimmed = debouncedQuery.trim();

    let items: { entry: Entry; matches: SearchResult["matches"] }[];

    if (trimmed.length < 2) {
      items = entries.map((entry) => ({ entry, matches: [] }));
    } else if (fuse) {
      const fuseResults: FuseResult<Entry>[] = fuse.search(trimmed);
      items = fuseResults.map((r) => ({
        entry: r.item,
        matches:
          r.matches?.map((m) => ({
            key: m.key ?? "",
            indices: [...m.indices] as [number, number][],
          })) ?? [],
      }));
    } else {
      return [];
    }

    const byVertical = new Map<string, typeof items>();
    for (const item of items) {
      const vid = item.entry.vertical;
      if (!byVertical.has(vid)) byVertical.set(vid, []);
      byVertical.get(vid)!.push(item);
    }

    const orderedGroups: VerticalGroup[] = [];

    for (const v of verticals) {
      const groupItems = byVertical.get(v.id);
      if (!groupItems?.length) continue;
      orderedGroups.push({
        verticalId: v.id,
        label: v.label,
        hitCount: groupItems.length,
        results: groupItems.map((i) => ({ entry: i.entry, matches: i.matches })),
        expanded: expandedGroups.has(v.id),
      });
    }

    for (const [vid, groupItems] of byVertical) {
      if (verticals.find((v) => v.id === vid)) continue;
      orderedGroups.push({
        verticalId: vid,
        label: verticalMap.get(vid)?.label ?? vid,
        hitCount: groupItems.length,
        results: groupItems.map((i) => ({ entry: i.entry, matches: i.matches })),
        expanded: expandedGroups.has(vid),
      });
    }

    return orderedGroups;
  }, [entries, verticals, debouncedQuery, fuse, expandedGroups]);

  const recentEntries = useMemo(
    () => recents.map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [recents, entries]
  );

  const toggleGroup = useCallback((verticalId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(verticalId)) next.delete(verticalId);
      else next.add(verticalId);
      return next;
    });
  }, []);

  function handleEditEntry(entry: Entry) {
    setEditingEntry(entry);
    setMode("edit");
  }

  function handleCopy(entryId: string) {
    setRecents((prev) => [entryId, ...prev.filter((id) => id !== entryId)].slice(0, 10));
  }

  function handleFormSave(entry: Entry, newVerticals: Vertical[]) {
    if (mode === "add") {
      setEntries((prev) => [...prev, entry]);
    } else {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    }
    // Refresh verticals in case a new one was created
    setVerticals(newVerticals);
    setExpandedGroups((prev) => new Set([...prev, entry.vertical]));
    setMode("browse");
    setEditingEntry(null);
  }

  function handleFormDelete() {
    if (editingEntry) {
      setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
      setRecents((prev) => prev.filter((id) => id !== editingEntry.id));
    }
    setMode("browse");
    setEditingEntry(null);
  }

  function handleFormCancel() {
    setMode("browse");
    setEditingEntry(null);
  }

  const totalHits = groups.reduce((sum, g) => sum + g.hitCount, 0);
  const isSearching = debouncedQuery.trim().length >= 2;

  if (status === "loading") {
    return <div className="app-shell"><div className="status-message">Loading...</div></div>;
  }

  if (status === "error") {
    return (
      <div className="app-shell">
        <div className="status-message error">Failed to load data. Check the app logs.</div>
      </div>
    );
  }

  if (mode === "add" || mode === "edit") {
    return (
      <div className="app-shell">
        <EntryForm
          entry={editingEntry ?? undefined}
          verticals={verticals}
          onSave={handleFormSave}
          onDelete={mode === "edit" ? handleFormDelete : undefined}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-path">shortpath /</span>
        <div className="header-actions">
          {isSearching && totalHits > 0 && (
            <span className="app-hit-summary">{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
          )}
          <button
            className="add-btn"
            onClick={() => { setEditingEntry(null); setMode("add"); }}
            title="Add entry"
          >
            +
          </button>
        </div>
      </header>

      <div className="search-container">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <main className="results-container">
        {/* Recents section — shown when not searching and there are recent entries */}
        {!isSearching && recentEntries.length > 0 && (
          <div className="recents-section">
            <div className="recents-header">Recent</div>
            <ul className="result-list">
              {recentEntries.map((entry) => (
                <ResultItem
                  key={entry.id}
                  result={{ entry, matches: [] }}
                  onEdit={handleEditEntry}
                  onCopy={handleCopy}
                />
              ))}
            </ul>
          </div>
        )}

        {isSearching && groups.length === 0 && (
          <div className="empty-state">
            <p>No results for <strong>"{debouncedQuery}"</strong></p>
          </div>
        )}

        {!isSearching && entries.length === 0 && (
          <div className="empty-state">
            <p>No entries yet. Press <strong>+</strong> to add one or import a CSV from the tray menu.</p>
          </div>
        )}

        {groups.map((group) => (
          <VerticalGroupComponent
            key={group.verticalId}
            group={group}
            onToggle={() => toggleGroup(group.verticalId)}
            onEdit={handleEditEntry}
            onCopy={handleCopy}
          />
        ))}
      </main>
    </div>
  );
}
