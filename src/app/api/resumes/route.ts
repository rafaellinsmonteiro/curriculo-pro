// ==========================================
// CurrículoPRO — Resumes API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumes, createResume, updateResumeVersion, updateResumeStatus } from '@/lib/services/resumes';
import { getLeadById, getLeadByWhatsapp, createLead } from '@/lib/services/leads';
import { createVersion } from '@/lib/services/resume-versions';
import { logActivity } from '@/lib/services/activities';
import { generateResume, transcribeAudio } from '@/lib/services/openai';
import { generatePDF } from '@/lib/services/pdf';
import { generatePdfFilename } from '@/lib/utils';
import type { ResumeStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed for Vercel hobby plan, prevents OpenAI timeout

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as ResumeStatus) || undefined;
    const period = (searchParams.get('period') as 'today' | '7days' | '30days') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { data, total } = await getResumes({ search, status, period, page, limit });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ data, total, page, totalPages });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Erro ao buscar currículos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const whatsappRaw = formData.get('whatsapp') as string;
    const promptInput = formData.get('prompt') as string || '';
    const files = formData.getAll('files') as File[];

    // 1. Parse attachments
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
          const buffer = Buffer.from(await file.arrayBuffer());
          try {
            const data = await pdfParse(buffer);
            const cleanedText = (data.text || '').replace(/\s+/g, ' ').trim();
            
            // If text extraction is poor (scanned PDF, non-standard fonts, etc.),
            // convert pages to images and send via GPT vision instead
            if (cleanedText.length < 150) {
              console.log(`PDF "${file.name}" text extraction poor (${cleanedText.length} chars). Converting to image...`);
              try {
                const { pdf } = await import('pdf-to-img');
                let pageNum = 0;
                for await (const page of await pdf(buffer, { scale: 2 })) {
                  pageNum++;
                  if (pageNum > 3) break; // Max 3 pages
                  const base64 = Buffer.from(page).toString('base64');
                  images.push({ base64, mimeType: 'image/png' });
                }
                console.log(`Converted ${pageNum} page(s) to images for vision processing.`);
              } catch (imgErr) {
                console.error(`Erro ao converter PDF para imagem:`, imgErr);
                // Still use whatever text we got
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

    // 2. Construct final prompt
    const finalPromptParts = [];
    if (promptInput.trim()) {
      finalPromptParts.push(`Instruções adicionais do usuário:\n${promptInput.trim()}`);
    }
    if (extractedText.trim()) {
      finalPromptParts.push(`Dados anexados:\n${extractedText.trim()}`);
    }
    const finalPrompt = finalPromptParts.join('\n\n');

    if (!finalPrompt && images.length === 0) {
      return NextResponse.json(
        { error: 'Forneça instruções ou anexe um arquivo' },
        { status: 400 }
      );
    }

    // 3. Call OpenAI
    const { structured_data } = await generateResume(finalPrompt, images);
    
    // Inject profile photo if provided
    const foto_perfil = formData.get('foto_perfil') as string || null;
    if (foto_perfil) {
      structured_data.foto_perfil = foto_perfil;
    }

    // 4. Resolve Lead Details
    let resolvedName = name || structured_data.nome_completo || 'Cliente Desconhecido';
    let resolvedWhatsappRaw = whatsappRaw || structured_data.telefone || '00000000000';
    let resolvedWhatsapp = resolvedWhatsappRaw.replace(/\D/g, '');
    
    if (!resolvedWhatsapp) {
      resolvedWhatsapp = '00000000000';
    }

    // 5. Find or create lead
    let lead = await getLeadByWhatsapp(resolvedWhatsapp);
    if (!lead) {
      lead = await createLead({ name: resolvedName, whatsapp: resolvedWhatsapp, notes: 'Lead criado automaticamente via novo currículo' });
    }

    // 6. Create resume record
    const title = formData.get('title') as string || `Currículo de ${lead.name}`;
    const resume = await createResume({ lead_id: lead.id, title });

    // 7. Generate PDF
    const pdfFilename = generatePdfFilename(lead.name);
    const uniqueFilename = `${resume.id}_v1_${pdfFilename}`;
    const { url: pdfUrl } = await generatePDF(structured_data, uniqueFilename);

    // 8. Create version (sanitize strings to prevent PostgreSQL null byte error)
    const sanitizedPrompt = finalPrompt.replace(/\0/g, '');
    const sanitizedStructuredData = JSON.stringify(structured_data).replace(/\0/g, '');
    
    await createVersion({
      resume_id: resume.id,
      version_number: 1,
      structured_data: sanitizedStructuredData,
      generation_prompt: sanitizedPrompt,
      pdf_url: pdfUrl,
      pdf_filename: uniqueFilename,
    });

    // 9. Update resume version and status
    await updateResumeVersion(resume.id, 1);
    await updateResumeStatus(resume.id, 'pronto');

    // 10. Log activity
    await logActivity({
      lead_id: lead.id,
      resume_id: resume.id,
      activity_type: 'curriculo_criado',
      description: `Currículo "${title}" criado (Anexos: ${files.length})`,
    });

    return NextResponse.json({ success: true, resume_id: resume.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating resume:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar currículo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

