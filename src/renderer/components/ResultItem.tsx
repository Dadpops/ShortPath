import React, { useState } from "react";
import type { Entry, SearchResult } from "@shared/types";

interface Props {
  result: SearchResult;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  isFocused?: boolean;
}

export default function ResultItem({ result, onEdit, onCopy, isFocused }: Props) {
  const [copied, setCopied] = useState(false);
  const { entry } = result;

  const textToCopy = entry.body ?? entry.link ?? entry.title;
  const isOpenable = !!entry.link && (entry.type === "link" || entry.type === "tool");

  function handleCopy() {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy(entry.id);
      window.shortpath.recordAccess(entry.id);
    });
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.link) {
      window.shortpath.openExternal(entry.link);
    }
  }

  return (
    <li className={`result-item${isFocused ? " focused" : ""}`} data-focused={isFocused ? "true" : undefined}>
      <div className="result-content">
        <span className="result-title">{entry.title}</span>
        {entry.tags && <span className="result-tags">{entry.tags}</span>}
      </div>
      <div className="result-actions">
        {isOpenable && (
          <button className="action-btn open-btn" onClick={handleOpen} title="Open link">
            ↗
          </button>
        )}
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(entry)}
          title="Edit entry"
        >
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
