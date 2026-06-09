import { useState, useCallback, useMemo } from "react";
import type { ColumnMapping, Entry } from "@shared/types";

type RowResolution = "skip" | "overwrite" | "import-as-new";

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "needsMapping"; availableColumns: string[] }
  | { status: "previewing"; totalRows: number; previewRows: PreviewRow[]; skippedCount: number; errors: string[] }
  | { status: "committing" }
  | { status: "done"; imported: number; updated: number; skipped: number; errors: string[] }
  | { status: "error"; message: string };

interface PreviewRow {
  rowIndex: number;
  title: string;
  vertical: string;
  type: string;
  hasBody: boolean;
  hasUrl: boolean;
  tags: string;
}

const FIELDS: { key: keyof ColumnMapping; label: string; required: boolean; note?: string }[] = [
  { key: "title",     label: "Title",      required: true },
  { key: "vertical",  label: "Vertical",   required: true },
  { key: "type",      label: "Type",       required: false, note: 'Defaults to "reply" if not mapped' },
  { key: "body",      label: "Body",       required: false },
  { key: "url",       label: "URL",        required: false },
  { key: "tags",      label: "Tags",       required: false },
  { key: "subfolder", label: "Sub-folder", required: false },
];

interface Props {
  onComplete: () => void;
  onCancel: () => void;
  existingEntries: Entry[];
}

