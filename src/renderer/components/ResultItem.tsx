import React, { useState } from "react";
import type { Entry, SearchResult } from "@shared/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function copyEntry(entry: Entry): Promise<void> {
  const raw = entry.body ?? entry.link ?? entry.title;
  if (entry.copyMode === "html" && entry.body) {
    const plain = stripHtml(entry.body);
    const htmlBlob = new Blob([raw], { type: "text/html" });
    const plainBlob = new Blob([plain], { type: "text/plain" });
    return navigator.clipboard.write([new ClipboardItem({ "text/html": htmlBlob, "text/plain": plainBlob })]);
  }
  const plain = stripHtml(raw);
  return navigator.clipboard.writeText(plain);
}

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

  const isOpenable = !!entry.link && (entry.type === "link" || entry.type === "tool");
  const hasActiveState = isPinned || isFavorite;

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
      className={`result-item${isFocused ? " focused" : ""}${hasActiveState ? " has-active-state" : ""}`}
      data-focused={isFocused ? "true" : undefined}
      onClick={() => onOpen(entry)}
      style={{ cursor: "pointer" }}
    >
      <div className="result-content">
        <div style={{ display: "flex", alignItems: "baseline", gap: 0, minWidth: 0 }}>
          <span className="result-title">{entry.title}</span>
          {(entry.copyCount ?? 0) > 0 && (
            <span className="copy-count-badge">{entry.copyCount}×</span>
          )}
        </div>
        {entry.tags && <span className="result-tags">{entry.tags}</span>}
      </div>
      <div className="result-actions">
        {onTogglePin !== undefined && (
          <button
            className={`action-btn pin-btn${isPinned ? " pinned" : ""}`}
            onClick={handleTogglePin}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <span className="pin-dot" />
          </button>
        )}
        {onToggleFavorite !== undefined && (
          <button
            className={`action-btn star-btn${isFavorite ? " starred" : ""}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        )}
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
