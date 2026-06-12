import { useEffect, useRef, useState } from "react";
import type { Entry, VerticalGroup } from "@shared/types";
import EntryActions from "./EntryActions";

interface Props {
  group: VerticalGroup;
  onToggle: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onReorder: (entryId: string, direction: "up" | "down") => void;
  isSearching: boolean;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  pinned?: Set<string>;
  onTogglePin?: (id: string) => void;
  onOpen: (entry: Entry) => void;
}

const COLLAPSE_THRESHOLD = 360;

function ToolItem({
  entry,
  isFirst,
  isLast,
  isSearching,
  isFav,
  isPinned,
  onToggleFavorite,
  onTogglePin,
  onEdit,
  onCopy,
  onOpen,
  onReorder,
}: {
  entry: Entry;
  isFirst: boolean;
  isLast: boolean;
  isSearching: boolean;
  isFav: boolean;
  isPinned: boolean;
  onToggleFavorite?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  onReorder: (entryId: string, direction: "up" | "down") => void;
}) {
  const [isNarrow, setIsNarrow] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = liRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) => {
      setIsNarrow(e.contentRect.width < COLLAPSE_THRESHOLD);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleCopyComplete() {
    onCopy(entry.id);
    void window.shortpath.recordAccess(entry.id);
  }

  function handleOpenLink() {
    if (entry.link) {
      window.shortpath.openExternal(entry.link);
      void window.shortpath.recordAccess(entry.id);
      onCopy(entry.id);
    }
  }

  return (
    <li
      ref={liRef}
      className="result-item"
      onClick={() => onOpen(entry)}
      style={{ cursor: "pointer" }}
    >
      <div className="result-content">
        <span className="result-title">{entry.title}</span>
        {entry.tags && <span className="result-tags">{entry.tags}</span>}
      </div>
      <div className="result-actions" onClick={(e) => e.stopPropagation()}>
        {onTogglePin && (
          <button
            className={`action-btn pin-btn${isPinned ? " pinned" : ""}`}
            onClick={(e) => { e.stopPropagation(); onTogglePin(entry.id); }}
            aria-label={isPinned ? "Unpin entry" : "Pin to top"}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <span className="pin-dot" />
          </button>
        )}
        <EntryActions
          entry={entry}
          isNarrow={isNarrow}
          isFavorite={isFav}
          onCopyComplete={entry.body ? handleCopyComplete : undefined}
          onOpenLink={entry.link ? handleOpenLink : undefined}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(entry.id) : undefined}
          onEdit={() => onEdit(entry)}
        />
        {!isSearching && (
          <>
            <button
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); onReorder(entry.id, "up"); }}
              disabled={isFirst}
              aria-label="Move up"
              title="Move up"
            >↑</button>
            <button
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); onReorder(entry.id, "down"); }}
              disabled={isLast}
              aria-label="Move down"
              title="Move down"
            >↓</button>
          </>
        )}
      </div>
    </li>
  );
}

export default function SupportToolsGroup({
  group, onToggle, onEdit, onCopy, onReorder, isSearching,
  favorites, onToggleFavorite, pinned, onTogglePin, onOpen,
}: Props) {
  return (
    <div className="vertical-group support-tools-group">
      <button className="group-header" onClick={onToggle}>
        <span className={`group-chevron${group.expanded ? " expanded" : ""}`}>›</span>
        <span className="group-label">{group.label}</span>
        <span className="group-count">{group.hitCount}</span>
      </button>

      {group.expanded && (
        <ul className="result-list">
          {group.results.map((result, idx) => {
            const { entry } = result;
            return (
              <ToolItem
                key={entry.id}
                entry={entry}
                isFirst={idx === 0}
                isLast={idx === group.results.length - 1}
                isSearching={isSearching}
                isFav={favorites?.has(entry.id) ?? false}
                isPinned={pinned?.has(entry.id) ?? false}
                onToggleFavorite={onToggleFavorite}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
                onCopy={onCopy}
                onOpen={onOpen}
                onReorder={onReorder}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
