// ==========================================
// CurrículoPRO — Database Layer (SQLite)
// ==========================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const resolvedPath = path.join(process.cwd(), 'data', 'curriculo-pro.db');

  // Ensure directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  initializeDatabase(db);

  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'novo',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'em_producao',
      current_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resume_versions (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      structured_data TEXT NOT NULL,
      generation_prompt TEXT NOT NULL,
      edit_instruction TEXT,
      pdf_url TEXT NOT NULL,
      pdf_filename TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      resume_id TEXT,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_resumes_lead_id ON resumes(lead_id);
    CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
    CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);
    CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

    -- Lead code counter
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO counters (name, value) VALUES ('lead_code', 0);
  `);
}

/**
 * Get the next lead code (LEAD-00001, LEAD-00002, etc.)
 */
export function getNextLeadCode(): string {
  const db = getDb();
  const stmt = db.prepare('UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value');
  const row = stmt.get('lead_code') as { value: number } | undefined;

  if (!row) {
    // Fallback: initialize and retry
    db.prepare('INSERT OR REPLACE INTO counters (name, value) VALUES (?, 1)').run('lead_code');
    return 'LEAD-00001';
  }

  return `LEAD-${String(row.value).padStart(5, '0')}`;
}
