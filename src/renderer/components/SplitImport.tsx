import { useState } from "react";
import type { Entry, Vertical } from "@shared/types";

interface SplitEntry {
  title: string;
  body: string;
}

interface Props {
  verticals: Vertical[];
  onComplete: (entries: Entry[], newVerticals: Vertical[]) => void;
  onCancel: () => void;
}

function parseHeadings(text: string): SplitEntry[] {
  const lines = text.split("\n");
  const sections: SplitEntry[] = [];
  let currentTitle: string | null = null;
  const bodyLines: string[] = [];

  function flush() {
    if (currentTitle !== null) {
      sections.push({ title: currentTitle, body: bodyLines.join("\n").trim() });
      bodyLines.length = 0;
    }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)/);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].trim();
    } else {
      if (currentTitle !== null) bodyLines.push(line);
    }
  }
  flush();

  return sections.filter((s) => s.title);
}

type Stage = "input" | "preview" | "saving" | "done";

export default function SplitImport({ verticals, onComplete, onCancel }: Props) {
  const [text, setText] = useState("");
  const [verticalId, setVerticalId] = useState(verticals[0]?.id ?? "saved-replies");
  const [isNewVertical, setIsNewVertical] = useState(false);
  const [newVerticalLabel, setNewVerticalLabel] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  function slugify(label: string) {
    return label.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const finalVerticalId = isNewVertical ? slugify(newVerticalLabel) : verticalId;

  function handleParse() {
    setError("");
    const parsed = parseHeadings(text);
    if (parsed.length === 0) {
      setError("No headings found. Start each section with # Heading or ## Heading.");
      return;
    }
    setSplits(parsed);
    setStage("preview");
  }

  async function handleSave() {
    if (isNewVertical && !newVerticalLabel.trim()) {
      setError("New vertical name is required.");
      return;
    }
    if (!finalVerticalId) {
      setError("Vertical ID could not be generated from that name.");
      return;
    }

    setStage("saving");
    const createdEntries: Entry[] = [];
    let currentVerticals = verticals;

    try {
      for (const split of splits) {
        const fields = {
          vertical: finalVerticalId,
          title: split.title,
          body: split.body || null,
          link: null,
          tags: "",
          type: "doc" as Entry["type"],
        };
        const result = await window.shortpath.createEntry(
          fields,
          isNewVertical ? newVerticalLabel.trim() : undefined
        );
        createdEntries.push(result.entry);
        currentVerticals = result.verticals;
        setSavedCount((n) => n + 1);
        // Only pass vertical label on first create; subsequent calls use the ID
        if (isNewVertical) setIsNewVertical(false);
      }
      setStage("done");
      onComplete(createdEntries, currentVerticals);
    } catch {
      setError("Failed to save entries. Please try again.");
      setStage("preview");
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
  }

  return (
    <div className="split-import-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onCancel} disabled={stage === "saving"}>
          ← Back
        </button>
        <span className="form-title">Paste and split</span>
      </div>

      {stage === "input" && (
        <div className="split-import-body">
          <p className="split-import-hint">
            Paste a document with <code># Heading</code> or <code>## Heading</code> markers.
            Each heading and its text become one entry.
          </p>

          <div className="form-field">
            <label className="form-label">Vertical</label>
            <select
              className="form-select"
              value={isNewVertical ? "__new__" : verticalId}
              onChange={handleVerticalChange}
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
                placeholder="Vertical name"
                value={newVerticalLabel}
                onChange={(e) => setNewVerticalLabel(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Paste document</label>
            <textarea
              className="form-textarea split-import-textarea"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"# Section one\nContent for the first section...\n\n## Section two\nContent for the second section..."}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleParse} disabled={!text.trim()}>
              Preview splits
            </button>
          </div>
        </div>
      )}

      {stage === "preview" && (
        <div className="split-import-body">
          <p className="split-import-hint">
            {splits.length} {splits.length === 1 ? "entry" : "entries"} found. Review before saving.
          </p>

          <ul className="split-preview-list">
            {splits.map((s, i) => (
              <li key={i} className="split-preview-item">
                <span className="split-preview-title">{s.title}</span>
                {s.body && (
                  <span className="split-preview-body">{s.body.length > 80 ? s.body.slice(0, 80) + "…" : s.body}</span>
                )}
              </li>
            ))}
          </ul>

          {error && <p className="form-error">{error}</p>}

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={() => setStage("input")}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              Save {splits.length} {splits.length === 1 ? "entry" : "entries"}
            </button>
          </div>
        </div>
      )}

      {stage === "saving" && (
        <div className="split-import-body">
          <p className="split-import-hint">
            Saving {savedCount} of {splits.length}…
          </p>
        </div>
      )}
    </div>
  );
}
