import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const sql = postgres(connectionString, { ssl: 'require', max: 1 });

async function fixRls() {
  try {
    console.log('Checking and disabling RLS on all Supabase tables...');

    const tables = ['leads', 'resumes', 'resume_versions', 'activities', 'counters', 'users'];

    for (const table of tables) {
      await sql.unsafe(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
      await sql.unsafe(`GRANT ALL ON TABLE ${table} TO postgres, anon, authenticated, service_role;`);
      console.log(`✅ RLS disabled & ALL granted on table "${table}".`);
    }

    // Also grant sequence permissions if any
    await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;`;

    console.log('🎉 RLS disabled and full permissions granted on all tables!');
  } catch (err) {
    console.error('❌ Error fixing RLS:', err);
  } finally {
    await sql.end();
  }
}

fixRls();
