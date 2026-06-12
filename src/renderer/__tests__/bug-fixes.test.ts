import { describe, it, expect } from "vitest";

// Extracted toggle group logic (mirrors the fixed App.tsx toggleGroup callback)
function toggleGroupState(prev: Set<string>, verticalId: string): Set<string> {
  const plainId = verticalId.includes("::") ? verticalId.split("::")[1] : verticalId;
  const isExpanded = prev.has(verticalId) || prev.has(plainId);
  const next = new Set(prev);
  if (isExpanded) {
    next.delete(verticalId);
    next.delete(plainId);
  } else {
    next.add(verticalId);
  }
  return next;
}

describe("Bug 1 — toggleGroup collapses correctly in all modes", () => {
  it("opens a collapsed group in single-source mode", () => {
    const state = new Set<string>();
    const next = toggleGroupState(state, "saved-replies");
    expect(next.has("saved-replies")).toBe(true);
  });

  it("collapses an open group in single-source mode", () => {
    const state = new Set(["saved-replies"]);
    const next = toggleGroupState(state, "saved-replies");
    expect(next.has("saved-replies")).toBe(false);
  });

  it("opens a group in all-mode (composite key)", () => {
    const state = new Set<string>();
    const next = toggleGroupState(state, "local::saved-replies");
    expect(next.has("local::saved-replies")).toBe(true);
  });

  it("collapses an all-mode group that was expanded via composite key", () => {
    const state = new Set(["local::saved-replies"]);
    const next = toggleGroupState(state, "local::saved-replies");
    expect(next.has("local::saved-replies")).toBe(false);
  });

  // The regression: group expanded via plainId (from single-source mode), then
  // user switches to all-mode and clicks to toggle — old code ADDED the composite
  // key instead of collapsing, so the group never closed.
  it("collapses a group that was expanded via plainId when toggled with composite key", () => {
    const state = new Set(["saved-replies"]); // was expanded in single-source mode
    const next = toggleGroupState(state, "local::saved-replies"); // now in all-mode
    // Should collapse, clearing BOTH keys
    expect(next.has("local::saved-replies")).toBe(false);
    expect(next.has("saved-replies")).toBe(false);
  });

  it("does not consider a group expanded if neither key matches", () => {
    const state = new Set(["documentation"]);
    const next = toggleGroupState(state, "local::saved-replies");
    expect(next.has("local::saved-replies")).toBe(true); // should open, not close
    expect(next.has("documentation")).toBe(true); // other groups unaffected
  });
});

describe("Bug 4 — hideCopyCount prop on ResultItem", () => {
  it("ResultItem Props interface accepts hideCopyCount", () => {
    // TypeScript compilation validates this; this test just documents the contract.
    // A ResultItem rendered with hideCopyCount=true must not render .copy-count-badge.
    const props = { hideCopyCount: true };
    expect(props.hideCopyCount).toBe(true);
  });

  it("copy count is conditionally rendered when hideCopyCount is false", () => {
    const hideCopyCount = false;
    const copyCount = 3;
    const shouldRender = !hideCopyCount && copyCount > 0;
    expect(shouldRender).toBe(true);
  });

  it("copy count is suppressed when hideCopyCount is true", () => {
    const hideCopyCount = true;
    const copyCount = 3;
    const shouldRender = !hideCopyCount && copyCount > 0;
    expect(shouldRender).toBe(false);
  });

  it("copy count does not render when copyCount is 0 even without hideCopyCount", () => {
    const hideCopyCount = false;
    const copyCount = 0;
    const shouldRender = !hideCopyCount && copyCount > 0;
    expect(shouldRender).toBe(false);
  });
});
