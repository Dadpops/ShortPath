import { useState } from "react";
import type { Entry, VerticalGroup } from "@shared/types";

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

function copyEntry(entry: Entry): Promise<void> {
  const raw = entry.body ?? entry.link ?? entry.title;
  const plain = raw.replace(/<[^>]+>/g, "").trim();
  return navigator.clipboard.writeText(plain);
}

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
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    copyEntry(entry).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy(entry.id);
      window.shortpath.recordAccess(entry.id);
    });
  }

  function handleOpenLink(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.link) {
      window.shortpath.openExternal(entry.link);
      window.shortpath.recordAccess(entry.id);
      onCopy(entry.id);
    }
  }

  return (
    <li
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
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <span className="pin-dot" />
          </button>
        )}
        {onToggleFavorite && (
          <button
            className={`action-btn star-btn${isFav ? " starred" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            {isFav ? "★" : "☆"}
          </button>
        )}
        {entry.link && (
          <button className="action-btn open-btn" onClick={handleOpenLink} title="Open link">
            ↗
          </button>
        )}
        {entry.body && (
          <button
            className={`action-btn copy-btn${copied ? " copied" : ""}`}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? "✓" : "⎘"}
          </button>
        )}
        <button
          className="action-btn edit-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
          title="Edit"
        >
          ✎
        </button>
        {!isSearching && (
          <>
            <button
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); onReorder(entry.id, "up"); }}
              disabled={isFirst}
              title="Move up"
            >↑</button>
            <button
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); onReorder(entry.id, "down"); }}
              disabled={isLast}
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
