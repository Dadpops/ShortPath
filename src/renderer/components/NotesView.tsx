import { useState, useEffect, useRef } from "react";
import type { Note } from "@shared/types";

type NotesViewState = "list" | "editor";
type SaveStatus = "idle" | "saving" | "saved";

interface Props {
  onBack: () => void;
  initialEntry?: { id: string; title: string };
}

export default function NotesView({ onBack, initialEntry }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<NotesViewState>("list");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.shortpath.loadNotes().then((loaded) => {
      setNotes(loaded);
      setNotesLoaded(true);
    });
  }, []);

  // When opened from a resource overlay, create a linked note immediately.
  useEffect(() => {
    if (!notesLoaded || !initialEntry) return;
    window.shortpath.createNote({
      body: "",
      entryId: initialEntry.id,
      entryTitle: initialEntry.title,
    }).then((note) => {
      setNotes((prev) => [note, ...prev]);
      setEditingNote(note);
      setView("editor");
    });
  }, [notesLoaded]);

  async function handleCreate() {
    const note = await window.shortpath.createNote({ body: "" });
    setNotes((prev) => [note, ...prev]);
    setEditingNote(note);
    setView("editor");
  }

  function clearSavedBadge() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function saveNote(note: Note) {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    setSaveStatus("saving");
    const saved = await window.shortpath.updateNote(note.id, { title: note.title, body: note.body });
    setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    setEditingNote((prev) => (prev?.id === saved.id ? saved : prev));
    setSaveStatus("saved");
    clearSavedBadge();
  }

  function scheduleAutoSave(note: Note) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void saveNote(note); }, 1500);
  }

  function handleNoteChange(field: "title" | "body", value: string) {
    if (!editingNote) return;
    setSaveStatus("idle");
    const updated: Note = {
      ...editingNote,
      [field]: field === "title" ? (value || undefined) : value,
    };
    setEditingNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    scheduleAutoSave(updated);
  }

  async function handleDelete() {
    if (!editingNote) return;
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    if (savedTimerRef.current) { clearTimeout(savedTimerRef.current); savedTimerRef.current = null; }
    await window.shortpath.deleteNote(editingNote.id);
    setNotes((prev) => prev.filter((n) => n.id !== editingNote.id));
    setView("list");
    setEditingNote(null);
    setDeleteConfirm(false);
    setSaveStatus("idle");
  }

  function handleOpenNote(note: Note) {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    if (savedTimerRef.current) { clearTimeout(savedTimerRef.current); savedTimerRef.current = null; }
    setEditingNote(note);
    setDeleteConfirm(false);
    setSaveStatus("idle");
    setView("editor");
  }

  function handleBackToList() {
    setView("list");
    setEditingNote(null);
    setDeleteConfirm(false);
  }

  const filteredNotes = notes
    .filter((n) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (n.title ?? "").toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return sortOrder === "newest" ? cmp : -cmp;
    });

  if (view === "editor" && editingNote) {
    return (
      <div className="notes-shell">
        <div className="form-header">
          <button className="form-back-btn" onClick={handleBackToList}>
            ← Notes
          </button>
          {editingNote.entryTitle && (
            <span className="notes-entry-ref" title={`Linked to: ${editingNote.entryTitle}`}>
              ↗ {editingNote.entryTitle}
            </span>
          )}
        </div>
        <div className="notes-editor">
          <input
            className="notes-title-input"
            placeholder="Title (optional)"
            value={editingNote.title ?? ""}
            onChange={(e) => handleNoteChange("title", e.target.value)}
          />
          <textarea
            className="notes-body-input"
            placeholder="Write your note..."
            value={editingNote.body}
            onChange={(e) => handleNoteChange("body", e.target.value)}
            autoFocus
          />
        </div>
        <div className="notes-editor-footer">
          {deleteConfirm ? (
            <>
              <span className="notes-delete-confirm-text">Delete this note?</span>
              <button className="btn-danger notes-action-btn" onClick={handleDelete}>
                Confirm delete
              </button>
              <button
                className="btn-secondary notes-action-btn"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-secondary notes-action-btn"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </button>
              <span className="notes-save-status">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved"}
              </span>
              <button
                className="btn-primary notes-action-btn"
                onClick={async () => {
                  if (editingNote) {
                    await saveNote(editingNote);
                    handleBackToList();
                  }
                }}
                disabled={saveStatus === "saving"}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="notes-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onBack}>
          ← Back
        </button>
        <span className="form-title">Notes</span>
        <button className="btn-secondary notes-new-btn" onClick={handleCreate}>
          + New
        </button>
      </div>
      <div className="notes-list-header">
        <input
          className="form-input notes-search-input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={`btn-secondary notes-sort-btn${sortOrder === "newest" ? " active" : ""}`}
          onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
        >
          {sortOrder === "newest" ? "Newest" : "Oldest"}
        </button>
      </div>
      <div className="notes-list">
        {filteredNotes.length === 0 && (
          <div className="empty-state">
            <p>
              {search
                ? "No notes match your search."
                : "No notes yet. Add one to get started."}
            </p>
          </div>
        )}
        {filteredNotes.map((note) => (
          <button key={note.id} className="notes-list-item" onClick={() => handleOpenNote(note)}>
            <div className="notes-list-title">
              {note.title || <em>Untitled</em>}
            </div>
            {note.entryTitle && (
              <div className="notes-list-entry-ref">↗ {note.entryTitle}</div>
            )}
            <div className="notes-list-body">
              {note.body.slice(0, 80) || "Empty note"}
            </div>
            <div className="notes-list-date">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
