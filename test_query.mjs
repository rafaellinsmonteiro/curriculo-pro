import { getSql } from './src/lib/db.js';

async function run() {
  const sql = getSql();
  try {
    const resumes = await sql`
      SELECT r.*,
             l.name as lead_name,
             l.whatsapp as lead_whatsapp,
             l.lead_code as lead_code,
             rv.pdf_url,
             rv.pdf_filename
      FROM resumes r
      JOIN leads l ON l.id = r.lead_id
      LEFT JOIN resume_versions rv ON rv.resume_id = r.id AND rv.version_number = r.current_version
      ORDER BY r.updated_at DESC
    `;
    console.log(resumes);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
