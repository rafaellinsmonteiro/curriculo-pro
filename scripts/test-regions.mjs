import postgres from 'postgres';

const regions = [
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com'
];

async function checkRegion(host) {
  const url = `postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@${host}:6543/postgres`;
  console.log(`Checking ${host}...`);
  const sql = postgres(url, { ssl: 'require', connect_timeout: 3 });
  try {
    const res = await sql`SELECT 1 as connected`;
    console.log(`✅ CONNECTED via ${host}:`, res);
    return true;
  } catch (err) {
    console.log(`❌ Failed ${host}:`, err.message);
    return false;
  } finally {
    await sql.end();
  }
}

async function main() {
  for (const r of regions) {
    if (await checkRegion(r)) break;
  }
}

main();
