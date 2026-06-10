import { useState, useEffect } from "react";
import type { Entry, VerticalGroup, SubFolder, SearchResult } from "@shared/types";
import ResultItem from "./ResultItem";
import FolderIcon from "./FolderIcon";

interface Props {
  group: VerticalGroup;
  subFolders?: SubFolder[];
  onToggle: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  focusedEntryId?: string | null;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  pinned?: Set<string>;
  onTogglePin?: (id: string) => void;
  // Signal from parent to expand or collapse all subfolders. Version increment triggers the effect.
  subExpandSignal?: { expand: boolean; version: number } | null;
  isSearching?: boolean;
}

function getAllIds(subFolders: SubFolder[]): string[] {
  return subFolders.flatMap((sf) => [sf.id, ...getAllIds(sf.subFolders ?? [])]);
}

function countInSubtree(sf: SubFolder, results: SearchResult[]): number {
  const direct = results.filter((r) => r.entry.subFolderId === sf.id).length;
  return direct + (sf.subFolders ?? []).reduce((n, child) => n + countInSubtree(child, results), 0);
}

export default function VerticalGroupComponent({
  group, subFolders, onToggle, onEdit, onCopy, onOpen,
  focusedEntryId, favorites, onToggleFavorite, pinned, onTogglePin, subExpandSignal, isSearching,
}: Props) {
  const hasSubs = (subFolders?.length ?? 0) > 0;

  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(
    () => new Set(getAllIds(subFolders ?? []))
  );

  useEffect(() => {
    if (!subExpandSignal) return;
    if (subExpandSignal.expand) {
      setExpandedSubs(new Set(getAllIds(subFolders ?? [])));
    } else {
      setExpandedSubs(new Set());
    }
  }, [subExpandSignal?.version, subFolders]); // version change triggers expand/collapse all

  function toggleSub(id: string) {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const topLevel = group.results.filter((r) => !r.entry.subFolderId);

  function renderSubFolder(sf: SubFolder, depth: number): React.ReactNode {
    const directResults = group.results.filter((r) => r.entry.subFolderId === sf.id);
    const childSubs = sf.subFolders ?? [];
    const total = countInSubtree(sf, group.results);
    const isOpen = expandedSubs.has(sf.id);

    if (isSearching && total === 0) return null;

    return (
      <div key={sf.id} className="subfolder-group" style={depth > 0 ? { marginLeft: 14 } : undefined}>
        <button className="subfolder-header" onClick={() => toggleSub(sf.id)}>
          <span className={`subfolder-chevron${isOpen ? " expanded" : ""}`}>›</span>
          <FolderIcon open={isOpen} />
          <span className="subfolder-label">{sf.label}</span>
          <span className="subfolder-count">{total}</span>
        </button>
        {isOpen && (
          <>
            {directResults.length > 0 && (
              <ul className="result-list subfolder-result-list">
                {directResults.map((result) => (
                  <ResultItem
                    key={result.entry.id}
                    result={result}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onOpen={onOpen}
                    isFocused={focusedEntryId === result.entry.id}
                    isFavorite={favorites?.has(result.entry.id)}
                    onToggleFavorite={onToggleFavorite}
                    isPinned={pinned?.has(result.entry.id)}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </ul>
            )}
            {childSubs.map((child) => renderSubFolder(child, depth + 1))}
            {directResults.length === 0 && childSubs.length === 0 && (
              <p className="subfolder-empty-hint">No entries</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="vertical-group">
      <button className="group-header" onClick={onToggle}>
        <span className={`group-chevron${group.expanded ? " expanded" : ""}`}>›</span>
        <span className="group-label">{group.label} ({group.hitCount})</span>
      </button>

      {group.expanded && (
        <>
          {topLevel.length > 0 && (
            <ul className="result-list">
              {topLevel.map((result) => (
                <ResultItem
                  key={result.entry.id}
                  result={result}
                  onEdit={onEdit}
                  onCopy={onCopy}
                  onOpen={onOpen}
                  isFocused={focusedEntryId === result.entry.id}
                  isFavorite={favorites?.has(result.entry.id)}
                  onToggleFavorite={onToggleFavorite}
                  isPinned={pinned?.has(result.entry.id)}
                  onTogglePin={onTogglePin}
                />
              ))}
            </ul>
          )}

          {hasSubs && (subFolders ?? []).map((sf) => renderSubFolder(sf, 0))}
        </>
      )}
    </div>
  );
}
