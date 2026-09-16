// ==========================================
// CurrículoPRO — Resumes Service (Supabase)
// ==========================================

import { getSql } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Resume, ResumeWithLead, ResumeStatus, PaymentStatus } from '@/lib/types';

export async function createResume(data: {
  lead_id: string;
  title: string;
}): Promise<Resume> {
  const sql = getSql();
  const id = generateId();

  const [resume] = await sql<Resume[]>`
    INSERT INTO resumes (id, lead_id, title, status, current_version, created_at, updated_at)
    VALUES (${id}, ${data.lead_id}, ${data.title}, 'em_producao', 0, NOW(), NOW())
    RETURNING *
  `;

  // Update lead status
  await sql`UPDATE leads SET status = 'em_producao', updated_at = NOW() WHERE id = ${data.lead_id}`;

  return resume;
}

export async function getResumes(params?: {
  search?: string;
  status?: ResumeStatus;
  period?: 'today' | '7days' | '30days';
}): Promise<ResumeWithLead[]> {
  const sql = getSql();

  let query = sql`
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

  const searchPattern = params?.search ? `%${params.search}%` : null;

  if (params?.search && params?.status && params?.period === 'today') {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE (l.name ILIKE ${searchPattern} OR l.whatsapp ILIKE ${searchPattern} OR r.title ILIKE ${searchPattern})
        AND r.status = ${params.status}
        AND DATE(r.created_at) = CURRENT_DATE
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.search && params?.status) {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE (l.name ILIKE ${searchPattern} OR l.whatsapp ILIKE ${searchPattern} OR r.title ILIKE ${searchPattern})
        AND r.status = ${params.status}
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.search) {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE (l.name ILIKE ${searchPattern} OR l.whatsapp ILIKE ${searchPattern} OR r.title ILIKE ${searchPattern})
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.status && params?.period === 'today') {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE r.status = ${params.status}
        AND DATE(r.created_at) = CURRENT_DATE
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.status) {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE r.status = ${params.status}
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.period === 'today') {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE DATE(r.created_at) = CURRENT_DATE
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.period === '7days') {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE r.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY r.updated_at DESC
    `;
  } else if (params?.period === '30days') {
    return await sql<ResumeWithLead[]>`
      ${query}
      WHERE r.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY r.updated_at DESC
    `;
  }

  return await sql<ResumeWithLead[]>`
    ${query}
    ORDER BY r.updated_at DESC
  `;
}

export async function getResumeById(id: string): Promise<Resume | null> {
  const sql = getSql();
  const [resume] = await sql<Resume[]>`SELECT * FROM resumes WHERE id = ${id}`;
  return resume || null;
}

export async function getResumeWithLead(id: string): Promise<ResumeWithLead | null> {
  const sql = getSql();
  const [resume] = await sql<ResumeWithLead[]>`
    SELECT r.*,
           l.name as lead_name,
           l.whatsapp as lead_whatsapp,
           l.lead_code as lead_code,
           rv.pdf_url,
           rv.pdf_filename
    FROM resumes r
    JOIN leads l ON l.id = r.lead_id
    LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
    WHERE r.id = ${id}
  `;
  return resume || null;
}

export async function getResumesByLeadId(leadId: string): Promise<ResumeWithLead[]> {
  const sql = getSql();
  return await sql<ResumeWithLead[]>`
    SELECT r.*,
           l.name as lead_name,
           l.whatsapp as lead_whatsapp,
           l.lead_code as lead_code,
           rv.pdf_url,
           rv.pdf_filename
    FROM resumes r
    JOIN leads l ON l.id = r.lead_id
    LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
    WHERE r.lead_id = ${leadId}
    ORDER BY r.created_at DESC
  `;
}

export async function updateResumeStatus(id: string, status: ResumeStatus): Promise<Resume | null> {
  const sql = getSql();
  const [updated] = await sql<Resume[]>`
    UPDATE resumes SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return updated || null;
}

export async function updateResumeVersion(id: string, versionNumber: number): Promise<Resume | null> {
  const sql = getSql();
  const [updated] = await sql<Resume[]>`
    UPDATE resumes SET current_version = ${versionNumber}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return updated || null;
}

export async function updateResumePayment(id: string, paymentStatus: PaymentStatus, price: number): Promise<Resume | null> {
  const sql = getSql();
  const [updated] = await sql<Resume[]>`
    UPDATE resumes SET payment_status = ${paymentStatus}, price = ${price}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return updated || null;
}

export async function renameResume(id: string, title: string): Promise<Resume | null> {
  const sql = getSql();
  const [updated] = await sql<Resume[]>`
    UPDATE resumes SET title = ${title}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return updated || null;
}

export async function reassignResume(id: string, leadId: string): Promise<Resume | null> {
  const sql = getSql();
  const [updated] = await sql<Resume[]>`
    UPDATE resumes SET lead_id = ${leadId}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return updated || null;
}

export async function deleteResume(id: string): Promise<boolean> {
  const sql = getSql();
  const result = await sql`DELETE FROM resumes WHERE id = ${id}`;
  return result.count > 0;
}
