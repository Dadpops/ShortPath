import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Entry, SearchResult } from "@shared/types";
import { htmlToPlain } from "@renderer/utils/htmlToPlain";
import EntryActions from "./EntryActions";

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

const COLLAPSE_THRESHOLD = 360;

export default function ResultItem({ result, onEdit, onCopy, onOpen, isFocused, isFavorite, onToggleFavorite, isPinned, onTogglePin }: Props) {
  const [previewRect, setPreviewRect] = useState<DOMRect | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liRef = useRef<HTMLLIElement>(null);
  const { entry } = result;

  const isOpenable = !!entry.link;
  const hasActiveState = isPinned || isFavorite;

  const previewText = entry.body ? htmlToPlain(entry.body).slice(0, 200) : entry.link ?? null;

  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  }, []);

  useEffect(() => {
    const el = liRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) => {
      setIsNarrow(e.contentRect.width < COLLAPSE_THRESHOLD);
    });
    observer.observe(el);
    return () => observer.disconnect();
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

  function handleCopyComplete() {
    onCopy(entry.id);
    void window.shortpath.recordAccess(entry.id);
  }

  function handleOpenLink() {
    if (entry.link) window.shortpath.openExternal(entry.link);
  }

  function handleEdit() {
    onEdit(entry);
  }

  function handleToggleFavorite() {
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
      <div className="result-actions" onClick={(e) => e.stopPropagation()}>
        {onTogglePin !== undefined && (
          <button
            className={`action-btn pin-btn${isPinned ? " pinned" : ""}`}
            onClick={handleTogglePin}
            aria-label={isPinned ? "Unpin entry" : "Pin to top"}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <span className="pin-dot" />
          </button>
        )}
        <EntryActions
          entry={entry}
          isNarrow={isNarrow}
          isFavorite={isFavorite}
          onCopyComplete={handleCopyComplete}
          onOpenLink={isOpenable ? handleOpenLink : undefined}
          onToggleFavorite={onToggleFavorite ? handleToggleFavorite : undefined}
          onEdit={handleEdit}
        />
      </div>
    </li>
    {previewPortal}
    </>
  );
}
