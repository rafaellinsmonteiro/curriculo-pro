// ==========================================
// CurrículoPRO — Resumes Service
// ==========================================

import { getDb } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Resume, ResumeWithLead, ResumeStatus } from '@/lib/types';

export function createResume(data: {
  lead_id: string;
  title: string;
}): Resume {
  const db = getDb();
  const id = generateId();

  db.prepare(`
    INSERT INTO resumes (id, lead_id, title, status, current_version, created_at, updated_at)
    VALUES (?, ?, ?, 'em_producao', 0, datetime('now'), datetime('now'))
  `).run(id, data.lead_id, data.title);

  // Update lead status
  db.prepare("UPDATE leads SET status = 'em_producao', updated_at = datetime('now') WHERE id = ?")
    .run(data.lead_id);

  return getResumeById(id)!;
}

export function getResumes(params?: {
  search?: string;
  status?: ResumeStatus;
  period?: 'today' | '7days' | '30days';
}): ResumeWithLead[] {
  const db = getDb();
  let query = `
    SELECT r.*,
           l.name as lead_name,
           l.whatsapp as lead_whatsapp,
           l.lead_code as lead_code,
           rv.pdf_url,
           rv.pdf_filename
    FROM resumes r
    JOIN leads l ON l.id = r.lead_id
    LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
  `;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params?.search) {
    conditions.push(`(l.name LIKE ? OR l.whatsapp LIKE ? OR r.title LIKE ?)`);
    values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
  }

  if (params?.status) {
    conditions.push(`r.status = ?`);
    values.push(params.status);
  }

  if (params?.period === 'today') {
    conditions.push(`date(r.created_at) = date('now')`);
  } else if (params?.period === '7days') {
    conditions.push(`r.created_at >= datetime('now', '-7 days')`);
  } else if (params?.period === '30days') {
    conditions.push(`r.created_at >= datetime('now', '-30 days')`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY r.updated_at DESC`;

  return db.prepare(query).all(...values) as ResumeWithLead[];
}

export function getResumeById(id: string): Resume | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM resumes WHERE id = ?').get(id) as Resume | undefined) || null;
}

export function getResumeWithLead(id: string): ResumeWithLead | null {
  const db = getDb();
  return (db.prepare(`
    SELECT r.*,
           l.name as lead_name,
           l.whatsapp as lead_whatsapp,
           l.lead_code as lead_code,
           rv.pdf_url,
           rv.pdf_filename
    FROM resumes r
    JOIN leads l ON l.id = r.lead_id
    LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
    WHERE r.id = ?
  `).get(id) as ResumeWithLead | undefined) || null;
}

export function getResumesByLeadId(leadId: string): ResumeWithLead[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.*,
           l.name as lead_name,
           l.whatsapp as lead_whatsapp,
           l.lead_code as lead_code,
           rv.pdf_url,
           rv.pdf_filename
    FROM resumes r
    JOIN leads l ON l.id = r.lead_id
    LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
    WHERE r.lead_id = ?
    ORDER BY r.created_at DESC
  `).all(leadId) as ResumeWithLead[];
}

export function updateResumeStatus(id: string, status: ResumeStatus): void {
  const db = getDb();
  db.prepare("UPDATE resumes SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);
}

export function updateResumeVersion(id: string, version: number): void {
  const db = getDb();
  db.prepare("UPDATE resumes SET current_version = ?, updated_at = datetime('now') WHERE id = ?")
    .run(version, id);
}

export function deleteResume(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM resumes WHERE id = ?').run(id);
  return result.changes > 0;
}

export function renameResume(id: string, title: string): void {
  const db = getDb();
  db.prepare("UPDATE resumes SET title = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, id);
}

export function reassignResume(id: string, newLeadId: string): void {
  const db = getDb();
  db.prepare("UPDATE resumes SET lead_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newLeadId, id);
}