export default function ImportScreen({ onComplete, onCancel, existingEntries }: Props) {
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: null, vertical: null, type: null,
    body: null, url: null, tags: null, subfolder: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [resolutions, setResolutions] = useState<Record<number, RowResolution>>({});

  // Build a lookup set of "vertical:::title" keys for fast duplicate detection.
  const existingKeys = useMemo(
    () => new Set(existingEntries.map((e) => `${e.vertical}:::${e.title.toLowerCase().trim()}`)),
    [existingEntries]
  );

  function isDuplicate(row: PreviewRow) {
    return existingKeys.has(`${row.vertical.toLowerCase()}:::${row.title.toLowerCase().trim()}`);
  }

  function setResolution(rowIndex: number, res: RowResolution) {
    setResolutions((prev) => ({ ...prev, [rowIndex]: res }));
  }

  async function stageResult(result: Awaited<ReturnType<typeof window.shortpath.previewCsvImport>>) {
    if (!result.success) {
      const msg = result.errors?.[0] ?? "Failed to open file.";
      setState({ status: "error", message: msg });
      return;
    }
    if (result.needsMapping) {
      const cols = result.availableColumns ?? [];
      setMapping({ title: null, vertical: null, type: null, body: null, url: null, tags: null, subfolder: null });
      setState({ status: "needsMapping", availableColumns: cols });
      return;
    }
    setResolutions({});
    setState({
      status: "previewing",
      totalRows: result.totalRows ?? 0,
      previewRows: result.previewRows ?? [],
      skippedCount: result.skippedCount ?? 0,
      errors: result.errors ?? [],
    });
  }

  async function handleChooseFile() {
    setState({ status: "loading" });
    try {
      const result = await window.shortpath.previewCsvImport();
      await stageResult(result);
    } catch {
      setState({ status: "error", message: "Failed to open file." });
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const filePath = (file as File & { path: string }).path;
    if (!filePath?.toLowerCase().endsWith(".csv")) {
      setState({ status: "error", message: "Please drop a CSV file (.csv)." });
      return;
    }
    setState({ status: "loading" });
    try {
      const result = await window.shortpath.stageCsvFile(filePath);
      await stageResult(result);
    } catch {
      setState({ status: "error", message: "Failed to read file." });
    }
  }, []);

  async function handleApplyMapping() {
    setState({ status: "loading" });
    try {
      const result = await window.shortpath.previewCsvWithMapping(mapping);
      if (!result.success) {
        setState({ status: "error", message: result.errors?.[0] ?? "Mapping failed." });
        return;
      }
      setResolutions({});
      setState({
        status: "previewing",
        totalRows: result.totalRows ?? 0,
        previewRows: result.previewRows ?? [],
        skippedCount: result.skippedCount ?? 0,
        errors: result.errors ?? [],
      });
    } catch {
      setState({ status: "error", message: "Failed to apply mapping." });
    }
  }

  async function handleConfirm() {
    setState({ status: "committing" });
    try {
      const result = await window.shortpath.commitCsvImport(resolutions);
      if (!result.success) {
        setState({ status: "error", message: result.errors?.[0] ?? "Import failed." });
        return;
      }
      setState({
        status: "done",
        imported: result.imported ?? 0,
        updated: result.updated ?? 0,
        skipped: result.skipped ?? 0,
        errors: result.errors ?? [],
      });
    } catch {
      setState({ status: "error", message: "Import failed." });
    }
  }

  const isBusy = state.status === "loading" || state.status === "committing";
  const canApplyMapping = mapping.title !== null && mapping.vertical !== null;

  return (
    <div className="entry-form-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={isBusy}>
          ← Back
        </button>
        <span className="form-title">Import CSV</span>
      </div>

      <div className="form-body import-body">
        {state.status === "idle" && (
          <div className="import-idle">
            <div
              className={`import-dropzone${isDragOver ? " drag-over" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span className="import-dropzone-icon">⬆</span>
              <span className="import-dropzone-text">Drop a CSV file here</span>
              <span className="import-dropzone-or">or</span>
              <button className="btn-primary import-choose-btn" onClick={handleChooseFile}>
                Choose file...
              </button>
            </div>

            <div className="import-format-ref">
              <p className="import-format-title">Expected columns</p>
              <table className="import-format-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>title</td><td>Yes</td><td>Short label</td></tr>
                  <tr><td>vertical</td><td>Yes</td><td>Category name</td></tr>
                  <tr><td>type</td><td>Yes</td><td>reply, doc, sop, link, tool</td></tr>
                  <tr><td>body</td><td>*</td><td>Full text content</td></tr>
                  <tr><td>url</td><td>*</td><td>Link or resource URL</td></tr>
                  <tr><td>subfolder</td><td>No</td><td>Folder name within the vertical</td></tr>
                  <tr><td>tags</td><td>No</td><td>pipe|separated|tags</td></tr>
                </tbody>
              </table>
              <p className="import-format-note">* body or url required; both allowed. Column names are not case-sensitive.</p>
              <p className="import-format-note">If your column names differ, ShortPath will ask you to map them after you choose a file.</p>
            </div>

            <div className="import-actions">
              <button className="btn-secondary import-template-btn" onClick={() => void window.shortpath.downloadTemplateCsv()}>
                Download template
              </button>
            </div>
          </div>
        )}

        {state.status === "loading" && (
          <div className="import-status-msg">Reading file...</div>
        )}

        {state.status === "needsMapping" && (
          <div className="import-mapping">
            <p className="import-mapping-title">Map your columns</p>
            <p className="import-mapping-desc">
              Your CSV uses different column names. Assign each ShortPath field to a column in your file.
            </p>
            <table className="column-mapper-table">
              <thead>
                <tr>
                  <th>ShortPath field</th>
                  <th>Your column</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map(({ key, label, required, note }) => (
                  <tr key={key}>
                    <td>
                      <span className="mapper-field-label">{label}</span>
                      {required && <span className="required"> *</span>}
                      {note && <span className="mapper-field-note">{note}</span>}
                    </td>
                    <td>
                      <select
                        className="form-select mapper-select"
                        value={mapping[key] ?? ""}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value || null }))}
                      >
                        <option value="">— Not included —</option>
                        {state.availableColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-footer">
              <button className="btn-secondary" onClick={() => setState({ status: "idle" })}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApplyMapping} disabled={!canApplyMapping}>
                Preview with this mapping
              </button>
            </div>
          </div>
        )}

        {state.status === "previewing" && (() => {
          const duplicateCount = state.previewRows.filter((r) => isDuplicate(r)).length;
          // Rows counted as skipped: invalid rows + duplicate rows with "skip" resolution
          const skippedDuplicates = state.previewRows.filter(
            (r) => isDuplicate(r) && (resolutions[r.rowIndex] ?? "skip") === "skip"
          ).length;
          const effectiveSkipped = state.skippedCount + skippedDuplicates;
          const importCount = state.totalRows - effectiveSkipped;
          return (
            <div className="import-preview">
              <p className="import-preview-summary">
                <strong>{state.totalRows}</strong> row{state.totalRows !== 1 ? "s" : ""} found
                {effectiveSkipped > 0 && (
                  <span className="import-skip-count"> — {effectiveSkipped} will be skipped</span>
                )}
                {duplicateCount > 0 && (
                  <span className="import-dup-count"> — {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} flagged</span>
                )}
              </p>

              {state.previewRows.length > 0 && (
                <ul className="import-preview-rows">
                  {state.previewRows.map((row) => {
                    const dup = isDuplicate(row);
                    const res: RowResolution = resolutions[row.rowIndex] ?? (dup ? "skip" : "import-as-new");
                    return (
                      <li key={row.rowIndex} className={`import-preview-row${dup ? " is-duplicate" : ""}`}>
                        <span className="preview-row-vertical">{row.vertical}</span>
                        <span className="preview-row-title">{row.title}</span>
                        <span className="preview-row-type">{row.type}</span>
                        {dup && (
                          <>
                            <span className="preview-dup-badge">Duplicate</span>
                            <select
                              className="preview-dup-select"
                              value={res}
                              onChange={(e) => setResolution(row.rowIndex, e.target.value as RowResolution)}
                            >
                              <option value="skip">Skip</option>
                              <option value="overwrite">Overwrite</option>
                              <option value="import-as-new">Import as new</option>
                            </select>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {state.errors.length > 0 && (
                <div className="import-error-list">
                  <p className="import-error-heading">Issues found:</p>
                  <ul>
                    {state.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {state.errors.length > 5 && (
                      <li>+ {state.errors.length - 5} more issues</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="form-footer">
                <button className="btn-secondary" onClick={() => setState({ status: "idle" })}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleConfirm}>
                  Import {importCount} row{importCount !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          );
        })()}

        {state.status === "committing" && (
          <div className="import-status-msg">Importing...</div>
        )}

        {state.status === "done" && (
          <div className="import-done">
            <p className="import-done-title">Import complete</p>
            <ul className="import-done-stats">
              <li><strong>{state.imported}</strong> added</li>
              <li><strong>{state.updated}</strong> updated</li>
              {state.skipped > 0 && <li><strong>{state.skipped}</strong> skipped</li>}
            </ul>
            {state.errors.length > 0 && (
              <div className="import-error-list">
                {state.errors.slice(0, 3).map((err, i) => <p key={i}>{err}</p>)}
              </div>
            )}
            <div className="form-footer">
              <button className="btn-primary" onClick={onComplete}>Done</button>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="import-error-state">
            <p className="import-error-msg">{state.message}</p>
            <div className="form-footer">
              <button className="btn-secondary" onClick={() => setState({ status: "idle" })}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
