import React from "react";
import type { Entry, VerticalGroup } from "@shared/types";
import ResultItem from "./ResultItem";

interface Props {
  group: VerticalGroup;
  onToggle: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
}

export default function VerticalGroupComponent({ group, onToggle, onEdit, onCopy }: Props) {
  return (
    <div className="vertical-group">
      <button className="group-header" onClick={onToggle}>
        <span className={`group-chevron${group.expanded ? " expanded" : ""}`}>›</span>
        <span className="group-label">{group.label}</span>
        <span className="group-count">{group.hitCount}</span>
      </button>
      {group.expanded && (
        <ul className="result-list">
          {group.results.map((result) => (
            <ResultItem
              key={result.entry.id}
              result={result}
              onEdit={onEdit}
              onCopy={onCopy}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
