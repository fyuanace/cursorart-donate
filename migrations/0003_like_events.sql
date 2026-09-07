CREATE TABLE IF NOT EXISTS like_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_like_events_created_at ON like_events (created_at);
