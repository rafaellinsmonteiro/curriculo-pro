// ==========================================
// CurrículoPRO — Leads Service
// ==========================================

import { getDb, getNextLeadCode } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Lead, LeadWithResumeCount, LeadStatus, CreateLeadRequest, UpdateLeadRequest } from '@/lib/types';

export function createLead(data: CreateLeadRequest): Lead {
  const db = getDb();
  const id = generateId();
  const leadCode = getNextLeadCode();

  const stmt = db.prepare(`
    INSERT INTO leads (id, lead_code, name, whatsapp, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'novo', ?, datetime('now'), datetime('now'))
  `);

  stmt.run(id, leadCode, data.name, data.whatsapp, data.notes || null);

  // Log activity
  db.prepare(`
    INSERT INTO activities (id, lead_id, activity_type, description, created_at)
    VALUES (?, ?, 'lead_criado', ?, datetime('now'))
  `).run(generateId(), id, `Lead ${data.name} cadastrado`);

  return getLeadById(id)!;
}

export function getLeads(params?: {
  search?: string;
  status?: LeadStatus;
}): LeadWithResumeCount[] {
  const db = getDb();
  let query = `
    SELECT l.*, COUNT(r.id) as resume_count
    FROM leads l
    LEFT JOIN resumes r ON r.lead_id = l.id
  `;

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (params?.search) {
    conditions.push(`(l.name LIKE ? OR l.whatsapp LIKE ?)`);
    values.push(`%${params.search}%`, `%${params.search}%`);
  }

  if (params?.status) {
    conditions.push(`l.status = ?`);
    values.push(params.status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` GROUP BY l.id ORDER BY l.created_at DESC`;

  return db.prepare(query).all(...values) as LeadWithResumeCount[];
}

export function getLeadById(id: string): Lead | null {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
  return lead || null;
}

export function getLeadByWhatsapp(whatsapp: string): Lead | null {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE whatsapp = ?').get(whatsapp) as Lead | undefined;
  return lead || null;
}

export function updateLead(id: string, data: UpdateLeadRequest): Lead | null {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.whatsapp !== undefined) {
    fields.push('whatsapp = ?');
    values.push(data.whatsapp);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return getLeadById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  // Log activity
  db.prepare(`
    INSERT INTO activities (id, lead_id, activity_type, description, created_at)
    VALUES (?, ?, 'lead_atualizado', 'Dados do lead atualizados', datetime('now'))
  `).run(generateId(), id);

  return getLeadById(id);
}

export function deleteLead(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getLeadStats() {
  const db = getDb();

  const totalLeads = (db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number }).count;

  const totalResumes = (db.prepare('SELECT COUNT(*) as count FROM resumes').get() as { count: number }).count;

  const resumesToday = (db.prepare(
    "SELECT COUNT(*) as count FROM resumes WHERE date(created_at) = date('now')"
  ).get() as { count: number }).count;

  const resumesEdited = (db.prepare(
    "SELECT COUNT(*) as count FROM resumes WHERE status = 'alteracao_solicitada'"
  ).get() as { count: number }).count;

  const resumesPending = (db.prepare(
    "SELECT COUNT(*) as count FROM resumes WHERE status = 'em_producao'"
  ).get() as { count: number }).count;

  const resumesFinished = (db.prepare(
    "SELECT COUNT(*) as count FROM resumes WHERE status = 'finalizado'"
  ).get() as { count: number }).count;

  return {
    total_leads: totalLeads,
    total_resumes: totalResumes,
    resumes_today: resumesToday,
    resumes_edited: resumesEdited,
    resumes_pending: resumesPending,
    resumes_finished: resumesFinished,
  };
}

export function searchLeads(query: string): Lead[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM leads WHERE name LIKE ? OR whatsapp LIKE ? ORDER BY name ASC LIMIT 20`
  ).all(`%${query}%`, `%${query}%`) as Lead[];
}
