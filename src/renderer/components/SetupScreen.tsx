import { useState } from "react";

const SYNC_TUTORIAL = `1. Pick a folder your cloud service already syncs (Google Drive, Dropbox, OneDrive). Everyone on the team needs access to it.
2. Put the team CSV in that folder using the ShortPath CSV template. One person owns the master file.
3. In Settings → Shared file sync, click "Configure sync file" and select that CSV from inside the synced folder.
4. When the owner updates the file and the cloud service syncs it down, ShortPath reloads automatically. Use "Refresh now" if a change doesn't appear.
Note: local entries are never touched by sync. To contribute your own entries, use "Export mine" in Settings and send it to the file owner. Any edits you make to synced entries in ShortPath won't stick — ShortPath doesn't write back to the shared file.`;

interface Props {
  onComplete: (mode: "local" | "sync", name?: string) => void;
}

export default function SetupScreen({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceName, setSourceName] = useState("");

  function handleLocal() {
    void window.shortpath.saveSourceMode("local");
    onComplete("local", undefined);
  }

  function handleSyncContinue() {
    const name = sourceName.trim();
    void window.shortpath.saveSourceMode("sync", name);
    onComplete("sync", name);
  }

  return (
    <div className="setup-shell">
      <div className="setup-body">
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
      </div>
    </div>
  );
}
