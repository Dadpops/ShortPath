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
| `tags` | string | Comma-separated tag strings. Empty string when none. |
| `type` | string | One of: `reply`, `doc`, `link`, `sop` |
| `createdAt` | string | ISO 8601 datetime |
| `updatedAt` | string | ISO 8601 datetime, updated on every write |

The `type` field hints at rendering (e.g. `reply` shows a copy button prominently, `link` shows an open-in-browser button). The `vertical` field drives grouping.

Note on IDs: the original foundation used an auto-increment integer (SQLite rowid). Changed to UUID strings so entries created manually in the app and entries imported from CSV do not collide, and so JSON files are self-contained without a database sequence.

## TypeScript representation

```typescript
// See src/shared/types.ts
interface Entry {
  id: string;
  vertical: string;
  title: string;
  body: string | null;
  link: string | null;
  tags: string;
  type: "reply" | "doc" | "link" | "sop";
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
  ]
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

When the search box is empty: show recents (last 10 opened/copied entries) instead of search results.

Not included in v1: boolean operators, regex search, saved searches, search analytics.

## CSV import format

CSV import expects these columns (header row required, column order does not matter):

| Column | Required | Notes |
|---|---|---|
| `vertical` | Yes | Must match a vertical ID or will create a new one |
| `title` | Yes | |
| `type` | Yes | `reply`, `doc`, `link`, or `sop` |
| `body` | No | Leave blank for link-only entries |
| `link` | No | Leave blank for text-only entries |
| `tags` | No | Comma-separated within the cell, e.g. `"billing, refund"` |

Import behavior:
- Parsed by PapaParse with header detection on.
- Rows missing `vertical`, `title`, or `type` are skipped with a warning returned to the renderer.
- Unknown vertical IDs create a new vertical automatically (with `builtIn: false`).
- Duplicate detection: entries with the same `vertical` + `title` update the existing entry (preserving the original `id` and `createdAt`).
- New entries get a fresh UUID for `id`.

## CSV export format

Export produces the same column set as import, making round-trips lossless. `id`, `createdAt`, and `updatedAt` are included as additional columns but ignored on re-import.
