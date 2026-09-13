import Database from 'better-sqlite3';
import postgres from 'postgres';
import path from 'path';
import fs from 'fs';

const localDbPath = path.join(process.cwd(), 'data', 'curriculo-pro.db');
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bmlxuryvisemtwjkyrrw:xbakz2aZR0Pf0Zqj@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

if (!fs.existsSync(localDbPath)) {
  console.log('No local SQLite database found.');
  process.exit(0);
}

const sqlite = new Database(localDbPath);
const pg = postgres(connectionString, { ssl: 'require', max: 1 });

async function migrate() {
  try {
    console.log('🚀 Fast batch migration starting...');

    // 1. Leads
    const leads = sqlite.prepare('SELECT * FROM leads').all();
    for (const lead of leads) {
      await pg`
        INSERT INTO leads (id, lead_code, name, whatsapp, status, notes, created_at, updated_at)
        VALUES (${lead.id}, ${lead.lead_code}, ${lead.name}, ${lead.whatsapp}, ${lead.status}, ${lead.notes || null}, ${lead.created_at}, ${lead.updated_at})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          whatsapp = EXCLUDED.whatsapp,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`✅ ${leads.length} leads inserted/updated.`);

    // 2. Resumes
    const resumes = sqlite.prepare('SELECT * FROM resumes').all();
    for (const resume of resumes) {
      await pg`
        INSERT INTO resumes (id, lead_id, title, status, current_version, created_at, updated_at)
        VALUES (${resume.id}, ${resume.lead_id}, ${resume.title}, ${resume.status}, ${resume.current_version}, ${resume.created_at}, ${resume.updated_at})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          current_version = EXCLUDED.current_version,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`✅ ${resumes.length} resumes inserted/updated.`);

    // Cache valid IDs in memory for instant O(1) checks
    const validResumeIds = new Set(resumes.map(r => r.id));
    const validLeadIds = new Set(leads.map(l => l.id));

    // 3. Resume Versions
    const versions = sqlite.prepare('SELECT * FROM resume_versions').all();
    let insertedVersions = 0;
    for (const version of versions) {
      if (!validResumeIds.has(version.resume_id)) continue;

      await pg`
        INSERT INTO resume_versions (id, resume_id, version_number, structured_data, generation_prompt, edit_instruction, pdf_url, pdf_filename, created_at)
        VALUES (${version.id}, ${version.resume_id}, ${version.version_number}, ${version.structured_data}, ${version.generation_prompt}, ${version.edit_instruction || null}, ${version.pdf_url}, ${version.pdf_filename}, ${version.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
      insertedVersions++;
    }
    console.log(`✅ ${insertedVersions} resume versions inserted.`);

    // 4. Activities
    const activities = sqlite.prepare('SELECT * FROM activities').all();
    let insertedActivities = 0;
    for (const act of activities) {
      if (!validLeadIds.has(act.lead_id)) continue;
      const validResumeId = (act.resume_id && validResumeIds.has(act.resume_id)) ? act.resume_id : null;

      await pg`
        INSERT INTO activities (id, lead_id, resume_id, activity_type, description, created_at)
        VALUES (${act.id}, ${act.lead_id}, ${validResumeId}, ${act.activity_type}, ${act.description}, ${act.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
      insertedActivities++;
    }
    console.log(`✅ ${insertedActivities} activities inserted.`);

    // 5. Counter
    const counterRow = sqlite.prepare("SELECT value FROM counters WHERE name = 'lead_code'").get();
    if (counterRow) {
      await pg`
        INSERT INTO counters (name, value) VALUES ('lead_code', ${counterRow.value})
        ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value
      `;
      console.log(`✅ Counter updated to ${counterRow.value}.`);
    }

    console.log('🎉 Migration completed 100% successfully!');
  } catch (err) {
    console.error('❌ Error during migration:', err);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate();
