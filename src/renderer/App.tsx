import { useState, useEffect, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { Entry, Vertical, VerticalGroup, SearchResult } from "@shared/types";
import SearchBar from "./components/SearchBar";
import VerticalGroupComponent from "./components/VerticalGroup";
import ResultItem from "./components/ResultItem";
import EntryForm from "./components/EntryForm";
import ImportScreen from "./components/ImportScreen";
import SplitImport from "./components/SplitImport";
import SettingsScreen from "./components/SettingsScreen";
import MacroOverlay from "./components/MacroOverlay";

type AppStatus = "loading" | "ready" | "error";
type AppMode = "browse" | "add" | "edit" | "import" | "split" | "settings";

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
  const [quickAddPrefill, setQuickAddPrefill] = useState<string | undefined>(undefined);
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const [clipboardDismissed, setClipboardDismissed] = useState(false);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [overlayEntry, setOverlayEntry] = useState<Entry | null>(null);

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

  useEffect(() => {
    function refreshClipboard() {
      window.shortpath.readClipboard().then((text) => {
        setClipboardText(text.trim() || null);
        setClipboardDismissed(false);
      });
    }
    refreshClipboard();
    window.addEventListener("focus", refreshClipboard);
    return () => window.removeEventListener("focus", refreshClipboard);
  }, []);

  useEffect(() => {
    const unsubFocus = window.shortpath.onFocusSearch(() => {
      setFocusTrigger((n) => n + 1);
    });
    const unsubHotkey = window.shortpath.onHotkeyFailed((accelerator) => {
      setHotkeyError(`Could not register hotkey "${accelerator}". It may be in use by another app.`);
    });
    const unsubSettings = window.shortpath.onOpenSettings(() => {
      setMode("settings");
    });
    return () => {
      unsubFocus();
      unsubHotkey();
      unsubSettings();
    };
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

  // Flat list of all currently visible results for keyboard navigation.
  const flatResults = useMemo((): Entry[] => {
    const searching = debouncedQuery.trim().length >= 2;
    if (!searching && recentEntries.length > 0) return recentEntries;
    return groups.flatMap((g) => (g.expanded ? g.results.map((r) => r.entry) : []));
  }, [groups, recentEntries, debouncedQuery]);

  // Reset keyboard focus when the query or visible results change.
  useEffect(() => {
    setFocusedEntryId(null);
  }, [debouncedQuery]);

  // Scroll focused item into view.
  useEffect(() => {
    if (focusedEntryId) {
      document.querySelector("[data-focused='true']")?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedEntryId]);

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

  function navigateDown() {
    if (flatResults.length === 0) return;
    setFocusedEntryId((prev) => {
      const idx = prev ? flatResults.findIndex((e) => e.id === prev) : -1;
      const next = idx < flatResults.length - 1 ? idx + 1 : 0;
      return flatResults[next].id;
    });
  }

  function navigateUp() {
    if (flatResults.length === 0) return;
    setFocusedEntryId((prev) => {
      const idx = prev ? flatResults.findIndex((e) => e.id === prev) : flatResults.length;
      const next = idx > 0 ? idx - 1 : flatResults.length - 1;
      return flatResults[next].id;
    });
  }

  function handleOpenOverlay(entry: Entry) {
    setOverlayEntry(entry);
  }

  function handleCloseOverlay() {
    setOverlayEntry(null);
  }

  function handleEnter() {
    if (focusedEntryId) {
      const entry = flatResults.find((e) => e.id === focusedEntryId);
      if (entry) setOverlayEntry(entry);
    }
  }

  function handleEscape() {
    if (overlayEntry) {
      setOverlayEntry(null);
    } else if (focusedEntryId) {
      setFocusedEntryId(null);
    } else {
      window.shortpath.hideWindow();
    }
  }

  function handleFormSave(entry: Entry, newVerticals: Vertical[]) {
    if (mode === "add") {
      setEntries((prev) => [...prev, entry]);
    } else {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    }
    setVerticals(newVerticals);
    setExpandedGroups((prev) => new Set([...prev, entry.vertical]));
    setMode("browse");
    setEditingEntry(null);
    setQuickAddPrefill(undefined);
  }

  function handleFormDelete() {
    if (editingEntry) {
      setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
      setRecents((prev) => prev.filter((id) => id !== editingEntry.id));
    }
    setMode("browse");
    setEditingEntry(null);
    setQuickAddPrefill(undefined);
  }

  function handleFormCancel() {
    setMode("browse");
    setEditingEntry(null);
    setQuickAddPrefill(undefined);
  }

  function handleImportComplete() {
    // store-updated push from main will refresh entries/verticals
    setMode("browse");
  }

  function handleSplitComplete(newEntries: Entry[], newVerticals: Vertical[]) {
    setEntries((prev) => [...prev, ...newEntries]);
    setVerticals(newVerticals);
    for (const e of newEntries) {
      setExpandedGroups((prev) => new Set([...prev, e.vertical]));
    }
    setMode("browse");
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
          quickAdd={mode === "add" && !editingEntry}
          prefillBody={quickAddPrefill}
        />
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="app-shell">
        <ImportScreen onComplete={handleImportComplete} onCancel={() => setMode("browse")} />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div className="app-shell">
        <SplitImport
          verticals={verticals}
          onComplete={handleSplitComplete}
          onCancel={() => setMode("browse")}
        />
      </div>
    );
  }

  if (mode === "settings") {
    return (
      <div className="app-shell">
        <SettingsScreen onClose={() => setMode("browse")} />
      </div>
    );
  }

  const showClipboardBanner =
    mode === "browse" &&
    !!clipboardText &&
    !clipboardDismissed;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-path">shortpath /</span>
        <div className="header-actions">
          {isSearching && totalHits > 0 && (
            <span className="app-hit-summary">{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
          )}
          <button
            className="header-icon-btn"
            onClick={() => setMode("settings")}
            title="Settings"
          >
            ⚙
          </button>
          <button
            className="header-icon-btn"
            onClick={() => setMode("split")}
            title="Paste and split"
          >
            ✂
          </button>
          <button
            className="header-icon-btn"
            onClick={() => setMode("import")}
            title="Import CSV"
          >
            ↑
          </button>
          <button
            className="add-btn"
            onClick={() => { setEditingEntry(null); setQuickAddPrefill(undefined); setMode("add"); }}
            title="Add entry"
          >
            +
          </button>
        </div>
      </header>

      {hotkeyError && (
        <div className="hotkey-error-banner">
          <span>{hotkeyError}</span>
          <button className="clipboard-banner-dismiss" onClick={() => setHotkeyError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {showClipboardBanner && (
        <div className="clipboard-banner">
          <span className="clipboard-banner-preview">
            Clipboard: "{clipboardText.length > 60 ? clipboardText.slice(0, 60) + "…" : clipboardText}"
          </span>
          <button
            className="clipboard-banner-save"
            onClick={() => {
              setQuickAddPrefill(clipboardText);
              setEditingEntry(null);
              setMode("add");
              setClipboardDismissed(true);
            }}
          >
            Save as entry
          </button>
          <button
            className="clipboard-banner-dismiss"
            onClick={() => setClipboardDismissed(true)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="search-container">
        <SearchBar
          value={query}
          onChange={setQuery}
          focusTrigger={focusTrigger}
          onNavigateDown={navigateDown}
          onNavigateUp={navigateUp}
          onEnter={handleEnter}
          onEscape={handleEscape}
        />
      </div>

      <main className="results-container">
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
                  onOpen={handleOpenOverlay}
                  isFocused={focusedEntryId === entry.id}
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
            <p>No entries yet. Press <strong>+</strong> to add one or <strong>↑</strong> to import a CSV.</p>
          </div>
        )}

        {groups.map((group) => (
          <VerticalGroupComponent
            key={group.verticalId}
            group={group}
            onToggle={() => toggleGroup(group.verticalId)}
            onEdit={handleEditEntry}
            onCopy={handleCopy}
            onOpen={handleOpenOverlay}
            focusedEntryId={focusedEntryId}
          />
        ))}
      </main>

      {overlayEntry && (
        <MacroOverlay
          entry={overlayEntry}
          verticals={verticals}
          onClose={handleCloseOverlay}
          onCopied={handleCopy}
        />
      )}
    </div>
  );
}
