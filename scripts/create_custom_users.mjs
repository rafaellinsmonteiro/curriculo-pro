import crypto from 'crypto';
import postgres from 'postgres';

function hashPassword(password) {
  const salt = 'curriculopro_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  const users = [
    { email: 'igorroocha2525@gmail.com', name: 'Igor Rocha' },
    { email: 'allanbbarros@hotmail.com', name: 'Allan Barros' },
    { email: 'victorbtlha0605@gmail.com', name: 'Victor' }
  ];

  try {
    for (const u of users) {
      const passwordHash = hashPassword('123456');
      
      // Check if user exists
      const existing = await sql`SELECT id FROM users WHERE email = ${u.email}`;
      
      if (existing.length === 0) {
        // Insert user
        await sql`
          INSERT INTO users (id, name, email, password_hash, role, created_at)
          VALUES (gen_random_uuid(), ${u.name}, ${u.email}, ${passwordHash}, 'admin', NOW())
        `;
        console.log(`User created: ${u.email}`);
      } else {
        // Update password if they exist
        await sql`
          UPDATE users SET password_hash = ${passwordHash} WHERE email = ${u.email}
        `;
        console.log(`User updated: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
