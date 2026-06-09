import Papa from "papaparse";
import { randomUUID } from "crypto";
import type { Entry, Vertical, SubFolder, ColumnMapping } from "../shared/types";
import type { StoreData } from "./schema";

const REQUIRED_COLUMNS = ["title", "vertical", "type"] as const;
const VALID_TYPES: Entry["type"][] = ["reply", "doc", "sop", "link", "tool"];

// CSV column name for the link field ("url" in the file, "link" internally).
const URL_COLUMN = "url";

// Locked column order for export. source is internal and never written to CSV.
const EXPORT_COLUMNS = ["title", "vertical", "type", "subfolder", "body", URL_COLUMN, "tags", "id", "createdAt", "updatedAt"] as const;

interface CsvRow {
  title?: string;
  vertical?: string;
  type?: string;
  subfolder?: string;
  body?: string;
  url?: string;
  tags?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Subfolder helpers ──────────────────────────────────────────────────────────

function getAllSubFolderIds(subFolders: SubFolder[]): string[] {
  return subFolders.flatMap((sf) => [sf.id, ...getAllSubFolderIds(sf.subFolders ?? [])]);
}

function findSubFolderByLabel(subFolders: SubFolder[], label: string): SubFolder | undefined {
  const lower = label.toLowerCase();
  for (const sf of subFolders) {
    if (sf.label.toLowerCase() === lower) return sf;
    const found = findSubFolderByLabel(sf.subFolders ?? [], label);
    if (found) return found;
  }
}

function findSubFolderById(subFolders: SubFolder[], id: string): SubFolder | undefined {
  for (const sf of subFolders) {
    if (sf.id === id) return sf;
    const found = findSubFolderById(sf.subFolders ?? [], id);
    if (found) return found;
  }
}

// Find an existing subfolder by label, or create a new top-level one.
function ensureSubFolder(vertical: Vertical, label: string): { vertical: Vertical; subFolder: SubFolder } {
  const existing = findSubFolderByLabel(vertical.subFolders ?? [], label);
  if (existing) return { vertical, subFolder: existing };
  const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "folder";
  const existingIds = getAllSubFolderIds(vertical.subFolders ?? []);
  let id = slug;
  let n = 1;
  while (existingIds.includes(id)) { id = `${slug}-${n}`; n++; }
  const subFolder: SubFolder = { id, label };
  return {
    vertical: { ...vertical, subFolders: [...(vertical.subFolders ?? []), subFolder] },
    subFolder,
  };
}

export interface ImportResult {
  store: StoreData;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface CsvPreviewRow {
  rowIndex: number;  // 0-based index in the parsed data array, used to key per-row resolutions
  title: string;
  vertical: string;
  type: string;
  subfolder: string;
  hasBody: boolean;
  hasUrl: boolean;
  tags: string;
}

export interface CsvPreviewResult {
  totalRows: number;
  previewRows: CsvPreviewRow[];
  skippedCount: number;
  errors: string[];
  needsMapping?: boolean;
  availableColumns?: string[];
  suggestedMapping?: ColumnMapping;
}

// Template content bundled inline so it's accessible in packaged builds.
// Column order matches EXPORT_COLUMNS. subfolder is optional — leave blank to place entries at the top level.
export const CSV_TEMPLATE_CONTENT = `title,vertical,type,subfolder,body,url,tags
Refund request — standard response,Saved Replies,reply,Billing,"Hi [Name],

Thanks for reaching out. I've gone ahead and processed your refund. You should see the credit back to your original payment method within 5-10 business days depending on your bank.

Let me know if there's anything else I can help with!

Best,
[Your name]",, billing|refund|payment
How to reset your password,Documentation,doc,,"To reset your password:
1. Go to the login page and click ""Forgot password?""
2. Enter your email address and click Send.
3. Check your inbox for the reset email (check spam if you don't see it).
4. Click the link in the email - it expires after 24 hours.
5. Choose a new password and confirm it.

If you don't receive the email within a few minutes, make sure the address matches the one on your account.",https://help.example.com/password-reset,password reset|account|login
New ticket escalation SOP,Internal SOPs,sop,,"1. Confirm the issue cannot be resolved at Tier 1 (check KB and saved replies first).
2. Collect: account ID, error message (exact text or screenshot), steps the customer already tried.
3. Open a Tier 2 ticket in the support portal - link the original ticket in the description.
4. Set priority based on impact: P1 = service down, P2 = core feature broken, P3 = degraded/workaround exists.
5. Notify the customer that their case has been escalated and give a response SLA.
6. Monitor the Tier 2 queue for updates and relay them to the customer promptly.",,escalation|tier-2|sop
Statuspage - live incident feed,Support Tools,tool,,,https://status.example.com,status|incidents|uptime
`;

// Parse with lowercase-normalized headers so "Title" and "title" both work.
function parseRows(csvString: string): { data: CsvRow[]; parseErrors: string[] } {
  const { data, errors } = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.toLowerCase().trim(),
  });
  const parseErrors = errors.map((e: Papa.ParseError) => `Parse error row ${e.row}: ${e.message}`);
  return { data, parseErrors };
}

