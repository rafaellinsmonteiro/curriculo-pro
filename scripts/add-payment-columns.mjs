import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

console.log('Connecting to database...');
const sql = postgres(connectionString, { ssl: 'require', max: 1 });

async function addColumns() {
  try {
    console.log('Adding payment_status and price columns to resumes table...');
    await sql`
      ALTER TABLE resumes 
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente',
      ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 10.00;
    `;
    console.log('✅ Successfully added columns!');
  } catch (err) {
    console.error('❌ Error altering table:', err);
  } finally {
    await sql.end();
  }
}

addColumns();
