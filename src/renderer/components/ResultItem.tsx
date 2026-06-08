import React, { useState } from "react";
import type { Entry, SearchResult } from "@shared/types";

interface Props {
  result: SearchResult;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
}

export default function ResultItem({ result, onEdit, onCopy }: Props) {
  const [copied, setCopied] = useState(false);
  const { entry } = result;

  const textToCopy = entry.body ?? entry.link ?? entry.title;
  const isLink = entry.type === "link" && !entry.body;

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
      // Phase 4: replace with shell.openExternal via IPC
      window.open(entry.link, "_blank");
    }
  }

  return (
    <li className="result-item">
      <div className="result-content">
        <span className="result-title">{entry.title}</span>
        {entry.tags && <span className="result-tags">{entry.tags}</span>}
      </div>
      <div className="result-actions">
        {isLink && entry.link && (
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
