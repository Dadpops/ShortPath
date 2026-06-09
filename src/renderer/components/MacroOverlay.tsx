import { useState, useEffect } from "react";
import type { Entry, Vertical } from "@shared/types";

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
  entry: Entry;
  verticals: Vertical[];
  onClose: () => void;
  onCopied: (entryId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onEdit?: (entry: Entry) => void;
  onDuplicate?: (entry: Entry) => void;
  onAddNote?: () => void;
}

export default function MacroOverlay({ entry, verticals, onClose, onCopied, isFavorite, onToggleFavorite, isPinned, onTogglePin, onEdit, onDuplicate, onAddNote }: Props) {
  const [copied, setCopied] = useState(false);

  const verticalLabel = verticals.find((v) => v.id === entry.vertical)?.label ?? entry.vertical;
  const tags = entry.tags ? entry.tags.split("|").map((t) => t.trim()).filter(Boolean) : [];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleCopy();
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose, entry]);

  function handleCopy() {
    copyEntry(entry).then(() => {
      setCopied(true);
      onCopied(entry.id);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleOpenLink(e: React.MouseEvent) {
    e.preventDefault();
    if (entry.link) window.shortpath.openExternal(entry.link);
  }

  return (
    <div className="macro-backdrop" onClick={onClose}>
      <div className="macro-panel" onClick={(e) => e.stopPropagation()}>

        <div className="macro-header">
          <div className="macro-header-meta">
            {onToggleFavorite && (
              <button
                className={`macro-star-toggle${isFavorite ? " starred" : ""}`}
                onClick={onToggleFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "★" : "☆"}
              </button>
            )}
            {onTogglePin && (
              <button
                className={`macro-star-toggle${isPinned ? " starred" : ""}`}
                onClick={onTogglePin}
                title={isPinned ? "Unpin" : "Pin to top"}
                style={{ color: isPinned ? "var(--color-accent)" : undefined }}
              >
                {isPinned ? "📌" : "📍"}
              </button>
            )}
            <span className="macro-badge macro-badge-vertical">{verticalLabel}</span>
            <span className="macro-badge macro-badge-type">{entry.type}</span>
          </div>
          <h2 className="macro-title">{entry.title}</h2>
          <div className="macro-header-actions">
            <button
              className={`macro-copy-btn${copied ? " copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="macro-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="macro-body">
          {entry.body ? (
            entry.copyMode === "html"
              ? <div className="macro-body-rich" dangerouslySetInnerHTML={{ __html: entry.body }} />
              : <pre className="macro-body-text">{stripHtml(entry.body)}</pre>
          ) : (
            <p className="macro-body-empty">No body text.</p>
          )}
        </div>

        {(onEdit || onDuplicate || onAddNote) && (
          <div className="macro-edit-strip">
            {entry.source === "local" && onEdit && (
              <button className="macro-edit-btn" onClick={() => onEdit(entry)}>✎ Edit entry</button>
            )}
            {entry.source === "synced" && onDuplicate && (
              <>
                <button className="macro-edit-btn" onClick={() => onDuplicate(entry)}>⊕ Duplicate to local and edit</button>
                <p className="macro-edit-note">Synced entries come from the shared file and can't be edited directly. Duplicating creates a local copy you can edit freely.</p>
              </>
            )}
            {onAddNote && (
              <button className="macro-edit-btn" onClick={onAddNote}>✎ Add note</button>
            )}
          </div>
        )}

        {(entry.link || tags.length > 0) && (
          <div className="macro-footer">
            {entry.link && (
              <a
                className="macro-link"
                href={entry.link}
                onClick={handleOpenLink}
                title={entry.link}
              >
                ↗ {entry.link}
              </a>
            )}
            {tags.length > 0 && (
              <div className="macro-tags">
                {tags.map((tag) => (
                  <span key={tag} className="macro-tag-chip">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
