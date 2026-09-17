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

export async function getLeadStats(period: 'today' | '7days' | '30days' | 'all' = '30days') {
  const sql = getSql();

  let dateFilter = sql``;
  if (period === 'today') {
    dateFilter = sql`WHERE DATE(created_at) = CURRENT_DATE`;
  } else if (period === '7days') {
    dateFilter = sql`WHERE created_at >= NOW() - INTERVAL '7 days'`;
  } else if (period === '30days') {
    dateFilter = sql`WHERE created_at >= NOW() - INTERVAL '30 days'`;
  }

  // Note: we can't use dynamic WHERE in multiple independent queries easily without repeating,
  // so we'll build them individually or conditionally
  const [totalLeadsRow] = await sql`SELECT COUNT(*)::int as count FROM leads ${period === 'all' ? sql`` : dateFilter}`;
  const [totalResumesRow] = await sql`SELECT COUNT(*)::int as count FROM resumes ${period === 'all' ? sql`` : dateFilter}`;
  const [resumesTodayRow] = await sql`SELECT COUNT(*)::int as count FROM resumes WHERE DATE(created_at) = CURRENT_DATE`;
  
  // Statuses
  let statusWhere = period === 'all' ? sql`WHERE status =` : sql`${dateFilter} AND status =`;
  const [resumesEditedRow] = await sql`SELECT COUNT(*)::int as count FROM resumes ${statusWhere} 'alteracao_solicitada'`;
  const [resumesPendingRow] = await sql`SELECT COUNT(*)::int as count FROM resumes ${statusWhere} 'em_producao'`;
  const [resumesFinishedRow] = await sql`SELECT COUNT(*)::int as count FROM resumes ${statusWhere} 'finalizado'`;

  // Revenue
  let revenueWhere = period === 'all' ? sql`WHERE payment_status =` : sql`${dateFilter} AND payment_status =`;
  const [totalRevenueRow] = await sql`SELECT SUM(price)::float as sum FROM resumes ${revenueWhere} 'pago'`;
  const [pendingRevenueRow] = await sql`SELECT SUM(price)::float as sum FROM resumes ${revenueWhere} 'pendente'`;

  return {
    total_leads: totalLeadsRow?.count || 0,
    total_resumes: totalResumesRow?.count || 0,
    resumes_today: resumesTodayRow?.count || 0,
    resumes_edited: resumesEditedRow?.count || 0,
    resumes_pending: resumesPendingRow?.count || 0,
    resumes_finished: resumesFinishedRow?.count || 0,
    total_revenue: totalRevenueRow?.sum || 0,
    pending_revenue: pendingRevenueRow?.sum || 0,
  };
}

export async function getDashboardChartsData(period: 'today' | '7days' | '30days' | 'all' = '30days') {
  const sql = getSql();
  
  let dateFilter = sql``;
  if (period === 'today') {
    dateFilter = sql`AND created_at >= CURRENT_DATE`;
  } else if (period === '7days') {
    dateFilter = sql`AND created_at >= NOW() - INTERVAL '7 days'`;
  } else if (period === '30days') {
    dateFilter = sql`AND created_at >= NOW() - INTERVAL '30 days'`;
  }

  const revenueData = await sql`
    SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'America/Sao_Paulo'), 'DD/MM') as date, SUM(price)::float as revenue
    FROM resumes
    WHERE payment_status = 'pago' ${dateFilter}
    GROUP BY DATE(created_at AT TIME ZONE 'America/Sao_Paulo')
    ORDER BY DATE(created_at AT TIME ZONE 'America/Sao_Paulo') ASC
  `;

  const resumesData = await sql`
    SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'America/Sao_Paulo'), 'DD/MM') as date, COUNT(*)::int as count
    FROM resumes
    WHERE 1=1 ${dateFilter}
    GROUP BY DATE(created_at AT TIME ZONE 'America/Sao_Paulo')
    ORDER BY DATE(created_at AT TIME ZONE 'America/Sao_Paulo') ASC
  `;
  
  const hourlyData = await sql`
    SELECT TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:00') as hour, COUNT(*)::int as count
    FROM resumes
    WHERE 1=1 ${dateFilter}
    GROUP BY TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:00')
    ORDER BY TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:00') ASC
  `;

  const statusData = await sql`
    SELECT status, COUNT(*)::int as count
    FROM resumes
    WHERE 1=1 ${dateFilter}
    GROUP BY status
  `;

  // Determine chart length
  let chartLength = 30;
  if (period === 'today') chartLength = 1;
  else if (period === '7days') chartLength = 7;
  else if (period === '30days') chartLength = 30;

  let revenueChart = [];
  let resumesChart = [];

  if (period !== 'all') {
    const daysArray = Array.from({ length: chartLength }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((chartLength - 1) - i));
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    });

    revenueChart = daysArray.map(dateStr => {
      const found = revenueData.find(row => row.date === dateStr);
      return { date: dateStr, revenue: found ? found.revenue : 0 };
    });

    resumesChart = daysArray.map(dateStr => {
      const found = resumesData.find(row => row.date === dateStr);
      return { date: dateStr, count: found ? found.count : 0 };
    });
  } else {
    // For 'all', just use the data as-is without filling gaps
    revenueChart = revenueData;
    resumesChart = resumesData;
  }
  
  // Fill gaps for 24 hours
  const hoursArray = Array.from({ length: 24 }).map((_, i) => {
    return `${String(i).padStart(2, '0')}:00`;
  });
  
  const hourlyChart = hoursArray.map(hourStr => {
    const found = hourlyData.find(row => row.hour === hourStr);
    return { hour: hourStr, count: found ? found.count : 0 };
  });

  const statusMap: Record<string, string> = {
    'novo': 'Novo',
    'em_producao': 'Em Produção',
    'aguardando_aprovacao': 'Aguardando',
    'alteracao_solicitada': 'Alteração',
    'finalizado': 'Finalizado'
  };

  const statusChart = statusData.map(row => ({
    name: statusMap[row.status] || row.status,
    value: row.count
  }));

  return {
    revenueChart,
    resumesChart,
    hourlyChart,
    statusChart
  };
}

export async function searchLeads(query: string): Promise<Lead[]> {
  const sql = getSql();
  const searchPattern = `%${query}%`;
  return await sql<Lead[]>`
    SELECT * FROM leads WHERE name ILIKE ${searchPattern} OR whatsapp ILIKE ${searchPattern} ORDER BY name ASC LIMIT 20
  `;
}
