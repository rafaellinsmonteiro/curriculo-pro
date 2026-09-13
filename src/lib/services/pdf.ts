// ==========================================
// CurrículoPRO — PDF Generation Service (Template: Modelo Padrão)
// ==========================================

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { StructuredResumeData } from '@/lib/types';

const COLORS = {
  sidebarBg: '#163a46', 
  sidebarText: '#ffffff',
  sidebarTitle: '#ffffff',
  sidebarLine: '#2a7d86',
  
  mainBg: '#ffffff',
  mainText: '#657176',
  mainTextLight: '#657176',
  mainTitle: '#163a46',
  mainLine: '#ced8da',
  
  headerBg: '#f0f4f8',
  accent: '#2a7d86'
};

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4
const PAGE_MARGIN = 28;

const HEADER_Y = 28;
const HEADER_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN;
const HEADER_HEIGHT = 105;

const SIDEBAR_WIDTH = 160;
const LEFT_COL_X = PAGE_MARGIN;
const LEFT_COL_WIDTH = SIDEBAR_WIDTH - 20;

const RIGHT_COL_X = PAGE_MARGIN + SIDEBAR_WIDTH + 18;
const RIGHT_COL_WIDTH = PAGE_WIDTH - RIGHT_COL_X - PAGE_MARGIN;

const CONTENT_START_Y = 155;

/**
 * Generate a professional PDF resume from structured data
 */
