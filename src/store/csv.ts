import Papa from "papaparse";
import { randomUUID } from "crypto";
import type { Entry } from "../shared/types";
import type { StoreData } from "./schema";

const REQUIRED_COLUMNS = ["title", "vertical", "type"] as const;
const VALID_TYPES: Entry["type"][] = ["reply", "doc", "sop", "link", "tool"];

// CSV column name for the link field ("url" in the file, "link" internally).
const URL_COLUMN = "url";

// Locked column order for export. source is internal and never written to CSV.
const EXPORT_COLUMNS = ["title", "vertical", "type", "body", URL_COLUMN, "tags", "id", "createdAt", "updatedAt"] as const;

interface CsvRow {
  title?: string;
  vertical?: string;
  type?: string;
  body?: string;
  url?: string;
  tags?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportResult {
  store: StoreData;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface CsvPreviewRow {
  title: string;
  vertical: string;
  type: string;
  hasBody: boolean;
  hasUrl: boolean;
  tags: string;
}

export interface CsvPreviewResult {
  totalRows: number;
  previewRows: CsvPreviewRow[];
  skippedCount: number;
  errors: string[];
}

// Template content bundled inline so it's accessible in packaged builds.
export const CSV_TEMPLATE_CONTENT = `title,vertical,type,body,url,tags
Refund request — standard response,Saved Replies,reply,"Hi [Name],

Thanks for reaching out. I've gone ahead and processed your refund. You should see the credit back to your original payment method within 5-10 business days depending on your bank.

Let me know if there's anything else I can help with!

Best,
[Your name]",,billing|refund|payment
How to reset your password,Documentation,doc,"To reset your password:
1. Go to the login page and click ""Forgot password?""
2. Enter your email address and click Send.
3. Check your inbox for the reset email (check spam if you don't see it).
4. Click the link in the email - it expires after 24 hours.
5. Choose a new password and confirm it.

If you don't receive the email within a few minutes, make sure the address matches the one on your account.",https://help.example.com/password-reset,password reset|account|login
New ticket escalation SOP,Internal SOPs,sop,"1. Confirm the issue cannot be resolved at Tier 1 (check KB and saved replies first).
2. Collect: account ID, error message (exact text or screenshot), steps the customer already tried.
3. Open a Tier 2 ticket in the support portal - link the original ticket in the description.
4. Set priority based on impact: P1 = service down, P2 = core feature broken, P3 = degraded/workaround exists.
5. Notify the customer that their case has been escalated and give a response SLA.
6. Monitor the Tier 2 queue for updates and relay them to the customer promptly.",,escalation|tier-2|sop
Statuspage - live incident feed,Support Tools,tool,,https://status.example.com,status|incidents|uptime
`;

function parseRows(csvString: string): { data: CsvRow[]; parseErrors: string[] } {
  const { data, errors } = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  });
  const parseErrors = errors.map((e: Papa.ParseError) => `Parse error row ${e.row}: ${e.message}`);
  return { data, parseErrors };
}

export function parseCsvPreview(csvString: string): CsvPreviewResult {
  const { data, parseErrors } = parseRows(csvString);
  const errors: string[] = [...parseErrors];
  let skippedCount = 0;
  const previewRows: CsvPreviewRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required column(s): ${missing.join(", ")}`);
      skippedCount++;
      continue;
    }

    const type = row.type!.trim();
    if (!VALID_TYPES.includes(type as Entry["type"])) {
      errors.push(`Row ${rowNum}: invalid type "${type}" — must be one of: ${VALID_TYPES.join(", ")}`);
      skippedCount++;
      continue;
    }

    if (previewRows.length < 5) {
      previewRows.push({
        title: row.title!.trim(),
        vertical: row.vertical!.trim(),
        type: row.type!.trim(),
        hasBody: !!row.body?.trim(),
        hasUrl: !!row.url?.trim(),
        tags: row.tags?.trim() ?? "",
      });
    }
  }

  return {
    totalRows: data.length,
    previewRows,
    skippedCount,
    errors,
  };
}

// source defaults to "local" for user imports; use "synced" for the shared-file sync path (Phase 4).
export function importCsv(
  store: StoreData,
  csvString: string,
  source: "local" | "synced" = "local"
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

    const now = new Date().toISOString();
    const existing = entries.find((e) => e.vertical === vertical && e.title === title);

    if (existing) {
      entries = entries.map((e) =>
        e.id === existing.id
          ? {
              ...e,
              body: row.body?.trim() || null,
              link: row.url?.trim() || null,
              tags: row.tags?.trim() || "",
              type,
              updatedAt: now,
              // preserve existing source — re-importing doesn't change ownership
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
        createdAt: now,
        updatedAt: now,
      };
      entries = [...entries, entry];
      imported++;
    }
  }

  return { store: { ...store, entries, verticals }, imported, updated, skipped, errors };
}

export function exportCsv(entries: Entry[]): string {
  const rows = entries.map((e) => ({
    title: e.title,
    vertical: e.vertical,
    type: e.type,
    body: e.body ?? "",
    [URL_COLUMN]: e.link ?? "",
    tags: e.tags,
    id: e.id,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    // source is intentionally excluded from CSV output
  }));
  return Papa.unparse(rows, { columns: [...EXPORT_COLUMNS] });
}
