// ==========================================
// CurrículoPRO — PDF Download API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumeWithLead } from '@/lib/services/resumes';
import { getLatestVersion, getVersionByNumber } from '@/lib/services/resume-versions';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/resumes/[id]/download'>
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const versionNumber = searchParams.get('version');

    const resume = getResumeWithLead(id);
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    let version;
    if (versionNumber) {
      version = getVersionByNumber(id, parseInt(versionNumber));
    } else {
      version = getLatestVersion(id);
    }

    if (!version) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'pdfs', version.pdf_filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo PDF não encontrado' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const sanitizedName = `Curriculo_${resume.lead_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizedName}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({ error: 'Erro ao baixar PDF' }, { status: 500 });
  }
}