// Parse with original header names preserved — used to detect column mapping needs.
function parseRowsRaw(csvString: string): { data: Record<string, string>[]; parseErrors: string[]; headers: string[] } {
  const { data, errors, meta } = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });
  const parseErrors = errors.map((e: Papa.ParseError) => `Parse error row ${e.row}: ${e.message}`);
  return { data, parseErrors, headers: meta.fields ?? [] };
}

// Returns raw column headers from a CSV string without parsing the full file.
export function parseCsvHeaders(csvString: string): string[] {
  const { headers } = parseRowsRaw(csvString);
  return headers;
}

// Apply a ColumnMapping to raw row data, producing normalized CsvRow objects.
function applyColumnMapping(rows: Record<string, string>[], mapping: ColumnMapping): CsvRow[] {
  return rows.map((row) => {
    const mapped: CsvRow = {};
    if (mapping.title)     mapped.title     = row[mapping.title]?.trim()     ?? "";
    if (mapping.vertical)  mapped.vertical  = row[mapping.vertical]?.trim()  ?? "";
    mapped.type = mapping.type ? (row[mapping.type]?.trim() ?? "reply") : "reply";
    if (mapping.body)      mapped.body      = row[mapping.body]?.trim()      ?? "";
    if (mapping.url)       mapped.url       = row[mapping.url]?.trim()       ?? "";
    if (mapping.tags)      mapped.tags      = row[mapping.tags]?.trim()      ?? "";
    if (mapping.subfolder) mapped.subfolder = row[mapping.subfolder]?.trim() ?? "";
    return mapped;
  });
}

export function parseCsvPreview(csvString: string): CsvPreviewResult {
  const { headers: rawHeaders, parseErrors: rawErrors } = parseRowsRaw(csvString);

  // Build a suggested mapping from raw header names — case-insensitive matching.
  function findCol(...names: string[]): string | null {
    return rawHeaders.find((h) => names.includes(h.toLowerCase().trim())) ?? null;
  }
  const suggestedMapping: ColumnMapping = {
    title:     findCol("title"),
    vertical:  findCol("vertical", "category"),
    type:      findCol("type"),
    body:      findCol("body", "content", "text", "response", "body text"),
    url:       findCol("url", "link", "href"),
    tags:      findCol("tags", "tag", "keywords"),
    subfolder: findCol("subfolder", "sub-folder", "sub_folder", "folder"),
  };

  // Always show the column mapping step so users can verify and adjust assignments.
  // Actual row parsing is done by parseCsvPreviewWithMapping once mapping is confirmed.
  return {
    totalRows: 0,
    previewRows: [],
    skippedCount: 0,
    errors: rawErrors,
    needsMapping: true,
    availableColumns: rawHeaders,
    suggestedMapping,
  };
}

