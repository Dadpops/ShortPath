import { useState } from "react";
import { formatAccelerator } from "@shared/platform";

interface Props {
  hotkey: string;
  onComplete: () => void;
}

const STEPS = 4;

export default function OnboardingOverlay({ hotkey, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [installedSample, setInstalledSample] = useState(false);

  const formattedHotkey = formatAccelerator(hotkey, window.shortpath.platform);

  function handleSkip() {
    void window.shortpath.setOnboarded();
    onComplete();
  }

  function handleNext() {
    if (step < STEPS - 1) {
      setStep(step + 1);
    } else {
      void window.shortpath.setOnboarded();
      onComplete();
    }
  }

  function handleInstallSample() {
    setInstalledSample(true);
    void window.shortpath.installSampleData();
  }

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-panel">
        <div className="onboarding-header">
          <div className="onboarding-steps">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span key={i} className={`onboarding-dot${i === step ? " active" : i < step ? " done" : ""}`} />
            ))}
          </div>
          <button className="onboarding-skip-btn" onClick={handleSkip}>Skip</button>
        </div>

        {step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-icon">SP</div>
            <h2 className="onboarding-title">Welcome to ShortPath</h2>
            <p className="onboarding-text">The fast lookup tool for support teams. Your saved replies, documentation, SOPs, and quick-launch tools — in one searchable surface.</p>
            <div className="onboarding-hotkey-display">
              <span className="onboarding-hotkey-label">Open from anywhere</span>
              <kbd className="keyboard-key onboarding-hotkey-key">{formattedHotkey}</kbd>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Get your data in</h2>
            <p className="onboarding-text">Import your team's library via CSV, or start with 50 sample entries to explore the app.</p>
            <div className="onboarding-actions-column">
              <button
                className="btn-primary onboarding-action-btn"
                onClick={() => void window.shortpath.downloadTemplateCsv()}
              >
                Download CSV template
              </button>
              <button
                className={`btn-secondary onboarding-action-btn${installedSample ? " active" : ""}`}
                onClick={handleInstallSample}
                disabled={installedSample}
              >
                {installedSample ? "Sample data loaded ✓" : "Start with sample data (50 entries)"}
              </button>
            </div>
            <p className="onboarding-note">You can import a CSV or add entries manually at any time from Settings.</p>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Where to get help</h2>
            <p className="onboarding-text">The built-in Help Center covers every feature with searchable topics. Open it any time.</p>
            <button
              className="btn-secondary onboarding-action-btn"
              onClick={() => void window.shortpath.openHelpWindow()}
            >
              Open Help Center
            </button>
            <ul className="onboarding-tip-list">
              <li>Press <kbd className="keyboard-key onboarding-inline-key">?</kbd> in the header at any time</li>
              <li>Or use the keyboard shortcut <kbd className="keyboard-key onboarding-inline-key">Alt+H</kbd></li>
            </ul>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Quick tips</h2>
            <ul className="onboarding-tip-list onboarding-tip-list-final">
              <li><kbd className="keyboard-key onboarding-inline-key">Tab</kbd> cycles between categories</li>
              <li><kbd className="keyboard-key onboarding-inline-key">Enter</kbd> copies the focused entry</li>
              <li><kbd className="keyboard-key onboarding-inline-key">Esc</kbd> closes the window</li>
              <li>Star an entry to save it in Favorites</li>
              <li>Pin entries to keep them at the top</li>
              <li>Add Notes to any entry for context only you can see</li>
            </ul>
          </div>
        )}

        <div className="onboarding-footer">
          {step > 0 && (
            <button className="btn-secondary onboarding-nav-btn" onClick={() => setStep(step - 1)}>Back</button>
          )}
          <button className="btn-primary onboarding-nav-btn" onClick={handleNext}>
            {step < STEPS - 1 ? "Next" : "Get started"}
          </button>
        </div>
      </div>
    </div>
  );
}
