import postgres from 'postgres';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const sql = postgres(connectionString, { ssl: 'require', max: 1 });

function hashPassword(password) {
  const salt = 'curriculopro_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function seedAdmin() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const adminEmail = 'rafaellinsmonteiro@gmail.com';
    const adminPasswordHash = hashPassword('123456');

    await sql`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (
        'user-admin-01',
        ${adminEmail},
        ${adminPasswordHash},
        'Rafael Lins Monteiro',
        'admin'
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = ${adminPasswordHash};
    `;

    console.log('✅ Administrator user created/updated successfully in Supabase!');
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
  } finally {
    await sql.end();
  }
}

seedAdmin();