export async function generatePDF(
  data: StructuredResumeData,
  filename: string
): Promise<{ filePath: string; url: string }> {
  const resolvedPath = path.join(process.cwd(), 'public', 'pdfs');

  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  const filePath = path.join(resolvedPath, filename);
  const url = `/pdfs/${filename}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      autoFirstPage: false,
      info: {
        Title: `Currículo - ${data.nome_completo}`,
        Author: 'CurrículoPRO',
        Subject: 'Currículo Profissional',
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    try {
      // Calculate how "dense" this resume is
      let charsCount = 0;
      charsCount += data.resumo_profissional?.length || 0;
      charsCount += data.objetivo_profissional?.length || 0;
      charsCount += data.resumo_qualificacoes?.length || 0;
      charsCount += (data.experiencia_profissional || []).reduce((acc, exp) => acc + (exp.descricao?.length || 0) + (exp.cargo?.length || 0) + (exp.empresa?.length || 0), 0);
      charsCount += (data.competencias || []).join('').length;
      
      const isVeryDense = charsCount > 1400 || (data.experiencia_profissional?.length || 0) >= 4;
      const isDense = charsCount > 900 || (data.experiencia_profissional?.length || 0) > 2;
      (doc as any).layoutMode = isVeryDense ? 'very_dense' : (isDense ? 'dense' : 'loose');

      let pageNumber = 0;
      doc.on('pageAdded', () => {
        pageNumber++;
        const yStart = pageNumber === 1 ? CONTENT_START_Y - 10 : PAGE_MARGIN;
        const height = PAGE_HEIGHT - yStart - PAGE_MARGIN;
        doc.roundedRect(LEFT_COL_X, yStart, SIDEBAR_WIDTH, height, 8).fill(COLORS.sidebarBg);
      });

      // Add first page
      doc.addPage();

      // Disable automatic page breaking by pushing the bottom margin off-page
      doc.page.margins.bottom = -10000;

      // Draw header on the first page
      drawHeader(doc, data, HEADER_Y);

      let leftY = CONTENT_START_Y;
      let rightY = CONTENT_START_Y;

      // ==========================================
      // RIGHT COLUMN (Main Content)
      // ==========================================
      
      const RIGHT_LIMIT = PAGE_HEIGHT - PAGE_MARGIN - 30;

      if (data.objetivo_profissional && rightY < RIGHT_LIMIT) {
        rightY = drawMainSection(doc, 'OBJETIVO PROFISSIONAL', rightY);
        rightY = drawMainText(doc, data.objetivo_profissional, rightY);
      }

      if (data.experiencia_profissional && data.experiencia_profissional.length > 0 && rightY < RIGHT_LIMIT) {
        rightY = drawMainSection(doc, 'EXPERIÊNCIA PROFISSIONAL', rightY);
        for (const exp of data.experiencia_profissional) {
          if (rightY > RIGHT_LIMIT) break;
          rightY = drawExperience(doc, exp, rightY);
        }
      }

      const extras: string[] = [];
      if (data.cnh) extras.push(`CNH: ${data.cnh}`);
      if (data.informacoes_adicionais) extras.push(...data.informacoes_adicionais);

      if (extras.length > 0 && rightY < RIGHT_LIMIT) {
        rightY = drawMainSection(doc, 'DIFERENCIAIS PROFISSIONAIS', rightY);
        for (const extra of extras) {
          if (rightY > RIGHT_LIMIT) break;
          rightY = drawListItem(doc, extra, rightY, COLORS.mainText, RIGHT_COL_X, RIGHT_COL_WIDTH);
        }
      }

      if (data.competencias && data.competencias.length > 0 && rightY < RIGHT_LIMIT) {
        rightY = drawMainSection(doc, 'COMPETÊNCIAS', rightY);
        for (const comp of data.competencias) {
          if (rightY > RIGHT_LIMIT) break;
          // Using drawListItem for bullets, same as other lists
          rightY = drawListItem(doc, comp, rightY, COLORS.mainText, RIGHT_COL_X, RIGHT_COL_WIDTH);
        }
      }

      if (data.resumo_qualificacoes && rightY < RIGHT_LIMIT) {
        rightY = drawMainSection(doc, 'RESUMO DE QUALIFICAÇÕES', rightY);
        rightY = drawMainText(doc, data.resumo_qualificacoes, rightY);
      }

      // ==========================================
      // LEFT COLUMN (Sidebar)
      // ==========================================
      
      // Save current right column Y state
      const savedY = doc.y;

      const LEFT_LIMIT = PAGE_HEIGHT - PAGE_MARGIN - 20;

      if (data.resumo_profissional && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'PERFIL PROFISSIONAL', leftY);
        leftY = drawSidebarText(doc, data.resumo_profissional, leftY);
      }

      if (data.dados_pessoais && data.dados_pessoais.length > 0 && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'DADOS PESSOAIS', leftY);
        for (const dado of data.dados_pessoais) {
          if (leftY > LEFT_LIMIT) break;
          leftY = drawListItem(doc, dado, leftY, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 10, true);
        }
      }

      if (data.escolaridade && data.escolaridade.length > 0 && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'FORMAÇÃO', leftY);
        for (const edu of data.escolaridade) {
          if (leftY > LEFT_LIMIT) break;
          leftY = drawEducation(doc, edu, leftY);
        }
      }

      if (data.cursos_complementares && data.cursos_complementares.length > 0 && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'CURSOS', leftY);
        for (const curso of data.cursos_complementares) {
          if (leftY > LEFT_LIMIT) break;
          leftY = drawCourse(doc, curso, leftY);
        }
      }

      if (data.habilidades && data.habilidades.length > 0 && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'HABILIDADES', leftY);
        for (const hab of data.habilidades) {
          if (leftY > LEFT_LIMIT) break;
          leftY = drawListItem(doc, hab, leftY, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 10, true);
        }
      }

      if (data.idiomas && data.idiomas.length > 0 && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'IDIOMAS', leftY);
        for (const idm of data.idiomas) {
          if (leftY > LEFT_LIMIT) break;
          const text = `${idm.idioma}${idm.nivel ? ` - ${idm.nivel}` : ''}`;
          leftY = drawListItem(doc, text, leftY, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 10, true);
        }
      }

      // Restore Y if needed
      doc.y = savedY;
      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, url });
      });

      stream.on('error', reject);
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

// ---------- Drawing helpers ----------

function drawHeader(doc: PDFKit.PDFDocument, data: StructuredResumeData, y: number): number {
  // Header background rectangle
  doc.roundedRect(PAGE_MARGIN, y, HEADER_WIDTH, HEADER_HEIGHT, 8).fill(COLORS.headerBg);
  doc.roundedRect(PAGE_MARGIN, y, HEADER_WIDTH, HEADER_HEIGHT, 8).lineWidth(1).strokeColor(COLORS.mainLine).stroke();
  
  let hasPhoto = false;
  let textStartX = PAGE_MARGIN + 20;
  let textWidth = HEADER_WIDTH - 40;
  let alignText: 'left' | 'center' = 'center';

  // Profile Photo (Square)
  if (data.foto_perfil) {
    try {
      const base64Data = data.foto_perfil.split(';base64,').pop();
      if (base64Data) {
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imgSize = 75;
        const imgX = PAGE_MARGIN + 12;
        const imgY = y + (HEADER_HEIGHT - imgSize) / 2;
        
        doc.image(imageBuffer, imgX, imgY, { width: imgSize, height: imgSize });

        textStartX = imgX + imgSize + 15;
        textWidth = HEADER_WIDTH - (imgSize + 40);
        alignText = 'left';
        hasPhoto = true;
      }
    } catch (err) {
      console.error('Failed to draw profile photo:', err);
    }
  }

  // Left Content (Name & Role)
  const nameFontSize = hasPhoto ? 16 : 18;
  const roleFontSize = hasPhoto ? 10 : 11;
  const roleText = data.cargo_principal || (data.objetivo_profissional ? data.objetivo_profissional.split('.')[0].substring(0, 70) : 'PROFISSIONAL');
  
  doc.font('Helvetica-Bold').fontSize(nameFontSize);
  const nameHeight = doc.heightOfString(data.nome_completo.toUpperCase(), { width: textWidth });
  
  doc.font('Helvetica-Bold').fontSize(roleFontSize);
  const roleHeight = doc.heightOfString(roleText.toUpperCase(), { width: textWidth });
  
  // Contacts
  const contactLines = [];
  const endTel = [];
  if (data.endereco) endTel.push(data.endereco);
  if (data.telefone) endTel.push(`${data.telefone} - WhatsApp`);
  if (endTel.length > 0) contactLines.push(endTel.join(' | '));
  
  if (data.email) contactLines.push(data.email);
  if (data.linkedin) contactLines.push(data.linkedin);

  doc.font('Helvetica').fontSize(9);
  let contactsHeight = 0;
  for (const line of contactLines) {
    contactsHeight += doc.heightOfString(line, { width: textWidth });
  }

  const totalHeight = nameHeight + 2 + roleHeight + 4 + contactsHeight;
  let currentY = y + (HEADER_HEIGHT - totalHeight) / 2;

  // Draw Name
  doc
    .font('Helvetica-Bold')
    .fontSize(nameFontSize)
    .fillColor(COLORS.mainTitle)
    .text(data.nome_completo.toUpperCase(), textStartX, currentY, { width: textWidth, align: alignText });
  
  currentY += nameHeight + 2;
  
  // Draw Role
  doc
    .font('Helvetica-Bold')
    .fontSize(roleFontSize)
    .fillColor(COLORS.accent)
    .text(roleText.toUpperCase(), textStartX, currentY, { width: textWidth, align: alignText });

  currentY += roleHeight + 4;

  // Draw Contacts
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.mainTextLight);
  for (const line of contactLines) {
    doc.text(line, textStartX, currentY, { width: textWidth, align: alignText });
    currentY += doc.heightOfString(line, { width: textWidth });
  }

  return y + HEADER_HEIGHT + 20;
}

// --- Main Column ---

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, requiredSpace: number): number {
  return y;
}

function drawMainSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y += mode === 'very_dense' ? 6 : (mode === 'dense' ? 12 : 25); // Dynamic spacing before section
  y = checkPageBreak(doc, y, 30);
  
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.mainTitle)
    .text(title, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH });

  y = doc.y + 4;

  // Divider line
  doc
    .moveTo(RIGHT_COL_X, y)
    .lineTo(RIGHT_COL_X + RIGHT_COL_WIDTH, y)
    .strokeColor(COLORS.mainLine)
    .lineWidth(1)
    .stroke();

  return y + 15;
}

function drawMainText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y = checkPageBreak(doc, y, 20);
  
  doc
    .font('Helvetica')
    .fontSize(mode === 'very_dense' ? 8.5 : (mode === 'dense' ? 9 : 9.5))
    .fillColor(COLORS.mainText)
    .text(text, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH, align: 'justify', lineGap: mode === 'very_dense' ? 2 : (mode === 'dense' ? 3 : 5) });

  return doc.y + (mode === 'very_dense' ? 8 : (mode === 'dense' ? 12 : 20));
}

function drawExperience(
  doc: PDFKit.PDFDocument,
  exp: NonNullable<StructuredResumeData['experiencia_profissional']>[0],
  y: number
): number {
  y = checkPageBreak(doc, y, 40);
  
  if (exp.empresa) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.mainTitle)
      .text(exp.empresa, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH });
    
    y = doc.y + 2;
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(COLORS.accent)
    .text(exp.cargo, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH });
  
  y = doc.y + 1;
  
  if (exp.periodo) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.mainText)
      .text(exp.periodo, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH, align: 'left' });
    y = doc.y + 2;
  }

  if (exp.descricao) {
    const mode = (doc as any).layoutMode;
    doc
      .font('Helvetica')
      .fontSize(mode === 'very_dense' ? 8 : 8.5)
      .fillColor(COLORS.mainText)
      .text(exp.descricao, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH, align: 'justify', lineGap: mode === 'very_dense' ? 1.5 : (mode === 'dense' ? 2 : 3) });
  }

  return doc.y + ((doc as any).layoutMode === 'very_dense' ? 6 : ((doc as any).layoutMode === 'dense' ? 10 : 15));
}

// --- Left Column ---

function drawSidebarSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y += mode === 'very_dense' ? 6 : (mode === 'dense' ? 10 : 18); // Dynamic spacing before sidebar section
  // We assume sidebar fits on first page for simplicity, as it rarely overflows.
  doc
    .font('Helvetica-Bold')
    .fontSize(11.5)
    .fillColor(COLORS.sidebarTitle)
    .text(title.toUpperCase(), LEFT_COL_X + 10, y, { width: LEFT_COL_WIDTH - 20 });

  y = doc.y + 6;

  doc
    .moveTo(LEFT_COL_X + 10, y)
    .lineTo(LEFT_COL_X + LEFT_COL_WIDTH - 10, y)
    .strokeColor(COLORS.sidebarLine)
    .lineWidth(1)
    .stroke();

  return y + 15;
}

function drawSidebarText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  const mode = (doc as any).layoutMode;
  doc
    .font('Helvetica')
    .fontSize(mode === 'very_dense' ? 8.5 : (mode === 'dense' ? 9 : 9.5))
    .fillColor(COLORS.sidebarText)
    .text(text, LEFT_COL_X + 10, y, { width: LEFT_COL_WIDTH - 20, align: 'left', lineGap: mode === 'very_dense' ? 2 : (mode === 'dense' ? 3 : 5) });

  return doc.y + (mode === 'very_dense' ? 8 : (mode === 'dense' ? 12 : 18));
}

function drawEducation(
  doc: PDFKit.PDFDocument,
  edu: NonNullable<StructuredResumeData['escolaridade']>[0],
  y: number
): number {
  const parts = [edu.curso, edu.instituicao, edu.periodo].filter(Boolean);
  return drawListItem(doc, parts.join(' - '), y, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 20, true);
}

function drawCourse(
  doc: PDFKit.PDFDocument,
  curso: NonNullable<StructuredResumeData['cursos_complementares']>[0],
  y: number
): number {
  const parts = [curso.nome, curso.instituicao, curso.periodo].filter(Boolean);
  return drawListItem(doc, parts.join(' - '), y, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 20, true);
}

function drawListItem(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  color: string,
  x: number,
  width: number,
  isSidebar: boolean = false
): number {
  const mode = (doc as any).layoutMode;
  y = checkPageBreak(doc, y, 15);
  
  doc
    .circle(x + 4, y + 4, 1.5)
    .fill(color);

  const textX = x + 12;
  const textWidth = width - 12;
  doc
    .font('Helvetica')
    .fontSize(mode === 'very_dense' ? 8.5 : (mode === 'dense' ? 8.5 : (isSidebar ? 9.5 : 9)))
    .fillColor(color)
    .text(text, textX, y, { width: textWidth, lineGap: mode === 'very_dense' ? 1 : (mode === 'dense' ? 1 : 2) });

  return doc.y + (mode === 'very_dense' ? 3 : (mode === 'dense' ? 5 : 10));
}