export function parseCsvPreviewWithMapping(csvString: string, mapping: ColumnMapping): CsvPreviewResult {
  const { data: rawData, parseErrors } = parseRowsRaw(csvString);
  const data = applyColumnMapping(rawData, mapping);
  const errors: string[] = [...parseErrors];
  let skippedCount = 0;
  const previewRows: CsvPreviewRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required field(s): ${missing.join(", ")}`);
      skippedCount++;
      continue;
    }

    const type = row.type!.trim() as Entry["type"];
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${row.type}" — must be one of: ${VALID_TYPES.join(", ")}`);
      skippedCount++;
      continue;
    }

    previewRows.push({
      rowIndex: i,
      title: row.title!.trim(),
      vertical: row.vertical!.trim(),
      type: row.type!.trim(),
      subfolder: row.subfolder?.trim() ?? "",
      hasBody: !!row.body?.trim(),
      hasUrl: !!row.url?.trim(),
      tags: row.tags?.trim() ?? "",
    });
  }

  return { totalRows: rawData.length, previewRows, skippedCount, errors };
}

export type RowResolution = "skip" | "overwrite" | "import-as-new";

export function importCsvWithMapping(
  store: StoreData,
  csvString: string,
  mapping: ColumnMapping,
  source: "local" | "synced" = "local",
  resolutions: Record<number, RowResolution> = {}
): ImportResult {
  const { data: rawData, parseErrors } = parseRowsRaw(csvString);
  const data = applyColumnMapping(rawData, mapping);
  const errors: string[] = [...parseErrors];
  let { entries, verticals } = store;
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required field(s): ${missing.join(", ")}`);
      skipped++;
      continue;
    }

    const type = row.type!.trim() as Entry["type"];
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${row.type}" — must be one of: ${VALID_TYPES.join(", ")}`);
      skipped++;
      continue;
    }

    const vertical = row.vertical!.trim();
    const title = row.title!.trim();

    if (!verticals.find((v) => v.id === vertical)) {
      verticals = [...verticals, { id: vertical, label: vertical, builtIn: false }];
    }

    let subFolderId: string | undefined;
    const sfLabel = row.subfolder?.trim();
    if (sfLabel) {
      const vertIdx = verticals.findIndex((v) => v.id === vertical);
      if (vertIdx !== -1) {
        const sfResult = ensureSubFolder(verticals[vertIdx], sfLabel);
        verticals = verticals.map((v, i) => (i === vertIdx ? sfResult.vertical : v));
        subFolderId = sfResult.subFolder.id;
      }
    }

    const now = new Date().toISOString();
    const existing = entries.find((e) => e.vertical === vertical && e.title.toLowerCase().trim() === title.toLowerCase());
    const resolution: RowResolution = resolutions[i] ?? (existing ? "skip" : "import-as-new");

    if (resolution === "skip") {
      skipped++;
    } else if (resolution === "overwrite" && existing) {
      entries = entries.map((e) =>
        e.id === existing.id
          ? { ...e, body: row.body?.trim() || null, link: row.url?.trim() || null, tags: row.tags?.trim() || "", type, subFolderId, updatedAt: now }
          : e
      );
      updated++;
    } else {
      entries = [...entries, {
        id: randomUUID(), vertical, title,
        body: row.body?.trim() || null, link: row.url?.trim() || null,
        tags: row.tags?.trim() || "", type, source, subFolderId,
        createdAt: now, updatedAt: now,
      }];
      imported++;
    }
  }

  return { store: { ...store, entries, verticals }, imported, updated, skipped, errors };
}

