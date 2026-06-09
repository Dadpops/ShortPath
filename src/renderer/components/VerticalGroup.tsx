import { useState } from "react";
import type { Entry, VerticalGroup, SubFolder } from "@shared/types";
import ResultItem from "./ResultItem";

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
}

export default function VerticalGroupComponent({ group, subFolders, onToggle, onEdit, onCopy, onOpen, focusedEntryId, favorites, onToggleFavorite, pinned, onTogglePin }: Props) {
  const hasSubs = (subFolders?.length ?? 0) > 0;

  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(
    () => new Set(subFolders?.map((sf) => sf.id) ?? [])
  );

  function toggleSub(id: string) {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const topLevel = group.results.filter((r) => !r.entry.subFolderId);
  const inSubs = hasSubs
    ? (subFolders ?? []).map((sf) => ({
        subFolder: sf,
        results: group.results.filter((r) => r.entry.subFolderId === sf.id),
      })).filter((g) => g.results.length > 0)
    : [];

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

          {inSubs.map(({ subFolder, results }) => (
            <div key={subFolder.id} className="subfolder-group">
              <button
                className="subfolder-header"
                onClick={() => toggleSub(subFolder.id)}
              >
                <span className={`subfolder-chevron${expandedSubs.has(subFolder.id) ? " expanded" : ""}`}>›</span>
                <span className="subfolder-icon">📁</span>
                <span className="subfolder-label">{subFolder.label}</span>
                <span className="subfolder-count">{results.length}</span>
              </button>
              {expandedSubs.has(subFolder.id) && (
                <ul className="result-list subfolder-result-list">
                  {results.map((result) => (
                    <ResultItem
                      key={result.entry.id}
                      result={result}
                      onEdit={onEdit}
                      onCopy={onCopy}
                      onOpen={onOpen}
                      isFocused={focusedEntryId === result.entry.id}
                      isFavorite={favorites?.has(result.entry.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
