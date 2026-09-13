// ==========================================
// CurrículoPRO — Activities Service
// ==========================================

import { getDb } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Activity, ActivityType } from '@/lib/types';

export function logActivity(data: {
  lead_id: string;
  resume_id?: string;
  activity_type: ActivityType;
  description: string;
}): Activity {
  const db = getDb();
  const id = generateId();

  db.prepare(`
    INSERT INTO activities (id, lead_id, resume_id, activity_type, description, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, data.lead_id, data.resume_id || null, data.activity_type, data.description);

  return db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as Activity;
}

export function getActivitiesByLeadId(leadId: string, limit = 50): Activity[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(leadId, limit) as Activity[];
}

export function getRecentActivities(limit = 20): (Activity & { lead_name: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, l.name as lead_name
    FROM activities a
    JOIN leads l ON l.id = a.lead_id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit) as (Activity & { lead_name: string })[];
}
