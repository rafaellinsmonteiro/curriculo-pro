// ==========================================
// CurrículoPRO — Leads Service (Supabase)
// ==========================================

import { getSql, getNextLeadCode } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Lead, LeadWithResumeCount, LeadStatus, CreateLeadRequest, UpdateLeadRequest } from '@/lib/types';

export async function createLead(data: CreateLeadRequest): Promise<Lead> {
  const sql = getSql();
  const id = generateId();
  const leadCode = await getNextLeadCode();

  const [lead] = await sql<Lead[]>`
    INSERT INTO leads (id, lead_code, name, whatsapp, status, notes, created_at, updated_at)
    VALUES (${id}, ${leadCode}, ${data.name}, ${data.whatsapp}, 'novo', ${data.notes || null}, NOW(), NOW())
    RETURNING *
  `;

  // Log activity
  await sql`
    INSERT INTO activities (id, lead_id, activity_type, description, created_at)
    VALUES (${generateId()}, ${id}, 'lead_criado', ${`Lead ${data.name} cadastrado`}, NOW())
  `;

  return lead;
}

export async function getLeads(params?: {
  search?: string;
  status?: LeadStatus;
}): Promise<LeadWithResumeCount[]> {
  const sql = getSql();

  let leads: LeadWithResumeCount[];

  if (params?.search && params?.status) {
    const searchPattern = `%${params.search}%`;
    leads = await sql<LeadWithResumeCount[]>`
      SELECT l.*, COUNT(r.id)::int as resume_count
      FROM leads l
      LEFT JOIN resumes r ON r.lead_id = l.id
      WHERE (l.name ILIKE ${searchPattern} OR l.whatsapp ILIKE ${searchPattern})
        AND l.status = ${params.status}
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
  } else if (params?.search) {
    const searchPattern = `%${params.search}%`;
    leads = await sql<LeadWithResumeCount[]>`
      SELECT l.*, COUNT(r.id)::int as resume_count
      FROM leads l
      LEFT JOIN resumes r ON r.lead_id = l.id
      WHERE (l.name ILIKE ${searchPattern} OR l.whatsapp ILIKE ${searchPattern})
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
  } else if (params?.status) {
    leads = await sql<LeadWithResumeCount[]>`
      SELECT l.*, COUNT(r.id)::int as resume_count
      FROM leads l
      LEFT JOIN resumes r ON r.lead_id = l.id
      WHERE l.status = ${params.status}
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
  } else {
    leads = await sql<LeadWithResumeCount[]>`
      SELECT l.*, COUNT(r.id)::int as resume_count
      FROM leads l
      LEFT JOIN resumes r ON r.lead_id = l.id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;
  }

  return leads;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const sql = getSql();
  const [lead] = await sql<Lead[]>`SELECT * FROM leads WHERE id = ${id}`;
  return lead || null;
}

export async function getLeadByWhatsapp(whatsapp: string): Promise<Lead | null> {
  const sql = getSql();
  const [lead] = await sql<Lead[]>`SELECT * FROM leads WHERE whatsapp = ${whatsapp}`;
  return lead || null;
}

export async function updateLead(id: string, data: UpdateLeadRequest): Promise<Lead | null> {
  const sql = getSql();

  const current = await getLeadById(id);
  if (!current) return null;

  const newName = data.name !== undefined ? data.name : current.name;
  const newWhatsapp = data.whatsapp !== undefined ? data.whatsapp : current.whatsapp;
  const newStatus = data.status !== undefined ? data.status : current.status;
  const newNotes = data.notes !== undefined ? data.notes : current.notes;

  const [updated] = await sql<Lead[]>`
    UPDATE leads
    SET name = ${newName}, whatsapp = ${newWhatsapp}, status = ${newStatus}, notes = ${newNotes}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  // Log activity
  await sql`
    INSERT INTO activities (id, lead_id, activity_type, description, created_at)
    VALUES (${generateId()}, ${id}, 'lead_atualizado', 'Dados do lead atualizados', NOW())
  `;

  return updated;
}

export async function deleteLead(id: string): Promise<boolean> {
  const sql = getSql();
  const result = await sql`DELETE FROM leads WHERE id = ${id}`;
  return result.count > 0;
}

export async function getLeadStats() {
  const sql = getSql();

  const [totalLeadsRow] = await sql`SELECT COUNT(*)::int as count FROM leads`;
  const [totalResumesRow] = await sql`SELECT COUNT(*)::int as count FROM resumes`;
  const [resumesTodayRow] = await sql`SELECT COUNT(*)::int as count FROM resumes WHERE DATE(created_at) = CURRENT_DATE`;
  const [resumesEditedRow] = await sql`SELECT COUNT(*)::int as count FROM resumes WHERE status = 'alteracao_solicitada'`;
  const [resumesPendingRow] = await sql`SELECT COUNT(*)::int as count FROM resumes WHERE status = 'em_producao'`;
  const [resumesFinishedRow] = await sql`SELECT COUNT(*)::int as count FROM resumes WHERE status = 'finalizado'`;

  return {
    total_leads: totalLeadsRow?.count || 0,
    total_resumes: totalResumesRow?.count || 0,
    resumes_today: resumesTodayRow?.count || 0,
    resumes_edited: resumesEditedRow?.count || 0,
    resumes_pending: resumesPendingRow?.count || 0,
    resumes_finished: resumesFinishedRow?.count || 0,
  };
}

export async function searchLeads(query: string): Promise<Lead[]> {
  const sql = getSql();
  const searchPattern = `%${query}%`;
  return await sql<Lead[]>`
    SELECT * FROM leads WHERE name ILIKE ${searchPattern} OR whatsapp ILIKE ${searchPattern} ORDER BY name ASC LIMIT 20
  `;
}
