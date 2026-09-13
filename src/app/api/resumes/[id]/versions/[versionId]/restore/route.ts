// ==========================================
// CurrículoPRO — Restore Version API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumeWithLead, updateResumeVersion, updateResumeStatus } from '@/lib/services/resumes';
import { getVersionById, getLatestVersion, createVersion } from '@/lib/services/resume-versions';
import { logActivity } from '@/lib/services/activities';
import { generatePDF } from '@/lib/services/pdf';
import { generatePdfFilename } from '@/lib/utils';
import type { StructuredResumeData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  context: RouteContext<'/api/resumes/[id]/versions/[versionId]/restore'>
) {
  try {
    const { id, versionId } = await context.params;

    const resume = getResumeWithLead(id);
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    const versionToRestore = getVersionById(versionId);
    if (!versionToRestore) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });
    }

    const latest = getLatestVersion(id);
    const newVersionNumber = (latest?.version_number || 0) + 1;

    // Re-generate PDF from restored data
    const structuredData = JSON.parse(versionToRestore.structured_data) as StructuredResumeData;
    const pdfFilename = generatePdfFilename(resume.lead_name);
    const uniqueFilename = `${id}_v${newVersionNumber}_${pdfFilename}`;
    const { url: pdfUrl } = await generatePDF(structuredData, uniqueFilename);

    // Create new version based on restored one
    createVersion({
      resume_id: id,
      version_number: newVersionNumber,
      structured_data: versionToRestore.structured_data,
      generation_prompt: versionToRestore.generation_prompt,
      edit_instruction: `Restaurado da versão ${versionToRestore.version_number}`,
      pdf_url: pdfUrl,
      pdf_filename: uniqueFilename,
    });

    updateResumeVersion(id, newVersionNumber);
    updateResumeStatus(id, 'pronto');

    logActivity({
      lead_id: resume.lead_id,
      resume_id: id,
      activity_type: 'versao_restaurada',
      description: `Versão ${versionToRestore.version_number} restaurada como V${newVersionNumber}`,
    });

    return NextResponse.json({
      success: true,
      version: newVersionNumber,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json({ error: 'Erro ao restaurar versão' }, { status: 500 });
  }
}
