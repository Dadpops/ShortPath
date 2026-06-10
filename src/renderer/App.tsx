import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import type { Entry, Vertical, VerticalGroup, SearchResult, CapturePayload } from "@shared/types";
import SearchBar from "./components/SearchBar";
import VerticalGroupComponent from "./components/VerticalGroup";
import SupportToolsGroup from "./components/SupportToolsGroup";
import EntryForm from "./components/EntryForm";
import ImportScreen from "./components/ImportScreen";
import SplitImport from "./components/SplitImport";
import SettingsScreen from "./components/SettingsScreen";
import KeyboardPanel from "./components/KeyboardPanel";
import MacroOverlay from "./components/MacroOverlay";
import FavoritesView from "./components/FavoritesView";
import NotesView from "./components/NotesView";
import RecentsDropdown from "./components/RecentsDropdown";
import ResultItem from "./components/ResultItem";
import ExportSelectScreen from "./components/ExportSelectScreen";

type AppStatus = "loading" | "ready" | "error";
type AppMode = "browse" | "add" | "edit" | "import" | "split" | "settings" | "keyboard" | "favorites" | "notes" | "export-select";
type SortMode = "relevance" | "most-used" | "recently-used" | "recently-added" | "a-to-z";

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

const FONT_FAMILIES: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
  rounded: '"Trebuchet MS", "Gill Sans", Optima, sans-serif',
};

function applyFontFamily(key: string) {
  document.documentElement.style.setProperty("--font-sans", FONT_FAMILIES[key] ?? FONT_FAMILIES.system);
}

