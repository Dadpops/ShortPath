import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Entry, SearchResult } from "@shared/types";
import { copyEntry, htmlToPlain } from "@renderer/utils/htmlToPlain";

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
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liRef = useRef<HTMLLIElement>(null);
  const { entry } = result;

  const isOpenable = !!entry.link;
  const hasActiveState = isPinned || isFavorite;

  const previewText = entry.body ? htmlToPlain(entry.body).slice(0, 200) : entry.link ?? null;

  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  }, []);

  function handleMouseEnter() {
    if (!previewText) return;
    hoverTimer.current = setTimeout(() => {
      if (liRef.current) setPreviewRect(liRef.current.getBoundingClientRect());
    }, 250);
  }

  function handleMouseLeave() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setPreviewRect(null);
  }

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

  const PREVIEW_W = 240;
  const PREVIEW_MAX_H = 180;
  const previewPortal = previewRect && previewText ? createPortal(
    <div
      className="result-preview"
      style={{
        top: previewRect.bottom + 4 + PREVIEW_MAX_H > window.innerHeight
          ? Math.max(4, previewRect.top - PREVIEW_MAX_H - 4)
          : previewRect.bottom + 4,
        left: Math.max(8, Math.min(window.innerWidth - PREVIEW_W - 8, previewRect.left + 8)),
      }}
    >
      <div className="result-preview-body">{previewText}</div>
      {entry.link && entry.body && (
        <span className="result-preview-link">{entry.link}</span>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
    <li
      ref={liRef}
      className={`result-item${isFocused ? " focused" : ""}${hasActiveState ? " has-active-state" : ""}`}
      data-focused={isFocused ? "true" : undefined}
      onClick={() => onOpen(entry)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
    {previewPortal}
    </>
  );
}
