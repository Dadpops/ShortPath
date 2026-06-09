import { useState, useMemo, useCallback } from "react";
import type { Entry, Vertical, SubFolder } from "@shared/types";

interface Props {
  entries: Entry[];
  verticals: Vertical[];
  onCancel: () => void;
}

// Flatten a subfolder tree into a list with depth info.
function flattenSubFolders(subs: SubFolder[] | undefined, depth = 0): Array<SubFolder & { depth: number }> {
  return (subs ?? []).flatMap((sf) => [
    { ...sf, depth },
    ...flattenSubFolders(sf.subFolders, depth + 1),
  ]);
}

// All subfolder IDs in a subtree.
function subtreeIds(sf: SubFolder): string[] {
  return [sf.id, ...(sf.subFolders ?? []).flatMap(subtreeIds)];
}

export default function ExportSelectScreen({ entries, verticals, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const [exporting, setExporting] = useState(false);

  // Entries by subfolderId (null key = no subfolder)
  const bySubFolder = useMemo(() => {
    const map = new Map<string | null, Entry[]>();
    for (const e of entries) {
      const key = e.subFolderId ?? null;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [entries]);

  const byVertical = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const arr = map.get(e.vertical) ?? [];
      arr.push(e);
      map.set(e.vertical, arr);
    }
    return map;
  }, [entries]);

  // All entry IDs within a subfolder subtree.
  function entriesInSubtree(sf: SubFolder): string[] {
    const ids = subtreeIds(sf);
    return entries.filter((e) => e.subFolderId && ids.includes(e.subFolderId)).map((e) => e.id);
  }

  function entriesInVertical(verticalId: string): string[] {
    return (byVertical.get(verticalId) ?? []).map((e) => e.id);
  }

  function isAllSelected(ids: string[]) { return ids.length > 0 && ids.every((id) => selected.has(id)); }
  function isSomeSelected(ids: string[]) { return ids.some((id) => selected.has(id)) && !isAllSelected(ids); }

  const toggle = useCallback((ids: string[], forceOn?: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = ids.every((id) => next.has(id));
      const on = forceOn !== undefined ? forceOn : !allOn;
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  function selectAll() { setSelected(new Set(entries.map((e) => e.id))); }
  function deselectAll() { setSelected(new Set()); }

  async function handleExport() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setExporting(true);
    await window.shortpath.exportSelected(ids);
    setExporting(false);
    onCancel();
  }

  const totalSelected = selected.size;

  return (
    <div className="entry-form-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={exporting}>
          ← Back
        </button>
        <span className="form-title">Export selected</span>
        <div className="export-select-header-actions">
          <button className="export-select-all-btn" onClick={selectAll}>All</button>
          <button className="export-select-all-btn" onClick={deselectAll}>None</button>
        </div>
      </div>

      <div className="export-select-body">
        {verticals.filter((v) => v.id !== "support-tools" && (byVertical.get(v.id)?.length ?? 0) > 0).map((v) => {
          const vEntries = entriesInVertical(v.id);
          const flatSubs = flattenSubFolders(v.subFolders);
          const allOn = isAllSelected(vEntries);
          const someOn = isSomeSelected(vEntries);

          return (
            <div key={v.id} className="export-vertical-group">
              {/* Vertical row */}
              <label className="export-row export-row-vertical">
                <input
                  type="checkbox"
                  checked={allOn}
                  ref={(el) => { if (el) el.indeterminate = someOn; }}
                  onChange={() => toggle(vEntries)}
                />
                <span className="export-row-label">{v.label}</span>
                <span className="export-row-count">{vEntries.length}</span>
              </label>

              {/* Subfolders + their entries */}
              {flatSubs.map((sf) => {
                const sfEntryIds = entriesInSubtree(sf);
                if (!sfEntryIds.length) return null;
                const sfAllOn = isAllSelected(sfEntryIds);
                const sfSomeOn = isSomeSelected(sfEntryIds);
                const sfEntries = entries.filter((e) => e.subFolderId === sf.id);

                return (
                  <div key={sf.id}>
                    <label
                      className="export-row export-row-subfolder"
                      style={{ paddingLeft: `${24 + sf.depth * 16}px` }}
                    >
                      <input
                        type="checkbox"
                        checked={sfAllOn}
                        ref={(el) => { if (el) el.indeterminate = sfSomeOn; }}
                        onChange={() => toggle(sfEntryIds)}
                      />
                      <span className="export-row-label">{sf.label}</span>
                      <span className="export-row-count">{sfEntryIds.length}</span>
                    </label>
                    {sfEntries.map((e) => (
                      <label
                        key={e.id}
                        className="export-row export-row-entry"
                        style={{ paddingLeft: `${40 + sf.depth * 16}px` }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(e.id)}
                          onChange={() => toggle([e.id])}
                        />
                        <span className="export-row-label">{e.title}</span>
                      </label>
                    ))}
                  </div>
                );
              })}

              {/* Entries not in any subfolder */}
              {(bySubFolder.get(null) ?? [])
                .filter((e) => e.vertical === v.id)
                .map((e) => (
                  <label
                    key={e.id}
                    className="export-row export-row-entry"
                    style={{ paddingLeft: flatSubs.length > 0 ? "24px" : "24px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggle([e.id])}
                    />
                    <span className="export-row-label">{e.title}</span>
                  </label>
                ))}
            </div>
          );
        })}
      </div>

      <div className="export-select-footer">
        <span className="export-select-count">
          {totalSelected} {totalSelected === 1 ? "entry" : "entries"} selected
        </span>
        <button className="btn-secondary" onClick={onCancel} disabled={exporting}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleExport}
          disabled={totalSelected === 0 || exporting}
        >
          {exporting ? "Saving…" : `Export ${totalSelected}`}
        </button>
      </div>
    </div>
  );
}
