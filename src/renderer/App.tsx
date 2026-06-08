import React, { useState, useEffect, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { Entry, Vertical, VerticalGroup, SearchResult } from "@shared/types";
import SearchBar from "./components/SearchBar";
import VerticalGroupComponent from "./components/VerticalGroup";

type AppStatus = "loading" | "ready" | "error";

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
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(query, 120);

  // Load entries from main process on mount
  useEffect(() => {
    window.shortpath
      .loadEntries()
      .then(({ entries: e, verticals: v }) => {
        setEntries(e);
        setVerticals(v);
        setExpandedGroups(new Set(v.map((vert) => vert.id)));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load entries:", err);
        setStatus("error");
      });

    // Listen for store updates pushed from main (e.g. after tray CSV import)
    const unsubscribe = window.shortpath.onStoreUpdated(({ entries: e, verticals: v }) => {
      setEntries(e);
      setVerticals(v);
    });
    return unsubscribe;
  }, []);

  // Build Fuse.js index whenever entries change
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

  // Compute grouped results from query
  const groups = useMemo((): VerticalGroup[] => {
    const verticalMap = new Map(verticals.map((v) => [v.id, v]));

    let items: { entry: Entry; matches: SearchResult["matches"] }[];

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      // No active query — show all entries flat (no Fuse, no filtering)
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

    // Group by vertical, in the order defined by the verticals list
    const byVertical = new Map<string, typeof items>();
    for (const item of items) {
      const vid = item.entry.vertical;
      if (!byVertical.has(vid)) byVertical.set(vid, []);
      byVertical.get(vid)!.push(item);
    }

    const orderedGroups: VerticalGroup[] = [];

    // Built-in and known verticals first, in their defined order
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

    // Any user-defined verticals not in the verticals list yet
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

  const toggleGroup = useCallback((verticalId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(verticalId)) next.delete(verticalId);
      else next.add(verticalId);
      return next;
    });
  }, []);

  const totalHits = groups.reduce((sum, g) => sum + g.hitCount, 0);
  const isSearching = debouncedQuery.trim().length >= 2;

  if (status === "loading") {
    return (
      <div className="app-shell">
        <div className="status-message">Loading...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app-shell">
        <div className="status-message error">Failed to load data. Check the app logs.</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-path">shortpath /</span>
        {isSearching && totalHits > 0 && (
          <span className="app-hit-summary">{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
        )}
      </header>

      <div className="search-container">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <main className="results-container">
        {isSearching && groups.length === 0 && (
          <div className="empty-state">
            <p>No results for <strong>"{debouncedQuery}"</strong></p>
          </div>
        )}

        {!isSearching && entries.length === 0 && (
          <div className="empty-state">
            <p>No entries yet. Import a CSV or add entries manually.</p>
          </div>
        )}

        {groups.map((group) => (
          <VerticalGroupComponent
            key={group.verticalId}
            group={group}
            onToggle={() => toggleGroup(group.verticalId)}
          />
        ))}
      </main>
    </div>
  );
}
