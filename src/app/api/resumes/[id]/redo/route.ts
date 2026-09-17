// ==========================================
// CurrículoPRO — Resume Redo API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumeWithLead, updateResumeVersion, updateResumeStatus } from '@/lib/services/resumes';
import { getLatestVersion, createVersion } from '@/lib/services/resume-versions';
import { logActivity } from '@/lib/services/activities';
import { generateResume } from '@/lib/services/openai';
import { generatePDF } from '@/lib/services/pdf';
import { generatePdfFilename } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  context: RouteContext<'/api/resumes/[id]/redo'>
) {
  try {
    const { id } = await context.params;

    const resume = await getResumeWithLead(id);
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    const currentVersion = await getLatestVersion(id);
    if (!currentVersion) {
      return NextResponse.json(
        { error: 'Nenhuma versão encontrada' },
        { status: 404 }
      );
    }

    // Re-generate using the same prompt, or fallback to an edit if the original prompt was empty (e.g. from an image)
    let structured_data;
    const currentData = JSON.parse(currentVersion.structured_data);

    if (currentVersion.generation_prompt && currentVersion.generation_prompt.trim().length > 0) {
      const result = await generateResume(currentVersion.generation_prompt);
      structured_data = result.structured_data;
    } else {
      const { editResume } = require('@/lib/services/openai');
      const instruction = "Revise e melhore a escrita deste currículo. IMPORTANTE: Se o currículo for curto (com poucas informações), INVENTE e preencha as sessões 'objetivo_profissional' e 'informacoes_adicionais' com informações profissionais genéricas da área (ex: disponibilidade, comprometimento), e estique os textos de resumo e perfil para deixá-lo longo e robusto.";
      const result = await editResume(currentData, instruction);
      structured_data = result.structured_data;
    }

    // Preserve profile photo from the previous version
    if (currentData.foto_perfil) {
      structured_data.foto_perfil = currentData.foto_perfil;
    }

    // Generate new PDF
    const newVersionNumber = currentVersion.version_number + 1;
    const pdfFilename = generatePdfFilename(resume.lead_name);
    const uniqueFilename = `${id}_v${newVersionNumber}_${pdfFilename}`;
    const { url: pdfUrl } = await generatePDF(structured_data, uniqueFilename);

    // Create new version (sanitize strings to prevent PostgreSQL null byte error)
    const sanitizedPrompt = currentVersion.generation_prompt ? currentVersion.generation_prompt.replace(/\0/g, '') : null;
    const sanitizedStructuredData = JSON.stringify(structured_data).replace(/\0/g, '');

    await createVersion({
      resume_id: id,
      version_number: newVersionNumber,
      structured_data: sanitizedStructuredData,
      generation_prompt: sanitizedPrompt,
      pdf_url: pdfUrl,
      pdf_filename: uniqueFilename,
    });

    // Update resume
    await updateResumeVersion(id, newVersionNumber);
    await updateResumeStatus(id, 'pronto');

    // Log activity
    await logActivity({
      lead_id: resume.lead_id,
      resume_id: id,
      activity_type: 'curriculo_refeito',
      description: `Currículo "${resume.title}" refeito`,
    });

    return NextResponse.json({
      success: true,
      version: newVersionNumber,
    });
  } catch (error) {
    console.error('Error redoing resume:', error);
    const message = error instanceof Error ? error.message : 'Erro ao refazer currículo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
