import { useState } from "react";

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "previewing"; totalRows: number; previewRows: PreviewRow[]; skippedCount: number; errors: string[] }
  | { status: "committing" }
  | { status: "done"; imported: number; updated: number; skipped: number; errors: string[] }
  | { status: "error"; message: string };

interface PreviewRow {
  title: string;
  vertical: string;
  type: string;
  hasBody: boolean;
  hasUrl: boolean;
  tags: string;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export default function ImportScreen({ onComplete, onCancel }: Props) {
  const [state, setState] = useState<ImportState>({ status: "idle" });

  async function handleChooseFile() {
    setState({ status: "loading" });
    try {
      const result = await window.shortpath.previewCsvImport();
      if (!result.success) {
        const msg = result.errors?.[0] ?? "Failed to open file.";
        setState({ status: "error", message: msg });
        return;
      }
      setState({
        status: "previewing",
        totalRows: result.totalRows ?? 0,
        previewRows: result.previewRows ?? [],
        skippedCount: result.skippedCount ?? 0,
        errors: result.errors ?? [],
      });
    } catch {
      setState({ status: "error", message: "Failed to open file." });
    }
  }

  async function handleConfirm() {
    setState({ status: "committing" });
    try {
      const result = await window.shortpath.commitCsvImport();
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

  async function handleDownloadTemplate() {
    await window.shortpath.downloadTemplateCsv();
  }

  const isBusy = state.status === "loading" || state.status === "committing";

  return (
    <div className="entry-form-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={isBusy}>
          Back
        </button>
        <span className="form-title">Import CSV</span>
      </div>

      <div className="form-body import-body">
        {state.status === "idle" && (
          <div className="import-idle">
            <div className="import-format-ref">
              <p className="import-format-title">Expected format</p>
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
              <p className="import-format-note">* body or url required; both allowed</p>
            </div>

            <div className="import-actions">
              <button className="btn-secondary import-template-btn" onClick={handleDownloadTemplate}>
                Download template
              </button>
              <button className="btn-primary" onClick={handleChooseFile}>
                Choose CSV file...
              </button>
            </div>
          </div>
        )}

        {state.status === "loading" && (
          <div className="import-status-msg">Reading file...</div>
        )}

        {state.status === "previewing" && (
          <div className="import-preview">
            <p className="import-preview-summary">
              <strong>{state.totalRows}</strong> row{state.totalRows !== 1 ? "s" : ""} found
              {state.skippedCount > 0 && (
                <span className="import-skip-count"> — {state.skippedCount} will be skipped</span>
              )}
            </p>

            {state.previewRows.length > 0 && (
              <ul className="import-preview-rows">
                {state.previewRows.map((row, i) => (
                  <li key={i} className="import-preview-row">
                    <span className="preview-row-vertical">{row.vertical}</span>
                    <span className="preview-row-title">{row.title}</span>
                    <span className="preview-row-type">{row.type}</span>
                  </li>
                ))}
                {state.totalRows > state.previewRows.length && (
                  <li className="import-preview-more">
                    + {state.totalRows - state.previewRows.length} more...
                  </li>
                )}
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
                Import {state.totalRows - state.skippedCount} rows
              </button>
            </div>
          </div>
        )}

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
