# Data Model

## The vertical concept

A "vertical" is a named category of resources. Built-in verticals:

| ID | Label | Description |
|---|---|---|
| `saved-replies` | Saved Replies | Pre-written responses to common customer questions |
| `documentation` | Documentation | Product docs, help articles, knowledge base content |
| `sops` | Internal SOPs | Step-by-step internal processes |
| `support-tools` | Support Tools | Quick-access links and utilities for support work |

Users can define additional verticals with custom IDs and labels. These are stored as distinct `vertical` values in the entries table.

## Entry schema

Every resource in ShortPath is an entry. Entries live in a single `entries` table.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `vertical` | TEXT | Vertical ID (see above or user-defined) |
| `title` | TEXT | Required. Short, searchable label. |
| `body` | TEXT | Full text content (saved replies, docs, SOPs). Null for link-only entries. |
| `link` | TEXT | URL. Null for text-only entries. Both body and link can be set. |
| `tags` | TEXT | Comma-separated tag strings. Empty string when none. |
| `type` | TEXT | One of: `reply`, `doc`, `link`, `sop` |
| `created_at` | TEXT | ISO 8601 datetime |
| `updated_at` | TEXT | ISO 8601 datetime, updated by trigger |

The `type` field is a hint for UI rendering (e.g. "reply" shows a copy button prominently, "link" shows an open-in-browser button). The `vertical` field drives grouping.

## TypeScript representation

```typescript
// See src/shared/types.ts
interface Entry {
  id: number;
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

## FTS5 strategy

The FTS5 virtual table `fts_entries` indexes `title`, `body`, and `tags`. It uses content-mode (`content='entries'`) so data is not duplicated. Three triggers (INSERT, UPDATE, DELETE) keep the FTS index in sync with the entries table.

### Cross-vertical search query

A search returns one `VerticalGroup` per vertical that has at least one match. Each group includes the total hit count and a list of matching entries with FTS5 snippet highlights.

Pseudocode for the query:

```sql
-- Per-vertical hit count
SELECT vertical, COUNT(*) as hit_count
FROM entries
JOIN fts_entries ON entries.id = fts_entries.rowid
WHERE fts_entries MATCH ?
GROUP BY vertical;

-- Per-vertical results (with snippets)
SELECT entries.*, snippet(fts_entries, 0, '<b>', '</b>', '...', 20) as snippet
FROM entries
JOIN fts_entries ON entries.id = fts_entries.rowid
WHERE fts_entries MATCH ?
AND entries.vertical = ?
ORDER BY rank;
```

This runs two queries per search: one for the group summary, one per expanded vertical. Both are fast because FTS5 returns a ranked rowid list and the join is on an indexed primary key.

## CSV import format

CSV import expects these columns (header row required, order does not matter):

| Column | Required | Notes |
|---|---|---|
| `vertical` | Yes | Must match a known vertical ID or will create a new one |
| `title` | Yes | |
| `type` | Yes | `reply`, `doc`, `link`, or `sop` |
| `body` | No | Leave blank for link-only entries |
| `link` | No | Leave blank for text-only entries |
| `tags` | No | Comma-separated within the cell, e.g. `"billing, refund"` |

On import:
- Rows missing `vertical`, `title`, or `type` are skipped with a warning.
- Unknown vertical IDs create a new vertical automatically.
- Duplicate detection: entries with the same `vertical` + `title` update the existing row instead of inserting.

## CSV export format

Export produces the same column set as import, making round-trips lossless. `id`, `created_at`, and `updated_at` are included as additional columns but ignored on re-import.
