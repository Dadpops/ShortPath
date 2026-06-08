import React, { useState } from "react";
import type { SearchResult } from "@shared/types";

interface Props {
  result: SearchResult;
}

export default function ResultItem({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const { entry } = result;

  const textToCopy = entry.body ?? entry.link ?? entry.title;
  const isLink = entry.type === "link" && !entry.body;

  function handleCopy() {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (entry.link) {
      // Phase 4: use shell.openExternal via IPC. For now relies on Electron's default.
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
