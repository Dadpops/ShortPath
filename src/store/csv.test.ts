import { describe, it, expect } from "vitest";
import { importCsv } from "./csv";
import { defaultStore } from "./schema";

function makeStore() {
  return defaultStore();
}

// Helper: build a minimal CSV string from rows (header + data).
function csv(rows: string[]): string {
  return ["title,vertical,type,subfolder,body,url,tags", ...rows].join("\n");
}

describe("importCsv — subfolder handling", () => {
  it("imports with no subfolder (empty column)", () => {
    const result = importCsv(makeStore(), csv(["Entry,Documentation,doc,,Some body,,"]));
    expect(result.imported).toBe(1);
    expect(result.store.entries[0].subFolderId).toBeUndefined();
  });

  it("imports a single-level subfolder", () => {
    const result = importCsv(makeStore(), csv(["Entry,Documentation,doc,Getting Started,Some body,,"]));
    expect(result.imported).toBe(1);
    const vertical = result.store.verticals.find((v) => v.id === "documentation");
    const sf = vertical?.subFolders?.find((s) => s.label === "Getting Started");
    expect(sf).toBeDefined();
    expect(result.store.entries[0].subFolderId).toBe(sf!.id);
  });

  it("imports a two-level nested subfolder", () => {
    const result = importCsv(makeStore(), csv(["Entry,Documentation,doc,Getting Started > Account Help,Body,,"]));
    expect(result.imported).toBe(1);
    const vertical = result.store.verticals.find((v) => v.id === "documentation");
    const parent = vertical?.subFolders?.find((s) => s.label === "Getting Started");
    expect(parent).toBeDefined();
    const child = parent?.subFolders?.find((s) => s.label === "Account Help");
    expect(child).toBeDefined();
    expect(result.store.entries[0].subFolderId).toBe(child!.id);
  });

  it("handles inconsistent spacing around >", () => {
    const r1 = importCsv(makeStore(), csv(["E1,Documentation,doc,A > B,Body,,"]));
    const r2 = importCsv(makeStore(), csv(["E2,Documentation,doc,A>B,Body,,"]));
    const r3 = importCsv(makeStore(), csv(["E3,Documentation,doc,A >B,Body,,"]));

    function childId(store: typeof r1.store): string | undefined {
      const v = store.verticals.find((v) => v.id === "documentation");
      const parent = v?.subFolders?.find((s) => s.label === "A");
      return parent?.subFolders?.find((s) => s.label === "B")?.id;
    }
    expect(childId(r1.store)).toBeDefined();
    expect(childId(r2.store)).toBeDefined();
    expect(childId(r3.store)).toBeDefined();
    // All three produce the same folder structure
    expect(r1.store.entries[0].subFolderId).toBe(childId(r1.store));
    expect(r2.store.entries[0].subFolderId).toBe(childId(r2.store));
    expect(r3.store.entries[0].subFolderId).toBe(childId(r3.store));
  });

  it("matches existing folders case-insensitively and preserves original casing", () => {
    // First import creates "Getting Started"
    const first = importCsv(makeStore(), csv(["E1,Documentation,doc,Getting Started,Body,,"]));
    // Second import uses different casing — should reuse the existing folder
    const second = importCsv(first.store, csv(["E2,Documentation,doc,getting started,Body,,"]));
    const vertical = second.store.verticals.find((v) => v.id === "documentation");
    // Still only one top-level subfolder
    expect(vertical?.subFolders?.length).toBe(1);
    expect(vertical?.subFolders?.[0].label).toBe("Getting Started"); // original casing preserved
    expect(second.store.entries[1].subFolderId).toBe(vertical?.subFolders?.[0].id);
  });

  it("parses a quoted subfolder containing a comma", () => {
    // PapaParse RFC 4180: "Data, Privacy & Security" is a single field
    const result = importCsv(makeStore(), csv([`Entry,Documentation,doc,"Data, Privacy & Security",Body,,`]));
    expect(result.imported).toBe(1);
    const vertical = result.store.verticals.find((v) => v.id === "documentation");
    const sf = vertical?.subFolders?.find((s) => s.label === "Data, Privacy & Security");
    expect(sf).toBeDefined();
  });

  it("parses a body containing an escaped quote (\"\") per RFC 4180", () => {
    const result = importCsv(makeStore(), csv([`Entry,Documentation,doc,,"He said ""hello"" to everyone.",,`]));
    expect(result.imported).toBe(1);
    expect(result.store.entries[0].body).toBe(`He said "hello" to everyone.`);
  });
});
