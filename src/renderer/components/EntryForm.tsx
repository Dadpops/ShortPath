import React, { useState, useMemo } from "react";
import type { Entry, Vertical } from "@shared/types";

interface Props {
  entry?: Entry;        // undefined = add mode
  verticals: Vertical[];
  onSave: (entry: Entry, newVerticals: Vertical[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  quickAdd?: boolean;           // hides type/tags behind "More options" toggle
  prefillBody?: string;         // pre-populate body field (e.g. from clipboard)
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeTags(raw: string): string {
  return raw
    .split(/[|,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .join("|");
}

export default function EntryForm({ entry, verticals, onSave, onDelete, onCancel, quickAdd, prefillBody }: Props) {
  const isEdit = !!entry;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? prefillBody ?? "");
  const [link, setLink] = useState(entry?.link ?? "");
  const [tags, setTags] = useState(entry?.tags ?? "");
  const [type, setType] = useState<Entry["type"]>(entry?.type ?? "reply");
  const [verticalId, setVerticalId] = useState(entry?.vertical ?? "saved-replies");
  const [subFolderId, setSubFolderId] = useState(entry?.subFolderId ?? "");
  const [isNewVertical, setIsNewVertical] = useState(false);
  const [newVerticalLabel, setNewVerticalLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  const selectedVertical = useMemo(
    () => verticals.find((v) => v.id === (isNewVertical ? "" : verticalId)),
    [verticals, verticalId, isNewVertical]
  );
  const availableSubFolders = selectedVertical?.subFolders ?? [];

  const finalVerticalId = isNewVertical ? slugify(newVerticalLabel) : verticalId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required."); return; }
    if (isNewVertical && !newVerticalLabel.trim()) { setError("New vertical name is required."); return; }
    if (!finalVerticalId) { setError("Vertical ID could not be generated from that name."); return; }

    setSaving(true);
    try {
      const fields = {
        vertical: finalVerticalId,
        title: title.trim(),
        body: body.trim() || null,
        link: link.trim() || null,
        tags: tags.trim(),
        type,
        subFolderId: subFolderId || undefined,
      };

      if (isEdit && entry) {
        const updated = await window.shortpath.updateEntry(entry.id, fields);
        onSave(updated, verticals);
      } else {
        const result = await window.shortpath.createEntry(
          fields,
          isNewVertical ? newVerticalLabel.trim() : undefined
        );
        onSave(result.entry, result.verticals);
      }
    } catch (err) {
      setError("Failed to save. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setSaving(true);
    try {
      await window.shortpath.deleteEntry(entry.id);
      onDelete?.();
    } catch (err) {
      setError("Failed to delete. Please try again.");
      console.error(err);
      setSaving(false);
    }
  }

  function handleVerticalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "__new__") {
      setIsNewVertical(true);
      setNewVerticalLabel("");
    } else {
      setIsNewVertical(false);
      setVerticalId(e.target.value);
    }
    setSubFolderId(""); // reset sub-folder when vertical changes
  }

  return (
    <div className="entry-form-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={saving}>
          ← Back
        </button>
        <span className="form-title">{isEdit ? "Edit entry" : quickAdd ? "Quick add" : "Add entry"}</span>
        {isEdit && !confirmDelete && (
          <button className="form-delete-trigger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        )}
        {isEdit && confirmDelete && (
          <div className="delete-confirm">
            <button className="delete-confirm-yes" onClick={handleDelete} disabled={saving}>
              Confirm delete
            </button>
            <button className="delete-confirm-no" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="form-label">Vertical</label>
          <select
            className="form-select"
            value={isNewVertical ? "__new__" : verticalId}
            onChange={handleVerticalChange}
            disabled={saving}
          >
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
            <option value="__new__">+ New vertical...</option>
          </select>
          {isNewVertical && (
            <input
              className="form-input"
              type="text"
              placeholder="Vertical name (e.g. Escalation Scripts)"
              value={newVerticalLabel}
              onChange={(e) => setNewVerticalLabel(e.target.value)}
              disabled={saving}
              autoFocus
            />
          )}
        </div>

        {availableSubFolders.length > 0 && (
          <div className="form-field">
            <label className="form-label">Sub-folder</label>
            <select
              className="form-select"
              value={subFolderId}
              onChange={(e) => setSubFolderId(e.target.value)}
              disabled={saving}
            >
              <option value="">— None —</option>
              {availableSubFolders.map((sf) => (
                <option key={sf.id} value={sf.id}>{sf.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">Title <span className="required">*</span></label>
          <input
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short descriptive label"
            disabled={saving}
            autoFocus={!isNewVertical}
          />
        </div>

        {quickAdd && !isEdit && !showMore && (
          <button
            type="button"
            className="more-options-toggle"
            onClick={() => setShowMore(true)}
          >
            More options (type, tags) ▾
          </button>
        )}

        {(!quickAdd || isEdit || showMore) && (
          <div className="form-field">
            <label className="form-label">Type</label>
            <div className="type-options">
              {(["reply", "doc", "link", "sop", "tool"] as Entry["type"][]).map((t) => (
                <label key={t} className={`type-option${type === t ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    disabled={saving}
                  />
                  {t === "reply" ? "Reply" : t === "doc" ? "Doc" : t === "link" ? "Link" : t === "sop" ? "SOP" : "Tool"}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">Body</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full text content (saved reply, doc, process steps)"
            disabled={saving}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Link</label>
          <input
            className="form-input"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            disabled={saving}
          />
        </div>

        {(!quickAdd || isEdit || showMore) && (
          <div className="form-field">
            <label className="form-label">Tags</label>
            <input
              className="form-input"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={(e) => setTags(normalizeTags(e.target.value))}
              placeholder="billing|refund|payment"
              disabled={saving}
            />
            <p className="form-hint">Separated by | (e.g. billing | refund | password reset)</p>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-footer">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
