// ==========================================
// CurrículoPRO — Resume Edit API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumeWithLead, updateResumeVersion, updateResumeStatus } from '@/lib/services/resumes';
import { getLatestVersion, createVersion } from '@/lib/services/resume-versions';
import { logActivity } from '@/lib/services/activities';
import { editResume, transcribeAudio } from '@/lib/services/openai';
import { generatePDF } from '@/lib/services/pdf';
import { generatePdfFilename } from '@/lib/utils';
import type { StructuredResumeData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/resumes/[id]/edit'>
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const edit_instruction = formData.get('edit_instruction') as string;
    const files = formData.getAll('files') as File[];

    if (!edit_instruction && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: 'Instrução de edição ou anexos são obrigatórios' },
        { status: 400 }
      );
    }

    // Get current resume and version
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

    // Parse current structured data
    const currentData = JSON.parse(currentVersion.structured_data) as StructuredResumeData;

    // Parse attachments
    let extractedText = '';
    const images: { base64: string; mimeType: string }[] = [];

    if (files && files.length > 0) {
      if (typeof global.DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix {};
      }
      if (typeof global.Path2D === 'undefined') {
        (global as any).Path2D = class Path2D {};
      }
      
      const pdfParseLib = require('pdf-parse-new');
      const pdfParse = pdfParseLib.default || pdfParseLib;
      
      for (const file of files) {
        const filename = file.name.toLowerCase();
        if (file.type === 'application/pdf' || filename.endsWith('.pdf')) {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const data = await pdfParse(buffer);
            const cleanedText = (data.text || '').replace(/\s+/g, ' ').trim();
            
            if (cleanedText.length < 150) {
              console.log(`PDF "${file.name}" text extraction poor (${cleanedText.length} chars). Converting to image...`);
              try {
                const { pdf } = await import('pdf-to-img');
                let pageNum = 0;
                for await (const page of await pdf(buffer, { scale: 2 })) {
                  pageNum++;
                  if (pageNum > 3) break;
                  const base64 = Buffer.from(page).toString('base64');
                  images.push({ base64, mimeType: 'image/png' });
                }
              } catch (imgErr) {
                console.error(`Erro ao converter PDF para imagem:`, imgErr);
                if (cleanedText.length > 0) {
                  extractedText += `\n--- Conteúdo do arquivo ${file.name} ---\n${data.text}\n`;
                }
              }
            } else {
              extractedText += `\n--- Conteúdo do arquivo ${file.name} ---\n${data.text}\n`;
            }
          } catch (e) {
            console.error(`Erro ao parsear PDF ${file.name}:`, e);
          }
        } else if (filename.endsWith('.docx')) {
          const mammoth = require('mammoth');
          const buffer = Buffer.from(await file.arrayBuffer());
          try {
            const result = await mammoth.extractRawText({ buffer });
            extractedText += `\n--- Conteúdo do arquivo ${file.name} ---\n${result.value}\n`;
          } catch (e) {
            console.error(`Erro ao parsear DOCX ${file.name}:`, e);
          }
        } else if (filename.endsWith('.doc')) {
          const WordExtractor = require('word-extractor');
          const extractor = new WordExtractor();
          const buffer = Buffer.from(await file.arrayBuffer());
          try {
            const doc = await extractor.extract(buffer);
            extractedText += `\n--- Conteúdo do arquivo ${file.name} ---\n${doc.getBody()}\n`;
          } catch (e) {
            console.error(`Erro ao parsear DOC ${file.name}:`, e);
          }
        } else if (file.type.startsWith('image/')) {
          const buffer = Buffer.from(await file.arrayBuffer());
          images.push({ base64: buffer.toString('base64'), mimeType: file.type });
        } else if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(filename)) {
          const buffer = Buffer.from(await file.arrayBuffer());
          try {
            console.log(`Transcrevendo áudio "${file.name}"...`);
            const transcription = await transcribeAudio(buffer, file.name);
            extractedText += `\n--- Transcrição do áudio ${file.name} ---\n${transcription}\n`;
            console.log(`Áudio "${file.name}" transcrito com sucesso (${transcription.length} chars).`);
          } catch (e) {
            console.error(`Erro ao transcrever áudio ${file.name}:`, e);
          }
        }
      }
    }

    const finalInstruction = `
${edit_instruction}

${extractedText ? `\nConsidere também os dados dos seguintes anexos em PDF para as alterações:\n${extractedText}` : ''}
    `.trim();

    // Call OpenAI to apply edits
    const { structured_data } = await editResume(currentData, finalInstruction, images);

    const foto_perfil = formData.get('foto_perfil') as string || null;
    
    // Inject or keep existing profile photo
    if (foto_perfil) {
      structured_data.foto_perfil = foto_perfil;
    } else if (currentData.foto_perfil) {
      structured_data.foto_perfil = currentData.foto_perfil;
    }

    // Generate new PDF
    const newVersionNumber = currentVersion.version_number + 1;
    const pdfFilename = generatePdfFilename(resume.lead_name);
    const uniqueFilename = `${id}_v${newVersionNumber}_${pdfFilename}`;
    const { url: pdfUrl } = await generatePDF(structured_data, uniqueFilename);

    // Create new version
    await createVersion({
      resume_id: id,
      version_number: newVersionNumber,
      structured_data: JSON.stringify(structured_data),
      generation_prompt: currentVersion.generation_prompt,
      edit_instruction: edit_instruction || 'Atualização via anexo',
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
      activity_type: 'curriculo_editado',
      description: `Currículo editado: "${(edit_instruction || 'Atualização via anexo').substring(0, 100)}"`,
    });

    return NextResponse.json({
      success: true,
      version: newVersionNumber,
    });
  } catch (error) {
    console.error('Error editing resume:', error);
    const message = error instanceof Error ? error.message : 'Erro ao editar currículo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
