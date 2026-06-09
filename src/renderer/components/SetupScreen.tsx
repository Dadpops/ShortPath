import { useState, useCallback } from "react";

const SYNC_TUTORIAL = `1. Pick a folder your cloud service already syncs (Google Drive, Dropbox, OneDrive). Everyone on the team needs access to it.
2. Put the team CSV in that folder using the ShortPath CSV template. One person owns the master file.
3. In Settings → Shared file sync, click "Configure sync file" and select that CSV from inside the synced folder.
4. When the owner updates the file and the cloud service syncs it down, ShortPath reloads automatically. Use "Refresh now" if a change doesn't appear.
Note: local entries are never touched by sync. To contribute your own entries, use "Export mine" in Settings and send it to the file owner. Any edits you make to synced entries in ShortPath won't stick — ShortPath doesn't write back to the shared file.`;

interface Props {
  onComplete: (mode: "local" | "sync", name?: string) => void;
}

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "previewing"; totalRows: number; skippedCount: number; errors: string[] }
  | { status: "committing" }
  | { status: "done"; imported: number }
  | { status: "error"; message: string };

export default function SetupScreen({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sourceName, setSourceName] = useState("");
  const [sourceMode, setSourceMode] = useState<"local" | "sync">("local");
  const [importState, setImportState] = useState<ImportState>({ status: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  function handleLocal() {
    void window.shortpath.saveSourceMode("local");
    setSourceMode("local");
    setStep(3);
  }

  function handleSyncContinue() {
    const name = sourceName.trim();
    void window.shortpath.saveSourceMode("sync", name);
    setSourceMode("sync");
    setStep(3);
  }

  async function stageAndPreview(result: Awaited<ReturnType<typeof window.shortpath.previewCsvImport>>) {
    if (!result.success) {
      setImportState({ status: "error", message: result.errors?.[0] ?? "Failed to open file." });
      return;
    }
    if (result.needsMapping) {
      setImportState({ status: "error", message: "This CSV uses non-standard column names. Import it from Settings → Import CSV to map the columns." });
      return;
    }
    setImportState({
      status: "previewing",
      totalRows: result.totalRows ?? 0,
      skippedCount: result.skippedCount ?? 0,
      errors: result.errors ?? [],
    });
  }

  async function handleChooseFile() {
    setImportState({ status: "loading" });
    try {
      const result = await window.shortpath.previewCsvImport();
      await stageAndPreview(result);
    } catch {
      setImportState({ status: "error", message: "Failed to open file." });
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
      setImportState({ status: "error", message: "Please drop a CSV file (.csv)." });
      return;
    }
    setImportState({ status: "loading" });
    try {
      const result = await window.shortpath.stageCsvFile(filePath);
      await stageAndPreview(result);
    } catch {
      setImportState({ status: "error", message: "Failed to read file." });
    }
  }, []);

  async function handleImport() {
    setImportState({ status: "committing" });
    try {
      const result = await window.shortpath.commitCsvImport();
      if (!result.success) {
        setImportState({ status: "error", message: result.errors?.[0] ?? "Import failed." });
        return;
      }
      setImportState({ status: "done", imported: result.imported ?? 0 });
    } catch {
      setImportState({ status: "error", message: "Import failed." });
    }
  }

  const importBusy = importState.status === "loading" || importState.status === "committing";
  const importPreviewing = importState.status === "previewing";

  return (
    <div className="setup-shell">
      <div className="setup-body">

        {/* Step 1 — source mode */}
        {step === 1 && (
          <>
            <div>
              <div className="setup-title">Welcome to ShortPath</div>
              <div className="setup-subtitle">How will you be using it?</div>
            </div>
            <div className="setup-choices">
              <button className="setup-choice-btn" onClick={handleLocal}>
                <span className="setup-choice-label">Local (just me)</span>
                <span className="setup-choice-desc">Your entries stay on this machine. No sharing needed.</span>
              </button>
              <button className="setup-choice-btn" onClick={() => setStep(2)}>
                <span className="setup-choice-label">File Share Sync (my team uses a shared CSV)</span>
                <span className="setup-choice-desc">Point ShortPath at a shared file in Dropbox, Drive, or OneDrive. Team entries sync automatically.</span>
              </button>
            </div>
          </>
        )}

        {/* Step 2 — sync name (sync flow only) */}
        {step === 2 && (
          <>
            <div>
              <button className="form-back-btn" onClick={() => setStep(1)}>← Back</button>
              <div className="setup-title" style={{ marginTop: "12px" }}>File Share Sync setup</div>
              <div className="setup-subtitle">Give your team a name so you know whose entries you are syncing.</div>
            </div>

            <div className="form-field">
              <label className="form-label">Source name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Acme Support Team"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="setup-tutorial">{SYNC_TUTORIAL}</div>

            <button
              className="btn-primary"
              onClick={handleSyncContinue}
              disabled={sourceName.trim().length === 0}
              style={{ alignSelf: "flex-start" }}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 3 — optional import */}
        {step === 3 && (
          <>
            <div>
              <button className="form-back-btn" onClick={() => setStep(sourceMode === "sync" ? 2 : 1)}>← Back</button>
              <div className="setup-title" style={{ marginTop: "12px" }}>Add your entries (optional)</div>
              <div className="setup-subtitle">
                Import a CSV if you have saved replies or docs from another tool. You can always do this later from Settings.
              </div>
            </div>

            {importState.status === "idle" && (
              <>
                <div
                  className={`import-dropzone${isDragOver ? " drag-over" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <span className="import-dropzone-icon">⬆</span>
                  <span className="import-dropzone-text">Drop a CSV file here</span>
                  <span className="import-dropzone-or">or</span>
                  <button className="btn-secondary" onClick={handleChooseFile}>
                    Choose file...
                  </button>
                </div>
                <button
                  className="btn-secondary"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => void window.shortpath.downloadTemplateCsv()}
                >
                  Download template
                </button>
              </>
            )}

            {importState.status === "loading" && (
              <div className="import-status-msg">Reading file...</div>
            )}

            {importState.status === "previewing" && (
              <div className="setup-import-preview">
                <p className="import-preview-summary">
                  <strong>{importState.totalRows}</strong> row{importState.totalRows !== 1 ? "s" : ""} ready to import
                  {importState.skippedCount > 0 && (
                    <span className="import-skip-count"> ({importState.skippedCount} will be skipped)</span>
                  )}
                </p>
                {importState.errors.length > 0 && (
                  <p className="setup-import-errors">{importState.errors.length} row{importState.errors.length !== 1 ? "s" : ""} with issues (will be skipped)</p>
                )}
                <div className="form-footer" style={{ marginTop: 8 }}>
                  <button className="btn-secondary" onClick={() => setImportState({ status: "idle" })}>
                    Choose different file
                  </button>
                  <button className="btn-primary" onClick={handleImport}>
                    Import {importState.totalRows - importState.skippedCount} rows
                  </button>
                </div>
              </div>
            )}

            {importState.status === "committing" && (
              <div className="import-status-msg">Importing...</div>
            )}

            {importState.status === "done" && (
              <div className="setup-import-done">
                <p>Added <strong>{importState.imported}</strong> {importState.imported === 1 ? "entry" : "entries"}.</p>
              </div>
            )}

            {importState.status === "error" && (
              <div className="setup-import-error">
                <p>{importState.message}</p>
                <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setImportState({ status: "idle" })}>
                  Try again
                </button>
              </div>
            )}

            <div className="setup-step3-actions">
              <button
                className="btn-primary"
                onClick={() => setStep(4)}
                disabled={importBusy}
              >
                {importPreviewing || importState.status === "done" ? "Continue" : "Skip for now"}
              </button>
            </div>
          </>
        )}

        {/* Step 4 — done */}
        {step === 4 && (
          <>
            <div className="setup-done-header">
              <div className="setup-title">You're ready</div>
              <div className="setup-subtitle">Here's how to get started.</div>
            </div>

            <ul className="setup-tips">
              <li className="setup-tip">
                <span className="setup-tip-hotkey">Ctrl+Shift+Space</span>
                <span className="setup-tip-text">Open ShortPath from anywhere on your desktop</span>
              </li>
              <li className="setup-tip">
                <span className="setup-tip-key">Type</span>
                <span className="setup-tip-text">Search all your entries at once — saved replies, docs, SOPs, tools</span>
              </li>
              <li className="setup-tip">
                <span className="setup-tip-key">+</span>
                <span className="setup-tip-text">Use the + button to add an entry in under 10 seconds</span>
              </li>
            </ul>

            <button
              className="btn-primary"
              style={{ alignSelf: "flex-start" }}
              onClick={() => onComplete(sourceMode, sourceName.trim() || undefined)}
            >
              Start using ShortPath
            </button>
          </>
        )}

      </div>
    </div>
  );
}
