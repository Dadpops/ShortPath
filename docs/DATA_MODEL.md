# Data Model

## The vertical concept

A "vertical" is a named category of resources. Built-in verticals:

| ID | Label | Description |
|---|---|---|
| `saved-replies` | Saved Replies | Pre-written responses to common customer questions |
| `documentation` | Documentation | Product docs, help articles, knowledge base content |
| `sops` | Internal SOPs | Step-by-step internal processes |
| `support-tools` | Support Tools | Quick-access links and utilities for support work |

Users can define additional verticals with custom IDs and labels. Custom verticals are stored the same way as built-in ones — they are just entries with a distinct `vertical` value.

## Entry schema

Every resource in ShortPath is an entry. Entries are stored as an array of objects in a local JSON file.

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID. Generated on create. Stable across imports. |
| `vertical` | string | Vertical ID (see above or user-defined) |
| `title` | string | Required. Short, searchable label. |
| `body` | string or null | Full text content (saved replies, docs, SOPs). Null for link-only entries. |
| `link` | string or null | URL. Null for text-only entries. Both body and link can be set. |
| `tags` | string | Pipe-separated tag strings (`billing|refund|chat`). Empty string when none. |
| `type` | string | One of: `reply`, `doc`, `link`, `sop`, `tool` |
| `createdAt` | string | ISO 8601 datetime |
| `updatedAt` | string | ISO 8601 datetime, updated on every write |

The `type` field hints at rendering (e.g. `reply` shows a copy button prominently, `link` and `tool` show an open-in-browser button). The `vertical` field drives grouping.

Note on IDs: uses UUID strings so entries created manually and entries imported from CSV do not collide, and so JSON files are self-contained without a database sequence.

## TypeScript representation

```typescript
// See src/shared/types.ts
interface Entry {
  id: string;
  vertical: string;
  title: string;
  body: string | null;
  link: string | null;
  tags: string;          // pipe-separated: "billing|refund|chat"
  type: "reply" | "doc" | "link" | "sop" | "tool";
  createdAt: string;
  updatedAt: string;
}
```

## JSON store structure

The store is a single JSON file at `{userData}/store.json`. Structure:

```json
{
  "version": 1,
  "entries": [ ...Entry[] ],
  "verticals": [
    { "id": "saved-replies", "label": "Saved Replies", "builtIn": true },
    { "id": "documentation", "label": "Documentation", "builtIn": true },
    { "id": "sops", "label": "Internal SOPs", "builtIn": true },
    { "id": "support-tools", "label": "Support Tools", "builtIn": true }
  ],
  "recents": [ ...entryId strings, max 10, most recent first ]
}
```

User-defined verticals appear in the `verticals` array with `builtIn: false`. The `version` field allows future migrations.

## Search: Fuse.js indexing

The renderer builds a Fuse.js index from the full entry list when it loads. Queries run in-memory with no IPC round-trip.

Index configuration:
- Fields indexed: `title`, `body`, `tags`
- Field weights: title > tags > body (title match ranks first)
- `includeMatches: true` so matched ranges can be highlighted in the UI
- Fuzzy threshold: conservative (around 0.3 on a 0-1 scale) — close matches only, not loose

After running a query, results are grouped by `vertical` with a per-vertical hit count for the group headers. Each group is expandable/collapsible.

When the search box is empty: show the recents section (last 10 accessed entries) followed by all entries grouped by vertical.

Not included in v1: boolean operators, regex search, saved searches, search analytics.

---

## CSV format (locked schema)

Import and export use the exact same column set in the exact same order. This makes the round-trip lossless: export, edit in a spreadsheet, re-import, and nothing changes.

### Columns

| Column | Required | Description |
|---|---|---|
| `title` | Yes | Short name shown in search results. |
| `vertical` | Yes | Which group the entry belongs to. Free text — any value creates a new vertical if unknown. The standard four: `Saved Replies`, `Documentation`, `Internal SOPs`, `Support Tools`. |
| `type` | Yes | One of: `reply`, `doc`, `sop`, `link`, `tool`. Unknown values are flagged as errors; the row is not imported. |
| `body` | Yes* | Full content: the saved reply text, documentation, SOP steps. Can contain line breaks (use standard CSV quoting). |
| `url` | Yes* | A link. Used when the entry is a link or points to an external document. |
| `tags` | No | Keywords that improve search relevance. **Pipe-separated** (`billing|refund|chat`), not comma-separated. |

*`body` and `url`: an entry needs at least one. A saved reply has `body`. A link or tool has `url`. A doc can have both.

### Column order

The export always writes columns in this order:

```
title, vertical, type, body, url, tags
```

Import does not require a specific order (PapaParse uses the header row for mapping), but the template uses the canonical order above.

### Tag separator

Tags use `|` (pipe) as the separator, not `,` (comma). This avoids conflicts between the tag separator and the CSV field separator, and lets you have multi-word tags like `password reset` without quoting.

### Multi-line body

A saved reply or SOP with line breaks must survive a round-trip. The body cell is wrapped in double quotes in the CSV; internal quotes are escaped by doubling them (`""`). The template includes a multi-line example.

### Import behavior

- Parsed by PapaParse with header detection on.
- Rows missing `title`, `vertical`, or `type` are skipped. The importer reports the row number and what was missing.
- Rows with an unknown `type` value are skipped with a specific error naming the row and the bad value.
- Unknown `vertical` values create a new vertical automatically (`builtIn: false`).
- Duplicate detection: entries with the same `vertical` + `title` update the existing entry (preserves `id` and `createdAt`).
- New entries get a fresh UUID for `id`.
- Before committing, the import screen shows a preview of the first parsed rows, a total count, and any flagged rows. The user confirms before the import runs.

### Export behavior

Export produces the same column set as import. Internal fields `id`, `createdAt`, and `updatedAt` are included as additional trailing columns so a re-import identifies existing entries correctly, but those columns are ignored if missing.

### Template file

A static CSV template lives at `src/store/template/shortpath-template.csv`. It contains the header row and four example rows (one per standard vertical, one per type) including a multi-line body example. Users download it via a "Download template" button on the import screen.

### Internal field name vs CSV column name

The internal `Entry` type uses `link` for the URL field. The CSV column is named `url` (more intuitive to non-developers). The import/export layer maps between them.
