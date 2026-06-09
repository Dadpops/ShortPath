import React, { useState } from "react";
import type { Entry, SearchResult } from "@shared/types";

interface Props {
  result: SearchResult;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  isFocused?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
}

export default function ResultItem({ result, onEdit, onCopy, onOpen, isFocused, isFavorite, onToggleFavorite, isPinned, onTogglePin }: Props) {
  const [copied, setCopied] = useState(false);
  const { entry } = result;

  const textToCopy = entry.body ?? entry.link ?? entry.title;
  const isOpenable = !!entry.link && (entry.type === "link" || entry.type === "tool");

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy).then(() => {
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
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(entry);
  }

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFavorite?.(entry.id);
  }

  function handleTogglePin(e: React.MouseEvent) {
    e.stopPropagation();
    onTogglePin?.(entry.id);
  }

  return (
    <li
      className={`result-item${isFocused ? " focused" : ""}`}
      data-focused={isFocused ? "true" : undefined}
      onClick={() => onOpen(entry)}
      style={{ cursor: "pointer" }}
    >
      {onTogglePin !== undefined && (
        <button
          className={`pin-toggle${isPinned ? " pinned" : ""}`}
          onClick={handleTogglePin}
          title={isPinned ? "Unpin" : "Pin to top"}
        >
          {isPinned ? "📌" : "📍"}
        </button>
      )}
      {onToggleFavorite !== undefined && (
        <button
          className={`star-toggle${isFavorite ? " starred" : ""}`}
          onClick={handleToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      )}
      <div className="result-content">
        <div style={{ display: "flex", alignItems: "baseline", gap: 0, minWidth: 0 }}>
          <span className="result-title">{entry.title}</span>
          {(entry.copyCount ?? 0) > 0 && (
            <span className="copy-count-badge">{entry.copyCount}×</span>
          )}
        </div>
        {entry.source === "synced" && <span className="result-source-badge">synced</span>}
        {entry.tags && <span className="result-tags">{entry.tags}</span>}
      </div>
      <div className="result-actions">
        {isOpenable && (
          <button className="action-btn open-btn" onClick={handleOpenLink} title="Open link">
            ↗
          </button>
        )}
        <button className="action-btn edit-btn" onClick={handleEdit} title="Edit entry">
          ✎
        </button>
        <button
          className={`action-btn copy-btn${copied ? " copied" : ""}`}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? "✓" : "⎘"}
        </button>
      </div>
    </li>
  );
}