const DEFAULT_SHORTCUTS: Record<string, string> = {
  notes: "Alt+N",
  keyboard: "Alt+K",
  help: "Alt+H",
  settings: "Alt+S",
  newEntry: "Ctrl+N",
  cycleTab: "Tab",
};

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
  const [activeSource, setActiveSource] = useState<string>(() => localStorage.getItem("sp_active_source") ?? "local");
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const sourcePickerRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pendingNoteEntry, setPendingNoteEntry] = useState<{ id: string; title: string } | null>(null);
  const [autoHideOnCopy, setAutoHideOnCopy] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [currentHotkey, setCurrentHotkey] = useState("CommandOrControl+Shift+Space");
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [queryHistoryIdx, setQueryHistoryIdx] = useState(-1);
  const [activeVerticalFilter, setActiveVerticalFilter] = useState<string | null>(null);
  const [verticalOrder, setVerticalOrder] = useState<string[]>([]);
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [capturePayload, setCapturePayload] = useState<CapturePayload | null>(null);
  const [syncSources, setSyncSources] = useState<Array<{ id: string; path: string; label: string }>>([]);
  const [easterEgg, setEasterEgg] = useState(false);
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());
  const [customShortcuts, setCustomShortcuts] = useState<Record<string, string | null>>({});

  const debouncedQuery = useDebounce(query, 120);

  useEffect(() => {
    window.shortpath
      .loadEntries()
      .then(({ entries: e, verticals: v, recents: r, favorites: favs, pinned: pins, fontSize: fs, theme: t, accentColor, density, verticalOrder: vo, autoHideOnCopy: ahoc, alwaysOnTop: aot }) => {
        setEntries(e);
        setVerticals(v);
        setRecents(r);
        setFavorites(new Set(favs));
        setPinned(new Set(pins));
        setExpandedGroups(new Set(v.map((vert) => vert.id)));
        setVerticalOrder(vo ?? []);
        setAutoHideOnCopy(ahoc ?? false);
        setAlwaysOnTop(aot ?? false);
        document.documentElement.style.setProperty("--font-size-base", `${fs}px`);
        document.documentElement.setAttribute("data-theme", t);
        if (accentColor) applyAccent(accentColor);
        if (density === "compact") document.body.setAttribute("data-density", "compact");
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load entries:", err);
        setStatus("error");
      });

    void window.shortpath.getSyncStatus().then((status) => {
      setSyncSources(status.sources);
    });
    void window.shortpath.getSettings().then((s) => {
      setCurrentHotkey(s.hotkey);
      applyFontFamily(s.fontFamily ?? "system");
      setCustomShortcuts(s.customShortcuts ?? {});
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
    const unsubCapture = window.shortpath.onCaptureEntry((payload) => {
      setCapturePayload(payload);
      setEditingEntry(null);
      setQuickAddPrefill(undefined);
      setMode("add");
    });
    const unsubSync = window.shortpath.onSyncRefreshed(() => {
      void window.shortpath.getSyncStatus().then((status) => setSyncSources(status.sources));
    });
    return () => {
      unsubFocus();
      unsubHotkey();
      unsubSettings();
      unsubUpdate();
      unsubDownloaded();
      unsubCapture();
      unsubSync();
    };
  }, []);

  // Refresh sync sources and hotkey when returning to browse (e.g. after rename in Settings)
  useEffect(() => {
    if (mode === "browse") {
      void window.shortpath.getSyncStatus().then((s) => setSyncSources(s.sources));
      void window.shortpath.getSettings().then((s) => setCurrentHotkey(s.hotkey));
    }
  }, [mode]);

  // Validate activeSource whenever syncSources update — fall back to "local" if source was removed
  useEffect(() => {
    if (activeSource !== "local" && activeSource !== "all") {
      if (!syncSources.find(s => s.id === activeSource)) {
        setActiveSource("local");
        localStorage.setItem("sp_active_source", "local");
      }
    }
  }, [syncSources, activeSource]);

  // Close source picker when clicking outside
  useEffect(() => {
    if (!sourcePickerOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (sourcePickerRef.current && !sourcePickerRef.current.contains(e.target as Node)) {
        setSourcePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [sourcePickerOpen]);

  function getSourceLabel(src: { id: string; path: string; label: string }): string {
    return src.label || src.path.split(/[/\\]/).pop() || "Sync";
  }

  function getActiveSourceDisplayLabel(): string {
    if (activeSource === "local") return "Local";
    if (activeSource === "all") return "All";
    const src = syncSources.find(s => s.id === activeSource);
    return src ? getSourceLabel(src) : "Local";
  }

  function handleSetActiveSource(src: string) {
    setActiveSource(src);
    localStorage.setItem("sp_active_source", src);
    setSourcePickerOpen(false);
  }

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
    const isAllMode = activeSource === "all";

    let items: { entry: Entry; matches: SearchResult["matches"] }[];

    function applySortToItems(arr: typeof items, mode: SortMode) {
      const effectiveMode = mode === "relevance" ? "most-used" : mode;
      if (effectiveMode === "most-used") arr.sort((a, b) => (b.entry.copyCount ?? 0) - (a.entry.copyCount ?? 0));
      else if (effectiveMode === "recently-used") arr.sort((a, b) => (b.entry.lastCopiedAt ?? "").localeCompare(a.entry.lastCopiedAt ?? ""));
      else if (effectiveMode === "recently-added") arr.sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt));
      else if (effectiveMode === "a-to-z") arr.sort((a, b) => a.entry.title.localeCompare(b.entry.title));
    }

    if (!isSearching) {
      items = entries.map((entry) => ({ entry, matches: [] as SearchResult["matches"] }));
      applySortToItems(items, sortMode);
    } else if (fuse) {
      const fuseResults: FuseResult<Entry>[] = fuse.search(trimmed);
      const resultItems = fuseResults.map((r) => ({
        entry: r.item,
        matches:
          r.matches?.map((m) => ({
            key: m.key ?? "",
            indices: [...m.indices] as [number, number][],
          })) ?? [],
      }));
      if (sortMode !== "relevance") applySortToItems(resultItems, sortMode);
      items = resultItems;
    } else {
      return [];
    }

    // Filter by active vertical tab
    if (activeVerticalFilter) {
      items = items.filter((i) => i.entry.vertical === activeVerticalFilter);
    }

    // Filter by source (non-"all" modes); sample entries appear alongside local
    if (activeSource === "local") {
      items = items.filter(i => i.entry.source === "local" || i.entry.source === "sample");
    } else if (!isAllMode) {
      items = items.filter(i => i.entry.syncSource === activeSource);
    }

    const getSrcKey = (entry: Entry) =>
      entry.source === "local" ? "local" : (entry.syncSource ?? "unknown");
    const getGroupKey = (entry: Entry) =>
      isAllMode ? `${getSrcKey(entry)}::${entry.vertical}` : entry.vertical;

    const byGroup = new Map<string, typeof items>();
    for (const item of items) {
      const key = getGroupKey(item.entry);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(item);
    }

    const result: Array<{ verticalId: string; label: string; hitCount: number; results: SearchResult[] }> = [];

    const orderedVerticals = verticalOrder.length > 0
      ? [
          ...verticalOrder.map(id => verticals.find(v => v.id === id)).filter(Boolean) as Vertical[],
          ...verticals.filter(v => !verticalOrder.includes(v.id)),
        ]
      : verticals;

    if (!isAllMode) {
      for (const v of orderedVerticals) {
        if (activeVerticalFilter && v.id !== activeVerticalFilter) continue;
        const groupItems = byGroup.get(v.id);
        if (!groupItems || groupItems.length === 0) continue;
        result.push({
          verticalId: v.id,
          label: v.label,
          hitCount: groupItems.length,
          results: groupItems.map(i => ({ entry: i.entry, matches: i.matches })),
        });
      }
      for (const [key, groupItems] of byGroup) {
        if (orderedVerticals.find(v => v.id === key)) continue;
        result.push({
          verticalId: key,
          label: verticalMap.get(key)?.label ?? key,
          hitCount: groupItems.length,
          results: groupItems.map(i => ({ entry: i.entry, matches: i.matches })),
        });
      }
    } else {
      // All mode: Local groups first, then sync sources in configured order
      const sourceOrder = ["local", ...syncSources.map(s => s.id)];
      for (const srcKey of sourceOrder) {
        for (const v of orderedVerticals) {
          const compositeKey = `${srcKey}::${v.id}`;
          const groupItems = byGroup.get(compositeKey);
          if (!groupItems || groupItems.length === 0) continue;
          result.push({
            verticalId: compositeKey,
            label: v.label,
            hitCount: groupItems.length,
            results: groupItems.map(i => ({ entry: i.entry, matches: i.matches })),
          });
        }
      }
      // Any source+vertical combos not covered above
      for (const [key, groupItems] of byGroup) {
        const sep = key.indexOf("::");
        if (sep === -1) continue;
        const srcKey = key.slice(0, sep);
        const vid = key.slice(sep + 2);
        if (sourceOrder.includes(srcKey) && orderedVerticals.find(v => v.id === vid)) continue;
        result.push({
          verticalId: key,
          label: verticalMap.get(vid)?.label ?? vid,
          hitCount: groupItems.length,
          results: groupItems.map(i => ({ entry: i.entry, matches: i.matches })),
        });
      }
    }

    return result;
  }, [entries, verticals, debouncedQuery, fuse, sortMode, activeVerticalFilter, verticalOrder, activeSource, syncSources]);

  const groups = useMemo((): VerticalGroup[] => {
    return rawGroups.map((g) => {
      const plainId = g.verticalId.includes("::") ? g.verticalId.split("::")[1] : g.verticalId;
      return { ...g, expanded: expandedGroups.has(g.verticalId) || expandedGroups.has(plainId) };
    });
  }, [rawGroups, expandedGroups]);

  const recentEntries = useMemo(
    () => recents.map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [recents, entries]
  );

  const pinnedEntries = useMemo(
    () => Array.from(pinned).map((id) => entries.find((e) => e.id === id)).filter(Boolean) as Entry[],
    [pinned, entries]
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

  function toggleSource(srcKey: string) {
    setCollapsedSources((prev) => {
      const next = new Set(prev);
      next.has(srcKey) ? next.delete(srcKey) : next.add(srcKey);
      return next;
    });
  }

  function handleEditEntry(entry: Entry) {
    setEditingEntry(entry);
    setMode("edit");
  }

  function handleCopy(entryId: string) {
    setRecents((prev) => [entryId, ...prev.filter((id) => id !== entryId)].slice(0, 10));
    void window.shortpath.incrementCopyCount(entryId);
    if (autoHideOnCopy) {
      setTimeout(() => void window.shortpath.hideWindow(), 300);
    }
  }

  function sc(action: string): string | null {
    if (action in customShortcuts) return customShortcuts[action];
    return DEFAULT_SHORTCUTS[action] ?? null;
  }

  function matchesShortcut(e: KeyboardEvent, combo: string | null): boolean {
    if (!combo) return false;
    if (combo === "Tab") return e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    const parts = combo.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const needsCtrl = parts.some(p => ["ctrl", "control", "commandorcontrol"].includes(p));
    const needsAlt = parts.includes("alt");
    const needsShift = parts.includes("shift");
    return (
      !!(e.ctrlKey || e.metaKey) === needsCtrl &&
      e.altKey === needsAlt &&
      e.shiftKey === needsShift &&
      e.key.toLowerCase() === key
    );
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
    if (flatResults.length === 0) {
      handleSearchArrowUp();
      return;
    }
    if (!focusedEntryId) {
      if (handleSearchArrowUp()) return;
    }
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
    await window.shortpath.togglePin(id);
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
    if (query.trim() === "shrekisloveshrekislife") {
      setEasterEgg(true);
      return;
    }
    const trimmed = query.trim();
    if (trimmed && trimmed.length >= 2) {
      setQueryHistory((prev) => [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 10));
      setQueryHistoryIdx(-1);
    }
    if (focusedEntryId) {
      const entry = flatResults.find((e) => e.id === focusedEntryId);
      if (entry) setOverlayEntry(entry);
    }
  }

  function handleSearchArrowUp() {
    if (queryHistory.length === 0) return false;
    const nextIdx = Math.min(queryHistoryIdx + 1, queryHistory.length - 1);
    setQueryHistoryIdx(nextIdx);
    setQuery(queryHistory[nextIdx]);
    return true;
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

      if (!inInput && mode === "browse" && matchesShortcut(e, sc("cycleTab"))) {
        e.preventDefault();
        cycleVerticalTab(e.shiftKey ? -1 : 1);
        return;
      }

      if (mode === "browse" && matchesShortcut(e, sc("newEntry"))) {
        e.preventDefault();
        setEditingEntry(null);
        setQuickAddPrefill(undefined);
        setMode("add");
        return;
      }

      if (!inInput) {
        if (matchesShortcut(e, sc("notes"))) { e.preventDefault(); setMode("notes"); return; }
        if (matchesShortcut(e, sc("keyboard"))) { e.preventDefault(); setMode("keyboard"); return; }
        if (matchesShortcut(e, sc("help"))) { e.preventDefault(); void window.shortpath.openHelpWindow(); return; }
        if (matchesShortcut(e, sc("settings"))) { e.preventDefault(); setMode("settings"); return; }
      }
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [overlayEntry, focusedEntryId, query, mode, activeVerticalFilter, orderedTabVerticals, customShortcuts]);

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
    setCapturePayload(null);
  }

  function handleFormDelete() {
    if (editingEntry) {
      setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
      setRecents((prev) => prev.filter((id) => id !== editingEntry.id));
    }
    setMode("browse");
    setEditingEntry(null);
    setQuickAddPrefill(undefined);
    setCapturePayload(null);
  }

  function handleFormCancel() {
    setMode("browse");
    setEditingEntry(null);
    setQuickAddPrefill(undefined);
    setCapturePayload(null);
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
          allEntries={entries}
          onSave={handleFormSave}
          onDelete={mode === "edit" ? handleFormDelete : undefined}
          onCancel={handleFormCancel}
          quickAdd={mode === "add" && !editingEntry}
          prefillBody={quickAddPrefill}
          defaultVerticalId={mode === "add" && !editingEntry ? (activeVerticalFilter ?? undefined) : undefined}
          capturePayload={capturePayload ?? undefined}
        />
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className={shellClass}>
        <ImportScreen onComplete={handleImportComplete} onCancel={() => setMode("browse")} existingEntries={entries} verticals={verticals} />
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

  if (mode === "export-select") {
    return (
      <div className={shellClass}>
        <ExportSelectScreen
          entries={entries}
          verticals={verticals}
          onCancel={() => setMode("settings")}
        />
      </div>
    );
  }

  if (mode === "settings") {
    return (
      <div className={shellClass}>
        <SettingsScreen
          onClose={() => setMode("browse")}
          onNavigate={(target) => { setMode(target as AppMode); }}
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
          alwaysOnTop={alwaysOnTop}
          onAlwaysOnTopChange={(val) => {
            setAlwaysOnTop(val);
            void window.shortpath.setAlwaysOnTop(val);
          }}
        />
      </div>
    );
  }

  if (mode === "keyboard") {
    return (
      <div className={shellClass}>
        <KeyboardPanel
          onClose={() => setMode("browse")}
          hotkey={currentHotkey}
          customShortcuts={customShortcuts}
          onCustomShortcutsChange={(s) => {
            setCustomShortcuts(s);
          }}
        />
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
  const hasSampleData = entries.some((e) => e.source === "sample");

  if (easterEgg) {
    return (
      <div className={shellClass}>
        <div className="easter-egg-screen">
          <button className="easter-egg-close" onClick={() => { setEasterEgg(false); setQuery(""); }}>✕</button>
          <div className="easter-egg-content">
            <div className="easter-egg-title">It's all ogre, now.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <header className="app-header">
        <div className="app-path-group">
          <button
            className={`header-icon-btn pin-window-btn${alwaysOnTop ? " active" : ""}`}
            onClick={() => {
              const next = !alwaysOnTop;
              setAlwaysOnTop(next);
              void window.shortpath.setAlwaysOnTop(next);
            }}
            title={alwaysOnTop ? "Window stays on top" : "Keep window on top"}
          >
            <span className="pin-circle" />
          </button>
          <button className="app-path-btn" onClick={handleGoHome} title="Go home">
            shortpath
          </button>
          <div className="source-picker-wrap" ref={sourcePickerRef}>
            {syncSources.length > 0 ? (
              <>
                <button
                  className="app-source-btn"
                  onClick={() => setSourcePickerOpen((p) => !p)}
                  title="Switch source"
                >
                  / {getActiveSourceDisplayLabel()} ▾
                </button>
                {sourcePickerOpen && (
                  <div className="source-picker-dropdown">
                    <button className={`source-option${activeSource === "local" ? " active" : ""}`} onClick={() => handleSetActiveSource("local")}>Local</button>
                    {syncSources.map(s => (
                      <button key={s.id} className={`source-option${activeSource === s.id ? " active" : ""}`} onClick={() => handleSetActiveSource(s.id)}>
                        {getSourceLabel(s)}
                      </button>
                    ))}
                    <button className={`source-option${activeSource === "all" ? " active" : ""}`} onClick={() => handleSetActiveSource("all")}>All</button>
                  </div>
                )}
              </>
            ) : (
              <span className="app-source-label">/ Local</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {isSearching && totalHits > 0 && (
            <span className="app-hit-summary">{totalHits} result{totalHits !== 1 ? "s" : ""}</span>
          )}
          {hasClipboard && (
            <button
              className="header-icon-btn clipboard-indicator"
              onClick={handleClipboardIconClick}
              title={`Save clipboard as entry: "${clipboardText!.length > 48 ? clipboardText!.slice(0, 48) + "…" : clipboardText}"`}
            >
              ⎘
            </button>
          )}
          <button className="header-icon-btn header-icon-letter" onClick={() => setMode("keyboard")} title="Keyboard shortcuts (Alt+K)">K</button>
          <button className="header-icon-btn header-icon-letter" onClick={() => setMode("notes")} title="Notes (Alt+N)">N</button>
          <button className="header-icon-btn" onClick={() => setMode("favorites")} title="Favorites">☆</button>
          <button className="header-icon-btn" onClick={() => void window.shortpath.openHelpWindow()} title="Help (Alt+H)">?</button>
          <button className="header-icon-btn" onClick={() => setMode("settings")} title="Settings (Alt+S)">⚙</button>
          <button className="header-icon-btn" onClick={() => void window.shortpath.minimizeWindow()} title="Minimize">−</button>
        </div>
      </header>

      {hasSampleData && (
        <div className="sample-data-banner">
          <span>Sample data loaded — replace with your own entries</span>
          <button
            className="sample-data-clear"
            onClick={() => void window.shortpath.clearSampleData()}
            title="Remove all sample entries"
          >
            Clear sample data
          </button>
        </div>
      )}

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

      {/* Sort control + collapse-all */}
      <div className="sort-bar">
        <span className="sort-label">Sort:</span>
        <select
          className="sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <option value="relevance">Relevance</option>
          <option value="most-used">Most used</option>
          <option value="recently-used">Recently used</option>
          <option value="recently-added">Recently added</option>
          <option value="a-to-z">A to Z</option>
        </select>
        {(() => {
          const allSourceKeys = activeSource === "all"
            ? [...new Set(groups.map(g => g.verticalId.split("::")[0]))]
            : [];
          const anythingExpanded = activeSource === "all"
            ? (collapsedSources.size < allSourceKeys.length || expandedGroups.size > 0)
            : expandedGroups.size > 0;

          return groups.length > 0 && (
            anythingExpanded ? (
              <button className="collapse-all-btn" onClick={() => {
                setExpandedGroups(new Set());
                if (activeSource === "all") setCollapsedSources(new Set(allSourceKeys));
              }} title="Collapse all sections">⊟ Collapse</button>
            ) : (
              <button className="collapse-all-btn" onClick={() => {
                setExpandedGroups(new Set(groups.map((g) => g.verticalId)));
                if (activeSource === "all") setCollapsedSources(new Set());
              }} title="Expand all sections">⊞ Expand</button>
            )
          );
        })()}
      </div>

      <main className="results-container">

        {isSearching && groups.length === 0 && (
          <div className="empty-state">
            <p>No matches for "{debouncedQuery}"</p>
            <button
              className="empty-state-action"
              onClick={() => {
                setQuickAddPrefill(debouncedQuery);
                setEditingEntry(null);
                setMode("add");
              }}
            >
              + Save "{debouncedQuery.length > 30 ? debouncedQuery.slice(0, 30) + "…" : debouncedQuery}" as new entry
            </button>
          </div>
        )}

        {!isSearching && entries.filter(e => e.source !== "sample").length === 0 && !hasSampleData && (
          <div className="empty-state">
            <p>No entries yet. Press <strong>+</strong> to add one or open <strong>⚙ Settings</strong> to import a CSV.</p>
          </div>
        )}

        {/* Pinned section — only when not searching */}
        {!isSearching && pinnedEntries.length > 0 && (
          <div className="pinned-section">
            <button className="group-header" onClick={() => setPinnedExpanded((p) => !p)}>
              <span className={`group-chevron${pinnedExpanded ? " expanded" : ""}`}>›</span>
              <span className="group-label">Pinned ({pinnedEntries.length})</span>
            </button>
            {pinnedExpanded && (
              <>
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
              </>
            )}
          </div>
        )}

        {activeSource === "all" ? (
          (() => {
            const bySource = new Map<string, typeof groups>();
            for (const g of groups) {
              const sep = g.verticalId.indexOf("::");
              const srcKey = sep !== -1 ? g.verticalId.slice(0, sep) : "local";
              if (!bySource.has(srcKey)) bySource.set(srcKey, []);
              bySource.get(srcKey)!.push(g);
            }
            return Array.from(bySource.entries()).map(([srcKey, srcGroups]) => {
              const srcObj = syncSources.find(s => s.id === srcKey);
              const srcLabel = srcKey === "local" ? "Local" : (srcObj ? getSourceLabel(srcObj) : "Sync");
              const isExpanded = !collapsedSources.has(srcKey);
              const srcHitCount = srcGroups.reduce((s, g) => s + g.hitCount, 0);
              return (
                <div key={srcKey} className="source-section">
                  <button className="source-section-header" onClick={() => toggleSource(srcKey)}>
                    <span className={`group-chevron${isExpanded ? " expanded" : ""}`}>›</span>
                    <span className="group-label">{srcLabel} ({srcHitCount})</span>
                  </button>
                  {isExpanded && (
                    <div className="source-section-body">
                      {srcGroups.map((group) => {
                        const actualVId = group.verticalId.includes("::") ? group.verticalId.split("::")[1] : group.verticalId;
                        return actualVId === "support-tools" ? (
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
                            pinned={pinned}
                            onTogglePin={(id) => void handleTogglePin(id)}
                            onOpen={handleOpenOverlay}
                          />
                        ) : (
                          <VerticalGroupComponent
                            key={group.verticalId}
                            group={group}
                            subFolders={verticals.find((v) => v.id === actualVId)?.subFolders}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()
        ) : (
          groups.map((group) => {
            const actualVId = group.verticalId.includes("::") ? group.verticalId.split("::")[1] : group.verticalId;
            return actualVId === "support-tools" ? (
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
                pinned={pinned}
                onTogglePin={(id) => void handleTogglePin(id)}
                onOpen={handleOpenOverlay}
              />
            ) : (
              <VerticalGroupComponent
                key={group.verticalId}
                group={group}
                subFolders={verticals.find((v) => v.id === actualVId)?.subFolders}
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
            );
          })
        )}
      </main>

      <button
        className="fab-add"
        onClick={() => { setEditingEntry(null); setQuickAddPrefill(undefined); setMode("add"); }}
        title="Add entry (Ctrl+N)"
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