// source defaults to "local" for user imports; use "synced" for the shared-file sync path (Phase 4).
export function importCsv(
  store: StoreData,
  csvString: string,
  source: "local" | "synced" = "local",
  resolutions: Record<number, RowResolution> = {}
): ImportResult {
  const { data, parseErrors } = parseRows(csvString);
  const errors: string[] = [...parseErrors];
  let { entries, verticals } = store;
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required column(s): ${missing.join(", ")}`);
      skipped++;
      continue;
    }

    const type = row.type!.trim() as Entry["type"];
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${row.type}" — must be one of: ${VALID_TYPES.join(", ")}`);
      skipped++;
      continue;
    }

    const vertical = row.vertical!.trim();
    const title = row.title!.trim();

    if (!verticals.find((v) => v.id === vertical)) {
      verticals = [...verticals, { id: vertical, label: vertical, builtIn: false }];
    }

    // Resolve subfolder: find or create by label within the vertical.
    // undefined column = column absent from CSV (preserve on update); "" = clear; label = assign.
    let subFolderId: string | undefined;
    const sfLabel = row.subfolder?.trim();
    if (sfLabel) {
      const vertIdx = verticals.findIndex((v) => v.id === vertical);
      if (vertIdx !== -1) {
        const sfResult = ensureSubFolder(verticals[vertIdx], sfLabel);
        verticals = verticals.map((v, i) => (i === vertIdx ? sfResult.vertical : v));
        subFolderId = sfResult.subFolder.id;
      }
    }

    const now = new Date().toISOString();
    const existing = entries.find((e) => e.vertical === vertical && e.title.toLowerCase().trim() === title.toLowerCase());
    const resolution: RowResolution = resolutions[i] ?? (existing ? "skip" : "import-as-new");

    if (resolution === "skip") {
      skipped++;
    } else if (resolution === "overwrite" && existing) {
      entries = entries.map((e) =>
        e.id === existing.id
          ? {
              ...e,
              body: row.body?.trim() || null,
              link: row.url?.trim() || null,
              tags: row.tags?.trim() || "",
              type,
              subFolderId: row.subfolder !== undefined ? subFolderId : e.subFolderId,
              updatedAt: now,
            }
          : e
      );
      updated++;
    } else {
      const entry: Entry = {
        id: randomUUID(),
        vertical,
        title,
        body: row.body?.trim() || null,
        link: row.url?.trim() || null,
        tags: row.tags?.trim() || "",
        type,
        source,
        subFolderId,
        createdAt: now,
        updatedAt: now,
      };
      entries = [...entries, entry];
      imported++;
    }
  }

  return { store: { ...store, entries, verticals }, imported, updated, skipped, errors };
}

export interface SyncParseResult {
  entries: Entry[];
  errors: string[];
  skipped: number;
}

// Parse a shared CSV file into synced entries. Uses stable IDs (vertical:title) so
// recents survive a re-sync even when the CSV has no id column.
export function parseSyncedCsv(csvString: string): SyncParseResult {
  const { data, parseErrors } = parseRows(csvString);
  const errors: string[] = [...parseErrors];
  const entries: Entry[] = [];
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required column(s): ${missing.join(", ")}`);
      skipped++;
      continue;
    }

    const type = row.type!.trim() as Entry["type"];
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${row.type}" — must be one of: ${VALID_TYPES.join(", ")}`);
      skipped++;
      continue;
    }

    const vertical = row.vertical!.trim();
    const title = row.title!.trim();
    const now = new Date().toISOString();

    // Prefer the id from the CSV (round-trip stable); fall back to a deterministic slug.
    const id = row.id?.trim() || `synced:${vertical}:${title}`;

    entries.push({
      id,
      vertical,
      title,
      body: row.body?.trim() || null,
      link: row.url?.trim() || null,
      tags: row.tags?.trim() || "",
      type,
      source: "synced",
      createdAt: row.createdAt?.trim() || now,
      updatedAt: row.updatedAt?.trim() || now,
    });
  }

  return { entries, errors, skipped };
}

export function exportCsv(entries: Entry[], verticals: Vertical[]): string {
  const rows = entries.map((e) => {
    const vertical = verticals.find((v) => v.id === e.vertical);
    const subfolder = e.subFolderId
      ? findSubFolderById(vertical?.subFolders ?? [], e.subFolderId)?.label ?? ""
      : "";
    return {
      title: e.title,
      vertical: e.vertical,
      type: e.type,
      subfolder,
      body: e.body ?? "",
      [URL_COLUMN]: e.link ?? "",
      tags: e.tags,
      id: e.id,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      // source is intentionally excluded from CSV output
    };
  });
  return Papa.unparse(rows, { columns: [...EXPORT_COLUMNS] });
}
