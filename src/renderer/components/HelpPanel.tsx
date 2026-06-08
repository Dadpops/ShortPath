import { useState, useEffect, useRef } from "react";
import { HELP_TOPICS, type HelpTopic } from "../features/help/topics";

interface Props {
  onClose: () => void;
}

export default function HelpPanel({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HelpTopic | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (selected) return;
    searchRef.current?.focus();
  }, [selected]);

  const filtered = query.trim()
    ? HELP_TOPICS.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)) ||
          t.content.toLowerCase().includes(q)
        );
      })
    : HELP_TOPICS;

  return (
    <div className="help-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={selected ? () => setSelected(null) : onClose}>
          ← {selected ? "Topics" : "Back"}
        </button>
        <span className="form-title">{selected ? selected.title : "Help"}</span>
      </div>

      {selected ? (
        <div className="help-topic-view">
          <pre className="help-topic-content">{selected.content}</pre>
        </div>
      ) : (
        <>
          <div className="help-search-container">
            <input
              ref={searchRef}
              className="help-search-input"
              placeholder="Search help topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="help-topics-list">
            {filtered.map((topic) => (
              <button
                key={topic.id}
                className="help-topic-item"
                onClick={() => setSelected(topic)}
              >
                <span className="help-topic-name">{topic.title}</span>
                <span className="help-topic-chevron">›</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="help-empty">No topics found for "{query}"</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
