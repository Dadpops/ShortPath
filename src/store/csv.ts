import Papa from "papaparse";
import { randomUUID } from "crypto";
import type { Entry } from "../shared/types";
import type { StoreData } from "./schema";

const REQUIRED_COLUMNS = ["vertical", "title", "type"] as const;
const VALID_TYPES = ["reply", "doc", "link", "sop"] as const;

interface CsvRow {
  vertical?: string;
  title?: string;
  type?: string;
  body?: string;
  link?: string;
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

export function importCsv(store: StoreData, csvString: string): ImportResult {
  const { data, errors: parseErrors } = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = parseErrors.map((e: Papa.ParseError) => `Parse error row ${e.row}: ${e.message}`);
  let { entries, verticals } = store;
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // +2 for header row and 1-index

    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required column(s): ${missing.join(", ")}`);
      skipped++;
      continue;
    }

    const type = row.type!.trim() as Entry["type"];
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${row.type}" — must be reply, doc, link, or sop`);
      skipped++;
      continue;
    }

    const vertical = row.vertical!.trim();
    const title = row.title!.trim();

    // Auto-create vertical if unknown
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
              link: row.link?.trim() || null,
              tags: row.tags?.trim() || "",
              type,
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
        link: row.link?.trim() || null,
        tags: row.tags?.trim() || "",
        type,
        createdAt: now,
        updatedAt: now,
      };
      entries = [...entries, entry];
      imported++;
    }
  }

  return {
    store: { ...store, entries, verticals },
    imported,
    updated,
    skipped,
    errors,
  };
}

export function exportCsv(entries: Entry[]): string {
  const rows = entries.map((e) => ({
    id: e.id,
    vertical: e.vertical,
    title: e.title,
    type: e.type,
    body: e.body ?? "",
    link: e.link ?? "",
    tags: e.tags,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
  return Papa.unparse(rows);
}
