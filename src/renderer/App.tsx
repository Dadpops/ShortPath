import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { Entry, Vertical, VerticalGroup, SearchResult } from "@shared/types";
import SearchBar from "./components/SearchBar";
import VerticalGroupComponent from "./components/VerticalGroup";
import SupportToolsGroup from "./components/SupportToolsGroup";
import EntryForm from "./components/EntryForm";
import ImportScreen from "./components/ImportScreen";
import SplitImport from "./components/SplitImport";
import SettingsScreen from "./components/SettingsScreen";
import HelpPanel from "./components/HelpPanel";
import MacroOverlay from "./components/MacroOverlay";
import FavoritesView from "./components/FavoritesView";
import NotesView from "./components/NotesView";
import RecentsDropdown from "./components/RecentsDropdown";

type AppStatus = "loading" | "ready" | "error";
type AppMode = "browse" | "add" | "edit" | "import" | "split" | "settings" | "help" | "favorites" | "notes";

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
  const [animating, setAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sourceMode, setSourceMode] = useState<"local" | "sync" | undefined>(undefined);
  const [sourceName, setSourceName] = useState<string | undefined>(undefined);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pendingNoteEntry, setPendingNoteEntry] = useState<{ id: string; title: string } | null>(null);

  const debouncedQuery = useDebounce(query, 120);

  useEffect(() => {
    window.shortpath
      .loadEntries()
      .then(({ entries: e, verticals: v, recents: r, favorites: favs, fontSize: fs, sourceMode: sm, sourceName: sn, theme: t }) => {
        setEntries(e);
        setVerticals(v);
        setRecents(r);
        setFavorites(new Set(favs));
        setExpandedGroups(new Set(v.map((vert) => vert.id)));
        document.documentElement.style.setProperty("--font-size-base", `${fs}px`);
        document.documentElement.setAttribute("data-theme", t);
        if (sm === null || sm === undefined) {
          // Auto-default to local mode; no setup screen.
          setSourceMode("local");
          void window.shortpath.saveSourceMode("local");
        } else {
          setSourceMode(sm);
          setSourceName(sn ?? undefined);
        }
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load entries:", err);
        setStatus("error");
      });

    const unsubscribe = window.shortpath.onStoreUpdated(({ entries: e, verticals: v, recents: r, favorites: favs }) => {
      setEntries(e);
      setVerticals(v);
      setRecents(r);
      setFavorites(new Set(favs));
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
      setAnimating(true);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => setAnimating(false), 250);
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

  const rawGroups = useMemo(() => {
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

    const result: Array<{ verticalId: string; label: string; hitCount: number; results: SearchResult[] }> = [];

    for (const v of verticals) {
      const groupItems = byVertical.get(v.id);
      if (!groupItems?.length) continue;
      result.push({
        verticalId: v.id,
        label: v.label,
        hitCount: groupItems.length,
        results: groupItems.map((i) => ({ entry: i.entry, matches: i.matches })),
      });
    }

    for (const [vid, groupItems] of byVertical) {
      if (verticals.find((v) => v.id === vid)) continue;
      result.push({
        verticalId: vid,
        label: verticalMap.get(vid)?.label ?? vid,
        hitCount: groupItems.length,
        results: groupItems.map((i) => ({ entry: i.entry, matches: i.matches })),
      });
    }

    return result;
  }, [entries, verticals, debouncedQuery, fuse]);

  const groups = useMemo((): VerticalGroup[] => {
    return rawGroups.map((g) => ({ ...g, expanded: expandedGroups.has(g.verticalId) }));
  }, [rawGroups, expandedGroups]);

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

  function handleClipboardIconClick() {
    setQuickAddPrefill(clipboardText!);
    setEditingEntry(null);
    setMode("add");
    setClipboardDismissed(true);
  }

  function handleReorderEntry(entryId: string, direction: "up" | "down") {
    void window.shortpath.reorderEntry(entryId, direction);
    // store-updated push from main will refresh entries
  }

  function handleToggleFavorite(id: string) {
    void window.shortpath.toggleFavorite(id);
    // store-updated push from main will refresh favorites
  }

  function handleGoHome() {
    setMode("browse");
    setQuery("");
  }

  function handleEditFromOverlay(entry: Entry) {
    setOverlayEntry(null);
    handleEditEntry(entry);
  }

  async function handleDuplicateEntry(entry: Entry) {
    const result = await window.shortpath.createEntry({
      vertical: entry.vertical,
      title: entry.title,
      body: entry.body,
      link: entry.link,
      tags: entry.tags,
      type: entry.type,
    });
    setEntries((prev) => [...prev, result.entry]);
    setVerticals(result.verticals);
    setOverlayEntry(null);
    setEditingEntry(result.entry);
    setMode("edit");
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
    } else if (query) {
      setQuery("");
    } else {
      void window.shortpath.hideWindow();
    }
  }

  // Window-level Esc: fires when focus is not inside a text input (those call
  // handleEscape via onEscape prop on SearchBar). MacroOverlay's capture listener
  // intercepts Esc first when the overlay is open, so no double-handling occurs.
  useEffect(() => {
    function onWindowKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
      if (overlayEntry) {
        setOverlayEntry(null);
      } else if (focusedEntryId) {
        setFocusedEntryId(null);
      } else if (query) {
        setQuery("");
      } else {
        void window.shortpath.hideWindow();
      }
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [overlayEntry, focusedEntryId, query]);

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

  const totalHits = rawGroups.reduce((sum, g) => sum + g.hitCount, 0);
  const isSearching = debouncedQuery.trim().length >= 2;

  const shellClass = `app-shell${animating ? " animate-in" : ""}`;

  if (status === "loading") {
    return <div className={shellClass}><div className="status-message">Loading...</div></div>;
  }

  if (status === "error") {
    return (
      <div className={shellClass}>
        <div className="status-message error">Failed to load data. Check the app logs.</div>
      </div>
    );
  }

  if (mode === "add" || mode === "edit") {
    return (
      <div className={shellClass}>
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
      <div className={shellClass}>
        <ImportScreen onComplete={handleImportComplete} onCancel={() => setMode("browse")} />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div className={shellClass}>
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
      <div className={shellClass}>
        <SettingsScreen
          onClose={() => setMode("browse")}
          onNavigate={(target) => { setMode(target); }}
          verticals={verticals}
          onVerticalRenamed={(id, newLabel) => {
            setVerticals((prev) => prev.map((v) => (v.id === id ? { ...v, label: newLabel } : v)));
          }}
          onVerticalAdded={(v) => {
            setVerticals((prev) => [...prev, v]);
            setExpandedGroups((prev) => new Set([...prev, v.id]));
          }}
        />
      </div>
    );
  }

  if (mode === "help") {
    return (
      <div className={shellClass}>
        <HelpPanel onClose={() => setMode("browse")} />
      </div>
    );
  }

  if (mode === "favorites") {
    return (
      <div className={shellClass}>
        <FavoritesView
          entries={entries}
          favorites={favorites}
          onBack={handleGoHome}
          onEdit={handleEditEntry}
          onCopy={handleCopy}
          onOpen={(entry) => { setMode("browse"); setOverlayEntry(entry); }}
          onToggleFavorite={handleToggleFavorite}
        />
        {overlayEntry && (
          <MacroOverlay
            entry={overlayEntry}
            verticals={verticals}
            onClose={handleCloseOverlay}
            onCopied={handleCopy}
            isFavorite={favorites.has(overlayEntry.id)}
            onToggleFavorite={() => handleToggleFavorite(overlayEntry.id)}
            onEdit={handleEditFromOverlay}
            onDuplicate={handleDuplicateEntry}
            onAddNote={() => {
              setPendingNoteEntry({ id: overlayEntry.id, title: overlayEntry.title });
              setOverlayEntry(null);
              setMode("notes");
            }}
          />
        )}
      </div>
    );
  }

  if (mode === "notes") {
    return (
      <div className={shellClass}>
        <NotesView
          onBack={() => { setPendingNoteEntry(null); setMode("browse"); }}
          initialEntry={pendingNoteEntry ?? undefined}
        />
      </div>
    );
  }

  const hasClipboard = !!clipboardText && !clipboardDismissed;

  return (
    <div className={shellClass}>
      <header className="app-header">
        <button className="app-path-btn" onClick={handleGoHome} title="Go home">
          shortpath / {sourceMode === "sync" && sourceName ? sourceName : "Local"}
        </button>
        <div className="header-actions">
          {isSearching && totalHits > 0 && (
            <span className="app-hit-summary">{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
          )}
          {hasClipboard && (
            <button
              className="header-icon-btn clipboard-indicator"
              onClick={handleClipboardIconClick}
              title="Save clipboard as entry"
            >
              ⎘
            </button>
          )}
          <button className="header-icon-btn" onClick={() => setMode("notes")} title="Notes">✎</button>
          <button className="header-icon-btn" onClick={() => setMode("favorites")} title="Favorites">☆</button>
          <button className="header-icon-btn" onClick={() => setMode("help")} title="Help">?</button>
          <button className="header-icon-btn" onClick={() => setMode("settings")} title="Settings">⚙</button>
          <button className="header-icon-btn" onClick={() => void window.shortpath.minimizeWindow()} title="Minimize">−</button>
          <button className="header-icon-btn" onClick={() => void window.shortpath.hideWindow()} title="Close">✕</button>
        </div>
      </header>

      {hotkeyError && (
        <div className="hotkey-error-banner">
          <span>{hotkeyError}</span>
          <button className="clipboard-banner-dismiss" onClick={() => setHotkeyError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="search-section">
        <div className="search-container">
          <SearchBar
            value={query}
            onChange={setQuery}
            focusTrigger={focusTrigger}
            onNavigateDown={navigateDown}
            onNavigateUp={navigateUp}
            onEnter={handleEnter}
            onEscape={handleEscape}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
        {isSearchFocused && !isSearching && recentEntries.length > 0 && (
          <RecentsDropdown
            entries={recentEntries}
            focusedEntryId={focusedEntryId}
            favorites={favorites}
            onOpen={handleOpenOverlay}
            onEdit={handleEditEntry}
            onCopy={handleCopy}
            onToggleFavorite={handleToggleFavorite}
            onMouseDown={(e) => e.preventDefault()}
          />
        )}
      </div>

      <main className="results-container">

        {isSearching && groups.length === 0 && (
          <div className="empty-state">
            <p>No matches for "{debouncedQuery}" — try a different keyword.</p>
          </div>
        )}

        {!isSearching && entries.length === 0 && (
          <div className="empty-state">
            <p>No entries yet. Press <strong>+</strong> to add one or open <strong>⚙ Settings</strong> to import a CSV.</p>
          </div>
        )}

        {groups.map((group) =>
          group.verticalId === "support-tools" ? (
            <SupportToolsGroup
              key={group.verticalId}
              group={group}
              onToggle={() => toggleGroup(group.verticalId)}
              onEdit={handleEditEntry}
              onCopy={handleCopy}
              onReorder={handleReorderEntry}
              isSearching={isSearching}
            />
          ) : (
            <VerticalGroupComponent
              key={group.verticalId}
              group={group}
              subFolders={verticals.find((v) => v.id === group.verticalId)?.subFolders}
              onToggle={() => toggleGroup(group.verticalId)}
              onEdit={handleEditEntry}
              onCopy={handleCopy}
              onOpen={handleOpenOverlay}
              focusedEntryId={focusedEntryId}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )
        )}
      </main>

      <button
        className="fab-add"
        onClick={() => { setEditingEntry(null); setQuickAddPrefill(undefined); setMode("add"); }}
        title="Add entry"
      >
        +
      </button>

      {overlayEntry && (
        <MacroOverlay
          entry={overlayEntry}
          verticals={verticals}
          onClose={handleCloseOverlay}
          onCopied={handleCopy}
          isFavorite={favorites.has(overlayEntry.id)}
          onToggleFavorite={() => handleToggleFavorite(overlayEntry.id)}
          onEdit={handleEditFromOverlay}
          onDuplicate={handleDuplicateEntry}
          onAddNote={() => {
            setPendingNoteEntry({ id: overlayEntry.id, title: overlayEntry.title });
            setOverlayEntry(null);
            setMode("notes");
          }}
        />
      )}
    </div>
  );
}
