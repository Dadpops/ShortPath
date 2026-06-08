-- ShortPath SQLite schema (draft — implemented in Phase 1)
--
-- entries: the core table for all resource types across all verticals.
-- fts_entries: FTS5 virtual table for cross-vertical full-text search.

CREATE TABLE IF NOT EXISTS entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vertical    TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  tags        TEXT DEFAULT '',
  type        TEXT NOT NULL CHECK(type IN ('reply', 'doc', 'link', 'sop')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS fts_entries USING fts5(
  title,
  body,
  tags,
  content='entries',
  content_rowid='id'
);

-- Triggers keep fts_entries in sync with entries.
CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
  INSERT INTO fts_entries(rowid, title, body, tags)
  VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
  INSERT INTO fts_entries(fts_entries, rowid, title, body, tags)
  VALUES ('delete', old.id, old.title, old.body, old.tags);
  INSERT INTO fts_entries(rowid, title, body, tags)
  VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
  INSERT INTO fts_entries(fts_entries, rowid, title, body, tags)
  VALUES ('delete', old.id, old.title, old.body, old.tags);
END;
