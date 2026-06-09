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
import ResultItem from "./components/ResultItem";

type AppStatus = "loading" | "ready" | "error";
type AppMode = "browse" | "add" | "edit" | "import" | "split" | "settings" | "help" | "favorites" | "notes";
type SortMode = "relevance" | "most-used" | "recently-added" | "a-to-z";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function applyAccent(color: string) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const alpha = isDark ? 0.15 : 0.12;
  document.documentElement.style.setProperty("--color-accent", color);
  document.documentElement.style.setProperty("--color-accent-dim", `rgba(${r},${g},${b},${alpha})`);
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
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [sourceMode, setSourceMode] = useState<"local" | "sync" | undefined>(undefined);
  const [sourceName, setSourceName] = useState<string | undefined>(undefined);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pendingNoteEntry, setPendingNoteEntry] = useState<{ id: string; title: string } | null>(null);
  const [autoHideOnCopy, setAutoHideOnCopy] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [sessionCopies, setSessionCopies] = useState<string[]>([]);
  const [activeVerticalFilter, setActiveVerticalFilter] = useState<string | null>(null);
  const [verticalOrder, setVerticalOrder] = useState<string[]>([]);
  const [pinLimitMsg, setPinLimitMsg] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  const debouncedQuery = useDebounce(query, 120);

  useEffect(() => {
    window.shortpath
      .loadEntries()
      .then(({ entries: e, verticals: v, recents: r, favorites: favs, pinned: pins, fontSize: fs, sourceMode: sm, sourceName: sn, theme: t, accentColor, density, verticalOrder: vo, autoHideOnCopy: ahoc }) => {
        setEntries(e);
        setVerticals(v);
        setRecents(r);
        setFavorites(new Set(favs));
        setPinned(new Set(pins));
        setExpandedGroups(new Set(v.map((vert) => vert.id)));
        setVerticalOrder(vo ?? []);
        setAutoHideOnCopy(ahoc ?? false);
        document.documentElement.style.setProperty("--font-size-base", `${fs}px`);
        document.documentElement.setAttribute("data-theme", t);
        if (accentColor) applyAccent(accentColor);
        if (density === "compact") document.body.setAttribute("data-density", "compact");
        if (sm === null || sm === undefined) {
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

    const unsubscribe = window.shortpath.onStoreUpdated(({ entries: e, verticals: v, recents: r, favorites: favs, pinned: pins }) => {
      setEntries(e);
      setVerticals(v);
      setRecents(r);
      setFavorites(new Set(favs));
      setPinned(new Set(pins));
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        v.forEach((vert) => next.add(vert.id));
        return next;
      });
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
    const unsubUpdate = window.shortpath.onUpdateAvailable((info) => {
      setUpdateInfo(info);
    });
    const unsubDownloaded = window.shortpath.onUpdateDownloaded(() => {
      setUpdateDownloaded(true);
    });
    return () => {
      unsubFocus();
      unsubHotkey();
      unsubSettings();
      unsubUpdate();
      unsubDownloaded();
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
    const isSearching = trimmed.length >= 2;

    let items: { entry: Entry; matches: SearchResult["matches"] }[];

    if (!isSearching) {
      // When not searching, apply sort mode
      let sorted = [...entries];
      const effectiveSort = sortMode === "relevance" ? "most-used" : sortMode;
      if (effectiveSort === "most-used") {
        sorted.sort((a, b) => (b.copyCount ?? 0) - (a.copyCount ?? 0));
      } else if (effectiveSort === "recently-added") {
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (effectiveSort === "a-to-z") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      }
      items = sorted.map((entry) => ({ entry, matches: [] }));
    } else if (fuse) {
      const fuseResults: FuseResult<Entry>[] = fuse.search(trimmed);
      let resultItems = fuseResults.map((r) => ({
        entry: r.item,
        matches:
          r.matches?.map((m) => ({
            key: m.key ?? "",
            indices: [...m.indices] as [number, number][],
          })) ?? [],
      }));
      // Apply non-relevance sort during search too
      if (sortMode === "most-used") {
        resultItems.sort((a, b) => (b.entry.copyCount ?? 0) - (a.entry.copyCount ?? 0));
      } else if (sortMode === "recently-added") {
        resultItems.sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt));
      } else if (sortMode === "a-to-z") {
        resultItems.sort((a, b) => a.entry.title.localeCompare(b.entry.title));
      }
      items = resultItems;
    } else {
      return [];
    }

    // Filter by active vertical tab
    if (activeVerticalFilter) {
      items = items.filter((i) => i.entry.vertical === activeVerticalFilter);
    }

    const byVertical = new Map<string, typeof items>();
    for (const item of items) {
      const vid = item.entry.vertical;
      if (!byVertical.has(vid)) byVertical.set(vid, []);
      byVertical.get(vid)!.push(item);
    }

    const result: Array<{ verticalId: string; label: string; hitCount: number; results: SearchResult[] }> = [];

    // Render verticals in custom order (if set), then any remaining
    const orderedVerticals = verticalOrder.length > 0
      ? [
          ...verticalOrder.map(id => verticals.find(v => v.id === id)).filter(Boolean) as Vertical[],
          ...verticals.filter(v => !verticalOrder.includes(v.id)),
        ]
      : verticals;

    for (const v of orderedVerticals) {
      const groupItems = byVertical.get(v.id);
      const hasEntries = (groupItems?.length ?? 0) > 0;
      const hasSubFolders = (v.subFolders?.length ?? 0) > 0;
      // When searching, only show verticals with matching results.
      // When browsing, also show verticals that have sub-folders defined (even if empty).
      if (!hasEntries && (isSearching || !hasSubFolders)) continue;
      result.push({
        verticalId: v.id,
        label: v.label,
        hitCount: groupItems?.length ?? 0,
        results: (groupItems ?? []).map((i) => ({ entry: i.entry, matches: i.matches })),
      });
    }

    for (const [vid, groupItems] of byVertical) {
      if (orderedVerticals.find((v) => v.id === vid)) continue;
      result.push({
        verticalId: vid,
        label: verticalMap.get(vid)?.label ?? vid,
        hitCount: groupItems.length,
        results: groupItems.map((i) => ({ entry: i.entry, matches: i.matches })),
      });
    }

    return result;
  }, [entries, verticals, debouncedQuery, fuse, sortMode, activeVerticalFilter, verticalOrder]);

  const groups = useMemo((): VerticalGroup[] => {
    return rawGroups.map((g) => ({ ...g, expanded: expandedGroups.has(g.verticalId) }));
  }, [rawGroups, expandedGroups]);

  const recentEntries = useMemo(
    () => recents.map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [recents, entries]
  );

  const pinnedEntries = useMemo(
    () => Array.from(pinned).map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [pinned, entries]
  );

  const sessionCopiedEntries = useMemo(
    () => sessionCopies.map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [sessionCopies, entries]
  );

  const flatResults = useMemo((): Entry[] => {
    const searching = debouncedQuery.trim().length >= 2;
    if (!searching && recentEntries.length > 0) return recentEntries;
    return groups.flatMap((g) => (g.expanded ? g.results.map((r) => r.entry) : []));
  }, [groups, recentEntries, debouncedQuery]);

  useEffect(() => {
    setFocusedEntryId(null);
  }, [debouncedQuery]);

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
    setSessionCopies((prev) => [entryId, ...prev.filter((id) => id !== entryId)].slice(0, 5));
    const entry = entries.find((e) => e.id === entryId);
    if (entry?.source === "local") {
      void window.shortpath.incrementCopyCount(entryId);
    }
    if (autoHideOnCopy) {
      setTimeout(() => void window.shortpath.hideWindow(), 300);
    }
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

  // Cycle the vertical filter tab
  const orderedTabVerticals = useMemo(() => {
    if (verticalOrder.length > 0) {
      return [
        ...verticalOrder.map(id => verticals.find(v => v.id === id)).filter(Boolean) as Vertical[],
        ...verticals.filter(v => !verticalOrder.includes(v.id)),
      ];
    }
    return verticals;
  }, [verticals, verticalOrder]);

  function cycleVerticalTab(direction: 1 | -1) {
    const tabs = [null, ...orderedTabVerticals.map(v => v.id)];
    const currentIdx = tabs.indexOf(activeVerticalFilter);
    const nextIdx = (currentIdx + direction + tabs.length) % tabs.length;
    setActiveVerticalFilter(tabs[nextIdx]);
  }

  function handleClipboardIconClick() {
    setQuickAddPrefill(clipboardText!);
    setEditingEntry(null);
    setMode("add");
    setClipboardDismissed(true);
  }

  function handleReorderEntry(entryId: string, direction: "up" | "down") {
    void window.shortpath.reorderEntry(entryId, direction);
  }

  function handleToggleFavorite(id: string) {
    void window.shortpath.toggleFavorite(id);
  }

  async function handleTogglePin(id: string) {
    const result = await window.shortpath.togglePin(id);
    if (result.limitReached) {
      setPinLimitMsg(true);
      setTimeout(() => setPinLimitMsg(false), 3000);
    }
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

  // Window-level Esc and Tab handling
  useEffect(() => {
    function onWindowKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const inInput = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (inInput) return;
        if (overlayEntry) {
          setOverlayEntry(null);
        } else if (focusedEntryId) {
          setFocusedEntryId(null);
        } else if (query) {
          setQuery("");
        } else {
          void window.shortpath.hideWindow();
        }
        return;
      }

      if (e.key === "Tab" && !inInput && mode === "browse") {
        e.preventDefault();
        cycleVerticalTab(e.shiftKey ? -1 : 1);
      }
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [overlayEntry, focusedEntryId, query, mode, activeVerticalFilter, orderedTabVerticals]);

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
          defaultVerticalId={mode === "add" && !editingEntry ? (activeVerticalFilter ?? undefined) : undefined}
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
          entries={entries}
          verticalOrder={verticalOrder}
          onVerticalOrderChange={(order) => {
            setVerticalOrder(order);
            void window.shortpath.setVerticalOrder(order);
          }}
          autoHideOnCopy={autoHideOnCopy}
          onAutoHideOnCopyChange={(val) => {
            setAutoHideOnCopy(val);
            void window.shortpath.setAutoHideOnCopy(val);
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
            isPinned={pinned.has(overlayEntry.id)}
            onTogglePin={() => void handleTogglePin(overlayEntry.id)}
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
        </div>
      </header>

      {hotkeyError && (
        <div className="hotkey-error-banner">
          <span>{hotkeyError}</span>
          <button className="clipboard-banner-dismiss" onClick={() => setHotkeyError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {updateInfo && (
        <div className="update-banner">
          <span className="update-banner-text">Version {updateInfo.version} is available.</span>
          {updateDownloaded ? (
            <button className="update-banner-link" onClick={() => void window.shortpath.installUpdate()}>Restart &amp; Install</button>
          ) : (
            <button className="update-banner-link" onClick={() => void window.shortpath.downloadUpdate()}>Download</button>
          )}
          <button className="update-banner-dismiss" onClick={() => setUpdateInfo(null)} aria-label="Dismiss">✕</button>
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

      {/* Vertical filter — tabs up to 5, dropdown beyond */}
      {orderedTabVerticals.length > 1 && (
        orderedTabVerticals.length > 5 ? (
          <div className="vertical-filter-select-wrap">
            <select
              className={`vertical-filter-select${activeVerticalFilter ? " has-filter" : ""}`}
              value={activeVerticalFilter ?? ""}
              onChange={(e) => setActiveVerticalFilter(e.target.value || null)}
            >
              <option value="">All</option>
              {orderedTabVerticals.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="vertical-tabs">
            <button
              className={`vtab${activeVerticalFilter === null ? " active" : ""}`}
              onClick={() => setActiveVerticalFilter(null)}
            >
              All
            </button>
            {orderedTabVerticals.map((v) => (
              <button
                key={v.id}
                className={`vtab${activeVerticalFilter === v.id ? " active" : ""}`}
                onClick={() => setActiveVerticalFilter(activeVerticalFilter === v.id ? null : v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )
      )}

      {/* Sort control */}
      <div className="sort-bar">
        <span className="sort-label">Sort:</span>
        <select
          className="sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <option value="relevance">{isSearching ? "Relevance" : "Most used"}</option>
          <option value="most-used">Most used</option>
          <option value="recently-added">Recently added</option>
          <option value="a-to-z">A to Z</option>
        </select>
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

        {/* Pinned section — only when not searching */}
        {!isSearching && pinnedEntries.length > 0 && (
          <div className="pinned-section">
            <div className="section-header-row">
              <span className="section-header-label">Pinned</span>
            </div>
            {pinLimitMsg && (
              <div className="pin-limit-msg">Unpin an entry to pin this one (max 8).</div>
            )}
            <ul className="result-list">
              {pinnedEntries.map((entry) => (
                <ResultItem
                  key={entry.id}
                  result={{ entry, matches: [] }}
                  onEdit={handleEditEntry}
                  onCopy={handleCopy}
                  onOpen={handleOpenOverlay}
                  isFocused={focusedEntryId === entry.id}
                  isFavorite={favorites.has(entry.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isPinned={true}
                  onTogglePin={(id) => void handleTogglePin(id)}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Recent copies section — only when not searching */}
        {!isSearching && sessionCopiedEntries.length > 0 && (
          <div className="recent-section">
            <div className="section-header-row">
              <span className="section-header-label">Recent</span>
            </div>
            <ul className="result-list">
              {sessionCopiedEntries.map((entry) => (
                <ResultItem
                  key={entry.id}
                  result={{ entry, matches: [] }}
                  onEdit={handleEditEntry}
                  onCopy={handleCopy}
                  onOpen={handleOpenOverlay}
                  isFocused={focusedEntryId === entry.id}
                  isFavorite={favorites.has(entry.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isPinned={pinned.has(entry.id)}
                  onTogglePin={(id) => void handleTogglePin(id)}
                />
              ))}
            </ul>
          </div>
        )}

        {pinLimitMsg && isSearching && (
          <div className="pin-limit-msg" style={{ padding: "4px 14px 6px" }}>
            Unpin an entry to pin this one (max 8).
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
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
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
              pinned={pinned}
              onTogglePin={(id) => void handleTogglePin(id)}
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
          isPinned={pinned.has(overlayEntry.id)}
          onTogglePin={() => void handleTogglePin(overlayEntry.id)}
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
