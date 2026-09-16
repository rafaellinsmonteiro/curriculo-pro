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

    const resume = await getResumeWithLead(id);
    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    let version;
    if (versionNumber) {
      version = await getVersionByNumber(id, parseInt(versionNumber));
    } else {
      version = await getLatestVersion(id);
    }

    if (!version) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'pdfs', version.pdf_filename);
    const tmpPath = path.join('/tmp', 'pdfs', version.pdf_filename);
    let fileBuffer: Buffer | null = null;

    if (fs.existsSync(publicPath)) {
      fileBuffer = fs.readFileSync(publicPath);
    } else if (fs.existsSync(tmpPath)) {
      fileBuffer = fs.readFileSync(tmpPath);
    } else {
      // Serverless fallback: regenerate PDF dynamically from structured data
      const { generatePDF } = await import('@/lib/services/pdf');
      const structuredData = JSON.parse(version.structured_data);
      const { filePath } = await generatePDF(structuredData, version.pdf_filename);
      if (fs.existsSync(filePath)) {
        fileBuffer = fs.readFileSync(filePath);
      } else if (fs.existsSync(publicPath)) {
        fileBuffer = fs.readFileSync(publicPath);
      } else if (fs.existsSync(tmpPath)) {
        fileBuffer = fs.readFileSync(tmpPath);
      } else {
        return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
      }
    }

    const sanitizedName = `Curriculo_${resume.lead_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;

    const inline = searchParams.get('inline') === 'true';
    const disposition = inline ? 'inline' : `attachment; filename="${sanitizedName}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({ error: 'Erro ao baixar PDF' }, { status: 500 });
  }
}
