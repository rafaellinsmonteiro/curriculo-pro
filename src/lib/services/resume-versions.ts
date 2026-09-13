// ==========================================
// CurrículoPRO — Resume Versions Service (Supabase)
// ==========================================

import { getSql } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { ResumeVersion } from '@/lib/types';

export async function createVersion(data: {
  resume_id: string;
  version_number: number;
  structured_data: string;
  generation_prompt: string;
  edit_instruction?: string;
  pdf_url: string;
  pdf_filename: string;
}): Promise<ResumeVersion> {
  const sql = getSql();
  const id = generateId();

  const [version] = await sql<ResumeVersion[]>`
    INSERT INTO resume_versions (
      id, resume_id, version_number, structured_data, generation_prompt, edit_instruction, pdf_url, pdf_filename, created_at
    )
    VALUES (
      ${id},
      ${data.resume_id},
      ${data.version_number},
      ${data.structured_data},
      ${data.generation_prompt},
      ${data.edit_instruction || null},
      ${data.pdf_url},
      ${data.pdf_filename},
      NOW()
    )
    RETURNING *
  `;

  return version;
}

export async function getVersionsByResumeId(resumeId: string): Promise<ResumeVersion[]> {
  const sql = getSql();
  return await sql<ResumeVersion[]>`
    SELECT * FROM resume_versions WHERE resume_id = ${resumeId} ORDER BY version_number DESC
  `;
}

export async function getVersionById(id: string): Promise<ResumeVersion | null> {
  const sql = getSql();
  const [version] = await sql<ResumeVersion[]>`
    SELECT * FROM resume_versions WHERE id = ${id}
  `;
  return version || null;
}

export async function getLatestVersion(resumeId: string): Promise<ResumeVersion | null> {
  const sql = getSql();
  const [version] = await sql<ResumeVersion[]>`
    SELECT * FROM resume_versions WHERE resume_id = ${resumeId} ORDER BY version_number DESC LIMIT 1
  `;
  return version || null;
}

export async function getVersionByNumber(resumeId: string, versionNumber: number): Promise<ResumeVersion | null> {
  const sql = getSql();
  const [version] = await sql<ResumeVersion[]>`
    SELECT * FROM resume_versions WHERE resume_id = ${resumeId} AND version_number = ${versionNumber}
  `;
  return version || null;
}
