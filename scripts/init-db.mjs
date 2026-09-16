import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

console.log('Connecting to Supabase PostgreSQL at db.bmlxuryvisemtwjkyrrw.supabase.co...');
const sql = postgres(connectionString, { ssl: 'require', max: 1 });

async function init() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        lead_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'novo',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'em_producao',
        current_version INT NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'pendente',
        price NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS resume_versions (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        version_number INT NOT NULL,
        structured_data TEXT NOT NULL,
        generation_prompt TEXT NOT NULL,
        edit_instruction TEXT,
        pdf_url TEXT NOT NULL,
        pdf_filename TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS counters (
        name TEXT PRIMARY KEY,
        value INT NOT NULL DEFAULT 0
      );
    `;

    await sql`
      INSERT INTO counters (name, value) VALUES ('lead_code', 0) ON CONFLICT (name) DO NOTHING;
    `;

    console.log('✅ Successfully created all database tables in Supabase!');
  } catch (err) {
    console.error('❌ Error initializing tables:', err);
  } finally {
    await sql.end();
  }
}

init();
