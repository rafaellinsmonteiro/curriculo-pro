// ==========================================
// CurrículoPRO — Database Layer (Supabase PostgreSQL)
// ==========================================

import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

let sqlClient: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(connectionString, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
    });
  }
  return sqlClient;
}

/**
 * Get the next lead code (LEAD-00001, LEAD-00002, etc.)
 */
export async function getNextLeadCode(): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    UPDATE counters SET value = value + 1 WHERE name = 'lead_code' RETURNING value
  `;

  if (rows.length === 0) {
    await sql`INSERT INTO counters (name, value) VALUES ('lead_code', 1) ON CONFLICT (name) DO UPDATE SET value = 1`;
    return 'LEAD-00001';
  }

  return `LEAD-${String(rows[0].value).padStart(5, '0')}`;
}
