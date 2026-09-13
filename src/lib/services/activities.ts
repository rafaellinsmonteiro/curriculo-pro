// ==========================================
// CurrículoPRO — Activities Service (Supabase)
// ==========================================

import { getSql } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Activity, ActivityType } from '@/lib/types';

export async function logActivity(data: {
  lead_id: string;
  resume_id?: string;
  activity_type: ActivityType;
  description: string;
}): Promise<Activity> {
  const sql = getSql();
  const id = generateId();

  const [activity] = await sql<Activity[]>`
    INSERT INTO activities (id, lead_id, resume_id, activity_type, description, created_at)
    VALUES (${id}, ${data.lead_id}, ${data.resume_id || null}, ${data.activity_type}, ${data.description}, NOW())
    RETURNING *
  `;

  return activity;
}

export async function getActivitiesByLeadId(leadId: string, limit = 50): Promise<Activity[]> {
  const sql = getSql();
  return await sql<Activity[]>`
    SELECT * FROM activities WHERE lead_id = ${leadId} ORDER BY created_at DESC LIMIT ${limit}
  `;
}

export async function getRecentActivities(limit = 20): Promise<(Activity & { lead_name: string })[]> {
  const sql = getSql();
  return await sql<(Activity & { lead_name: string })[]>`
    SELECT a.*, l.name as lead_name
    FROM activities a
    JOIN leads l ON l.id = a.lead_id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
}
