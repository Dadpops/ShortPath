import { useState, useEffect } from "react";
import type { Entry, Note, Vertical } from "@shared/types";
import { copyEntry } from "@renderer/utils/htmlToPlain";

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
  const [entryNotes, setEntryNotes] = useState<Note[]>([]);
  const [notesExpanded, setNotesExpanded] = useState(true);

  const verticalLabel = verticals.find((v) => v.id === entry.vertical)?.label ?? entry.vertical;
  const tags = entry.tags ? entry.tags.split("|").map((t) => t.trim()).filter(Boolean) : [];

  useEffect(() => {
    void window.shortpath.loadNotes().then((all) => {
      setEntryNotes(all.filter((n) => n.entryId === entry.id));
    });
  }, [entry.id]);

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
                className={`macro-star-toggle pin-btn${isPinned ? " pinned" : ""}`}
                onClick={onTogglePin}
                title={isPinned ? "Unpin" : "Pin to top"}
              >
                <span className="pin-dot" />
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

        {(onEdit || onDuplicate || onAddNote || entryNotes.length > 0) && (
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

            {/* Notes section */}
            {(entryNotes.length > 0 || onAddNote) && (
              <div className="macro-notes-section">
                {entryNotes.length > 0 && (
                  <button
                    className="macro-notes-toggle"
                    onClick={() => setNotesExpanded((p) => !p)}
                  >
                    <span className={`group-chevron${notesExpanded ? " expanded" : ""}`}>›</span>
                    Notes ({entryNotes.length})
                  </button>
                )}
                {notesExpanded && entryNotes.length > 0 && (
                  <ul className="macro-notes-list">
                    {entryNotes.map((note) => (
                      <li key={note.id} className="macro-note-item">
                        {note.title && <div className="macro-note-title">{note.title}</div>}
                        <div className="macro-note-body">{note.body}</div>
                        <button
                          className="macro-note-delete"
                          title="Delete note"
                          onClick={() => {
                            void window.shortpath.deleteNote(note.id).then(() => {
                              setEntryNotes((prev) => prev.filter((n) => n.id !== note.id));
                            });
                          }}
                        >✕</button>
                      </li>
                    ))}
                  </ul>
                )}
                {onAddNote && (
                  <button className="macro-edit-btn" onClick={onAddNote}>+ Add note</button>
                )}
              </div>
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
