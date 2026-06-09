import { useState, useEffect } from "react";
import type { Vertical, SubFolder } from "@shared/types";

interface Section {
  title: string;
  body: string;
  selected: boolean;
}

interface Props {
  filePath: string;
  verticals: Vertical[];
  onComplete: () => void;
  onCancel: () => void;
}

type Status = "loading" | "ready" | "importing" | "done" | "error";

type SubFolderFlat = { id: string; label: string; depth: number };

function flattenSubFolders(subs: SubFolder[] | undefined, depth = 0): SubFolderFlat[] {
  return (subs ?? []).flatMap((s) => [
    { id: s.id, label: s.label, depth },
    ...flattenSubFolders(s.subFolders, depth + 1),
  ]);
}

export default function PdfImportScreen({ filePath, verticals, onComplete, onCancel }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [verticalId, setVerticalId] = useState(verticals[0]?.id ?? "saved-replies");
  const [subFolderId, setSubFolderId] = useState("");
  const [imported, setImported] = useState(0);

  const selectedVertical = verticals.find((v) => v.id === verticalId);
  const flatSubFolders = flattenSubFolders(selectedVertical?.subFolders);

  useEffect(() => {
    window.shortpath
      .previewPdfImport(filePath)
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
          setStatus("error");
        } else {
          setSections(result.sections);
          setStatus("ready");
        }
      })
      .catch((err: unknown) => {
        setError(String(err));
        setStatus("error");
      });
  }, [filePath]);

  function toggleSection(i: number) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, selected: !s.selected } : s)));
  }

  function toggleAll(selected: boolean) {
    setSections((prev) => prev.map((s) => ({ ...s, selected })));
  }

  async function handleImport() {
    const toImport = sections.filter((s) => s.selected);
    if (toImport.length === 0) return;
    setStatus("importing");
    const entries = toImport.map((s) => ({
      vertical: verticalId,
      title: s.title,
      body: s.body || null,
      link: null as string | null,
      tags: "",
      type: "doc" as const,
      subFolderId: subFolderId || undefined,
    }));
    try {
      await window.shortpath.commitPdfImport(entries);
      setImported(entries.length);
      setStatus("done");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  const checkedCount = sections.filter((s) => s.selected).length;

  return (
    <div className="md-import-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={status === "importing"}>
          ← Back
        </button>
        <span className="form-title">Import PDF</span>
      </div>

      <div className="form-body import-body">
        {status === "loading" && <div className="import-status-msg">Reading PDF...</div>}

        {status === "error" && (
          <div className="import-error-state">
            <p className="import-error-msg">{error}</p>
            <div className="form-footer">
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        )}

        {status === "ready" && sections.length === 0 && (
          <div className="import-status-msg">
            No text could be extracted. Scanned (image-only) PDFs are not supported.
          </div>
        )}

        {status === "ready" && sections.length > 0 && (
          <>
            <div className="md-import-controls">
              <div className="form-field">
                <label className="form-label">Import to vertical</label>
                <select
                  className="form-select"
                  value={verticalId}
                  onChange={(e) => { setVerticalId(e.target.value); setSubFolderId(""); }}
                >
                  {verticals.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
              {flatSubFolders.length > 0 && (
                <div className="form-field">
                  <label className="form-label">Sub-folder (optional)</label>
                  <select
                    className="form-select"
                    value={subFolderId}
                    onChange={(e) => setSubFolderId(e.target.value)}
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
            </div>

            <p className="md-pdf-note">Text extraction is best-effort. Sections are detected automatically and may vary by PDF.</p>

            <div className="md-section-controls">
              <span className="md-section-count">{checkedCount} of {sections.length} selected</span>
              <button type="button" className="btn-link" onClick={() => toggleAll(true)}>All</button>
              <button type="button" className="btn-link" onClick={() => toggleAll(false)}>None</button>
            </div>

            <ul className="md-section-list">
              {sections.map((s, i) => (
                <li key={i} className={`md-section-row${s.selected ? " selected" : ""}`}>
                  <label className="md-section-label">
                    <input
                      type="checkbox"
                      checked={s.selected}
                      onChange={() => toggleSection(i)}
                    />
                    <span className="md-section-title">{s.title}</span>
                  </label>
                  <span className="md-section-preview">
                    {s.body.slice(0, 80)}{s.body.length > 80 ? "…" : ""}
                  </span>
                </li>
              ))}
            </ul>

            <div className="form-footer">
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn-primary" onClick={() => void handleImport()} disabled={checkedCount === 0}>
                Import {checkedCount} section{checkedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}

        {status === "importing" && <div className="import-status-msg">Importing...</div>}

        {status === "done" && (
          <div className="import-done">
            <p className="import-done-title">Import complete</p>
            <ul className="import-done-stats">
              <li><strong>{imported}</strong> section{imported !== 1 ? "s" : ""} added</li>
            </ul>
            <div className="form-footer">
              <button className="btn-primary" onClick={onComplete}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
