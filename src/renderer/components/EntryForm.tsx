import React, { useState, useMemo } from "react";
import type { Entry, Vertical, SubFolder, CapturePayload } from "@shared/types";
import RichTextEditor from "./RichTextEditor";
import { Readability } from "@mozilla/readability";

interface Props {
  entry?: Entry;
  verticals: Vertical[];
  allEntries?: Entry[];
  onSave: (entry: Entry, newVerticals: Vertical[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  quickAdd?: boolean;
  prefillBody?: string;
  defaultVerticalId?: string;
  capturePayload?: CapturePayload;  // pre-fill from browser extension capture
}

interface UrlSection { heading: string; body: string }

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

export default function EntryForm({ entry, verticals, allEntries, onSave, onDelete, onCancel, quickAdd, prefillBody, defaultVerticalId, capturePayload }: Props) {
  const isEdit = !!entry;

  const [title, setTitle] = useState(entry?.title ?? capturePayload?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? prefillBody ?? capturePayload?.body ?? "");
  const [link, setLink] = useState(entry?.link ?? "");
  const [tags, setTags] = useState(entry?.tags ?? "");
  const [type, setType] = useState<Entry["type"]>(entry?.type ?? "reply");
  const [copyMode, setCopyMode] = useState<"plain" | "html">(entry?.copyMode ?? "plain");
  const [verticalId, setVerticalId] = useState(entry?.vertical ?? defaultVerticalId ?? "saved-replies");
  const [subFolderId, setSubFolderId] = useState(entry?.subFolderId ?? "");
  const [isNewVertical, setIsNewVertical] = useState(false);
  const [newVerticalLabel, setNewVerticalLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [titleDupWarning, setTitleDupWarning] = useState("");

  // URL import state
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlImportStatus, setUrlImportStatus] = useState<"idle" | "loading" | "preview" | "error">("idle");
  const [urlExtractedText, setUrlExtractedText] = useState("");
  const [urlImportError, setUrlImportError] = useState("");

  const capturedFromUrl = capturePayload?.url ?? entry?.sourceUrl ?? "";

  const selectedVertical = useMemo(
    () => verticals.find((v) => v.id === (isNewVertical ? "" : verticalId)),
    [verticals, verticalId, isNewVertical]
  );
  const flatSubFolders = useMemo(() => {
    function flatten(subs: SubFolder[] | undefined, depth: number): Array<{ id: string; label: string; depth: number }> {
      return (subs ?? []).flatMap((sf) => [{ id: sf.id, label: sf.label, depth }, ...flatten(sf.subFolders, depth + 1)]);
    }
    return flatten(selectedVertical?.subFolders, 0);
  }, [selectedVertical]);

  const finalVerticalId = isNewVertical ? slugify(newVerticalLabel) : verticalId;

  function handleTitleBlur() {
    if (isEdit || !allEntries || !title.trim()) { setTitleDupWarning(""); return; }
    const vid = isNewVertical ? slugify(newVerticalLabel) : verticalId;
    const dup = allEntries.find(
      (e) => e.vertical === vid && e.title.toLowerCase().trim() === title.toLowerCase().trim()
    );
    if (dup) {
      const vLabel = verticals.find((v) => v.id === vid)?.label ?? vid;
      setTitleDupWarning(`An entry with this title already exists in ${vLabel}.`);
    } else {
      setTitleDupWarning("");
    }
  }

  async function handleFetchUrl() {
    if (!importUrl.trim()) return;
    setUrlImportStatus("loading");
    try {
      const result = await window.shortpath.fetchUrlContent(importUrl.trim());
      if ("error" in result) {
        setUrlImportError(result.error);
        setUrlImportStatus("error");
        return;
      }
      // Parse in the renderer using native DOMParser + Readability
      const doc = new DOMParser().parseFromString(result.html, "text/html");
      // Set the base URL so Readability can resolve relative URLs
      const base = doc.createElement("base");
      base.href = result.finalUrl;
      doc.head.appendChild(base);
      const article = new Readability(doc).parse();
      if (!article?.content) {
        setUrlImportError("Could not extract readable content from this page.");
        setUrlImportStatus("error");
        return;
      }
      const contentDoc = new DOMParser().parseFromString(article.content, "text/html");
      const sections = splitByHeadings(contentDoc, article.title ?? "");
      // Combine sections into a single editable text block
      const combined = sections
        .map((s) => (s.heading && s.heading !== article.title ? `${s.heading}\n\n${s.body}` : s.body))
        .join("\n\n")
        .trim();
      setUrlExtractedText(combined);
      if (!title.trim() && article.title) setTitle(article.title);
      setUrlImportStatus("preview");
    } catch (err) {
      setUrlImportError(String(err));
      setUrlImportStatus("error");
    }
  }

  function splitByHeadings(doc: Document, fallbackTitle: string): UrlSection[] {
    const sections: UrlSection[] = [];
    let currentHeading = fallbackTitle;
    const bodyParts: string[] = [];

    for (const node of Array.from(doc.body.childNodes)) {
      const el = node as HTMLElement;
      const tag = el.tagName?.toUpperCase();
      if (tag === "H2" || tag === "H3") {
        const text = bodyParts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
        if (text) sections.push({ heading: currentHeading, body: text });
        currentHeading = el.textContent?.trim() ?? "";
        bodyParts.length = 0;
      } else {
        const t = el.textContent?.trim();
        if (t) bodyParts.push(t);
      }
    }
    const finalText = bodyParts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (finalText) sections.push({ heading: currentHeading, body: finalText });
    return sections.length > 0 ? sections : [{ heading: fallbackTitle, body: doc.body.textContent?.trim() ?? "" }];
  }

  function applyUrlText() {
    setBody(urlExtractedText);
    setShowUrlImport(false);
    setUrlImportStatus("idle");
  }

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
        copyMode,
        sourceUrl: capturedFromUrl || undefined,
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

        {flatSubFolders.length > 0 && (
          <div className="form-field">
            <label className="form-label">Sub-folder</label>
            <select
              className="form-select"
              value={subFolderId}
              onChange={(e) => setSubFolderId(e.target.value)}
              disabled={saving}
            >
              <option value="">— None —</option>
              {flatSubFolders.map(({ id, label, depth }) => (
                <option key={id} value={id}>
                  {depth > 0 ? `${"  ".repeat(depth)}↳ ` : ""}{label}
                </option>
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
            onChange={(e) => { setTitle(e.target.value); if (titleDupWarning) setTitleDupWarning(""); }}
            onBlur={handleTitleBlur}
            placeholder="Short descriptive label"
            disabled={saving}
            autoFocus={!isNewVertical}
          />
          {titleDupWarning && <p className="form-dup-warning">{titleDupWarning}</p>}
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

        {capturedFromUrl && (
          <div className="form-field">
            <label className="form-label">Captured from</label>
            <p className="capture-source-url">{capturedFromUrl}</p>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">Body</label>
          {!showUrlImport && (
            <button
              type="button"
              className="url-import-toggle"
              onClick={() => { setShowUrlImport(true); setUrlImportStatus("idle"); }}
            >
              Import from URL
            </button>
          )}
          {showUrlImport && (
            <div className="url-import-panel">
              <div className="url-import-row">
                <input
                  className="form-input url-import-input"
                  type="url"
                  placeholder="https://..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); void handleFetchUrl(); }
                    if (e.key === "Escape") { setShowUrlImport(false); setUrlImportStatus("idle"); }
                  }}
                  disabled={urlImportStatus === "loading"}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-secondary url-import-fetch-btn"
                  onClick={() => void handleFetchUrl()}
                  disabled={urlImportStatus === "loading" || !importUrl.trim()}
                >
                  {urlImportStatus === "loading" ? "Fetching..." : "Fetch"}
                </button>
                <button
                  type="button"
                  className="url-import-dismiss"
                  onClick={() => { setShowUrlImport(false); setUrlImportStatus("idle"); }}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
              {urlImportStatus === "error" && (
                <p className="url-import-error">{urlImportError}</p>
              )}
              {urlImportStatus === "preview" && (
                <div className="url-preview">
                  <p className="url-preview-hint">Edit or trim the text below, then click "Use this text".</p>
                  <textarea
                    className="url-preview-textarea"
                    value={urlExtractedText}
                    onChange={(e) => setUrlExtractedText(e.target.value)}
                    rows={8}
                  />
                  <div className="url-preview-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setShowUrlImport(false); setUrlImportStatus("idle"); }}
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={applyUrlText}
                      disabled={!urlExtractedText.trim()}
                    >
                      Use this text
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Full text content (saved reply, doc, process steps)"
            disabled={saving}
          />
          <div className="copy-mode-row">
            <span className="copy-mode-label">Copy as:</span>
            <label className={`copy-mode-option${copyMode === "plain" ? " selected" : ""}`}>
              <input
                type="radio"
                name="copyMode"
                value="plain"
                checked={copyMode === "plain"}
                onChange={() => setCopyMode("plain")}
                disabled={saving}
              />
              Plain text
            </label>
            <label className={`copy-mode-option${copyMode === "html" ? " selected" : ""}`}>
              <input
                type="radio"
                name="copyMode"
                value="html"
                checked={copyMode === "html"}
                onChange={() => setCopyMode("html")}
                disabled={saving}
              />
              HTML
            </label>
          </div>
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
