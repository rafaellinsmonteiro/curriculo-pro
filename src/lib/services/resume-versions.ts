// ==========================================
// CurrículoPRO — Resume Versions Service
// ==========================================

import { getDb } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { ResumeVersion } from '@/lib/types';

export function createVersion(data: {
  resume_id: string;
  version_number: number;
  structured_data: string;
  generation_prompt: string;
  edit_instruction?: string;
  pdf_url: string;
  pdf_filename: string;
}): ResumeVersion {
  const db = getDb();
  const id = generateId();

  db.prepare(`
    INSERT INTO resume_versions (id, resume_id, version_number, structured_data, generation_prompt, edit_instruction, pdf_url, pdf_filename, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id,
    data.resume_id,
    data.version_number,
    data.structured_data,
    data.generation_prompt,
    data.edit_instruction || null,
    data.pdf_url,
    data.pdf_filename
  );

  return getVersionById(id)!;
}

export function getVersionsByResumeId(resumeId: string): ResumeVersion[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC'
  ).all(resumeId) as ResumeVersion[];
}

export function getVersionById(id: string): ResumeVersion | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM resume_versions WHERE id = ?').get(id) as ResumeVersion | undefined) || null;
}

export function getLatestVersion(resumeId: string): ResumeVersion | null {
  const db = getDb();
  return (db.prepare(
    'SELECT * FROM resume_versions WHERE resume_id = ? ORDER BY version_number DESC LIMIT 1'
  ).get(resumeId) as ResumeVersion | undefined) || null;
}

export function getVersionByNumber(resumeId: string, versionNumber: number): ResumeVersion | null {
  const db = getDb();
  return (db.prepare(
    'SELECT * FROM resume_versions WHERE resume_id = ? AND version_number = ?'
  ).get(resumeId, versionNumber) as ResumeVersion | undefined) || null;
}
