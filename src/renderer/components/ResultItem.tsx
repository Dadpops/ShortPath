import React, { useState } from "react";
import type { Entry, SearchResult } from "@shared/types";

interface Props {
  result: SearchResult;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  isFocused?: boolean;
}

export default function ResultItem({ result, onEdit, onCopy, onOpen, isFocused }: Props) {
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

  return (
    <li
      className={`result-item${isFocused ? " focused" : ""}`}
      data-focused={isFocused ? "true" : undefined}
      onClick={() => onOpen(entry)}
    >
      <div className="result-content">
        <span className="result-title">{entry.title}</span>
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
