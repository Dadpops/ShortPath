import { useState, useMemo, useCallback } from "react";
import type { Entry, Vertical, SubFolder } from "@shared/types";

interface Props {
  entries: Entry[];
  verticals: Vertical[];
  onCancel: () => void;
}

function flattenSubFolders(subs: SubFolder[] | undefined, depth = 0): Array<SubFolder & { depth: number }> {
  return (subs ?? []).flatMap((sf) => [
    { ...sf, depth },
    ...flattenSubFolders(sf.subFolders, depth + 1),
  ]);
}

function subtreeIds(sf: SubFolder): string[] {
  return [sf.id, ...(sf.subFolders ?? []).flatMap(subtreeIds)];
}

export default function ExportSelectScreen({ entries, verticals, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const [exporting, setExporting] = useState(false);
  // Track which subfolder sections are expanded (shows their individual entries)
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(() => new Set());

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

  function toggleSubExpand(sfId: string) {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      next.has(sfId) ? next.delete(sfId) : next.add(sfId);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(entries.map((e) => e.id))); }
  function deselectAll() { setSelected(new Set()); }

  // Select/deselect all entries in subfolders within a vertical
  function toggleAllSubfolders(_verticalId: string, v: Vertical, on: boolean) {
    const flatSubs = flattenSubFolders(v.subFolders);
    const ids = flatSubs.flatMap((sf) => entriesInSubtree(sf));
    toggle(ids, on);
  }

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
        <button className="form-back-btn" onClick={onCancel} disabled={exporting}>← Back</button>
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
          const hasSubs = flatSubs.length > 0;
          const subEntryIds = hasSubs ? flatSubs.flatMap((sf) => entriesInSubtree(sf)) : [];
          const allSubsOn = isAllSelected(subEntryIds);
          const someSubsOn = isSomeSelected(subEntryIds);

          return (
            <div key={v.id} className="export-vertical-group">
              {/* Vertical row */}
              <div className="export-row export-row-vertical">
                <label className="export-row-checkbox-label">
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => { if (el) el.indeterminate = someOn; }}
                    onChange={() => toggle(vEntries)}
                  />
                  <span className="export-row-label">{v.label}</span>
                  <span className="export-row-count">{vEntries.length}</span>
                </label>
                {hasSubs && (
                  <div className="export-subfolder-toggles">
                    <button
                      className={`export-subfolder-toggle-btn${allSubsOn ? " active" : ""}`}
                      onClick={() => toggleAllSubfolders(v.id, v, true)}
                      ref={(el) => { if (el) el.style.setProperty("--indeterminate", someSubsOn && !allSubsOn ? "1" : "0"); }}
                      title="Select all subfolders"
                    >All subfolders</button>
                    <button
                      className="export-subfolder-toggle-btn"
                      onClick={() => toggleAllSubfolders(v.id, v, false)}
                      title="Deselect all subfolders"
                    >None</button>
                  </div>
                )}
              </div>

              {/* Subfolder rows */}
              {flatSubs.map((sf) => {
                const sfEntryIds = entriesInSubtree(sf);
                if (!sfEntryIds.length) return null;
                const sfAllOn = isAllSelected(sfEntryIds);
                const sfSomeOn = isSomeSelected(sfEntryIds);
                const sfDirectEntries = entries.filter((e) => e.subFolderId === sf.id);
                const isExpanded = expandedSubs.has(sf.id);

                return (
                  <div key={sf.id}>
                    <div
                      className="export-row export-row-subfolder"
                      style={{ paddingLeft: `${24 + sf.depth * 16}px` }}
                    >
                      <label className="export-row-checkbox-label">
                        <input
                          type="checkbox"
                          checked={sfAllOn}
                          ref={(el) => { if (el) el.indeterminate = sfSomeOn; }}
                          onChange={() => toggle(sfEntryIds)}
                        />
                        <button
                          className="export-subfolder-chevron"
                          onClick={() => toggleSubExpand(sf.id)}
                          title={isExpanded ? "Collapse" : "Expand entries"}
                        >
                          <span className={`group-chevron${isExpanded ? " expanded" : ""}`}>›</span>
                        </button>
                        <span className="export-row-label">{sf.label}</span>
                        <span className="export-row-count">{sfEntryIds.length}</span>
                      </label>
                    </div>

                    {isExpanded && sfDirectEntries.map((e) => (
                      <label
                        key={e.id}
                        className="export-row export-row-entry"
                        style={{ paddingLeft: `${44 + sf.depth * 16}px` }}
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
                    style={{ paddingLeft: "24px" }}
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
        <button className="btn-secondary" onClick={onCancel} disabled={exporting}>Cancel</button>
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
