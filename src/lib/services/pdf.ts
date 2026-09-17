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
  let resolvedPath = path.join(process.cwd(), 'public', 'pdfs');
  try {
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
    // Test write permission
    fs.accessSync(resolvedPath, fs.constants.W_OK);
  } catch {
    resolvedPath = path.join('/tmp', 'pdfs');
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
  }

  const filePath = path.join(resolvedPath, filename);
  const url = `/api/resumes/download?filename=${encodeURIComponent(filename)}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      autoFirstPage: false,
      bufferPages: true,
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
      
      const isVeryDense = charsCount > 1100 || (data.experiencia_profissional?.length || 0) >= 4;
      const isDense = charsCount > 650 || (data.experiencia_profissional?.length || 0) >= 3;
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
      
      // We must switch to the first page to draw the left column
      // because the right column might have automatically added pages.
      doc.switchToPage(0);
      
      // Disable automatic page breaking for the sidebar so it truncates instead of spilling to page 2
      doc.page.margins.bottom = -10000;

      const LEFT_LIMIT = PAGE_HEIGHT - PAGE_MARGIN - 20;

      if (data.resumo_profissional && leftY < LEFT_LIMIT) {
        leftY = drawSidebarSection(doc, 'PERFIL PROFISSIONAL', leftY);
        leftY = drawSidebarText(doc, data.resumo_profissional, leftY);
      }

      if (data.dados_pessoais && data.dados_pessoais.length > 0 && leftY < LEFT_LIMIT) {
        const validDadosPessoais = data.dados_pessoais.filter(dado => !isInvalidPart(dado));
        if (validDadosPessoais.length > 0) {
          leftY = drawSidebarSection(doc, 'DADOS PESSOAIS', leftY);
          for (const dado of validDadosPessoais) {
            if (leftY > LEFT_LIMIT) break;
            leftY = drawListItem(doc, dado, leftY, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 10, true);
          }
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



      doc.flushPages();
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
        
        // Open image to get its original dimensions
        const img = (doc as any).openImage(imageBuffer);
        
        // Calculate "cover" scale (maximize scale to fill the 75x75 box)
        const scale = Math.max(imgSize / img.width, imgSize / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        
        // Center the scaled image in the box
        const drawX = imgX + (imgSize - drawW) / 2;
        const drawY = imgY + (imgSize - drawH) / 2;

        // Draw with clipping to avoid spilling outside the 75x75 box
        doc.save();
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 4).clip();
        doc.image(img, drawX, drawY, { width: drawW, height: drawH });
        doc.restore();

        textStartX = imgX + imgSize + 15;
        textWidth = HEADER_WIDTH - (imgSize + 40);
        alignText = 'left';
        hasPhoto = true;
      }
    } catch (err) {
      console.error('Failed to draw profile photo:', err);
    }
  }

  // Left Content (Name)
  const nameFontSize = hasPhoto ? 16 : 18;
  
  doc.font('Helvetica-Bold').fontSize(nameFontSize);
  const nameHeight = doc.heightOfString(data.nome_completo.toUpperCase(), { width: textWidth });
  
  // Contacts (using SVG paths for icons - viewBox 0 0 24 24)
  const contacts: { type: 'address' | 'phone' | 'email' | 'linkedin', text: string }[] = [];
  
  if (data.endereco) contacts.push({ type: 'address', text: data.endereco });
  if (data.telefone) contacts.push({ type: 'phone', text: data.telefone });
  if (data.email) contacts.push({ type: 'email', text: data.email });
  if (data.linkedin) contacts.push({ type: 'linkedin', text: data.linkedin });

  doc.font('Helvetica').fontSize(9);
  const ICONS = {
    address: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    // WhatsApp path
    phone: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'
  };

  let contactsHeight = 0;
  for (const c of contacts) {
    contactsHeight += doc.heightOfString(c.text, { width: textWidth }) + 2;
  }

  const totalHeight = nameHeight + 6 + contactsHeight;
  let currentY = y + (HEADER_HEIGHT - totalHeight) / 2;

  // Draw Name
  doc
    .font('Helvetica-Bold')
    .fontSize(nameFontSize)
    .fillColor(COLORS.mainTitle)
    .text(data.nome_completo.toUpperCase(), textStartX, currentY, { width: textWidth, align: alignText });
  
  currentY += nameHeight + 6;

  // Draw Contacts with Icons
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.mainTextLight);
  const iconSize = 9;

  for (const c of contacts) {
    const textW = doc.widthOfString(c.text);
    const totalW = iconSize + 6 + textW;
    const startX = alignText === 'center' ? textStartX + (textWidth - totalW) / 2 : textStartX;
    
    // Draw icon
    doc.save();
    doc.translate(startX, currentY);
    doc.scale(iconSize / 24);
    doc.path(ICONS[c.type]).fill(COLORS.mainTextLight);
    doc.restore();

    // Draw text
    doc.text(c.text, startX + iconSize + 6, currentY);
    currentY += doc.heightOfString(c.text) + 2;
  }

  return y + HEADER_HEIGHT + 20;
}

// --- Main Column ---

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, requiredSpace: number): number {
  const PAGE_HEIGHT = 841.89; // A4 height in pt
  const BOTTOM_MARGIN = doc.page.margins.bottom;
  
  if (BOTTOM_MARGIN < 0) {
    return y; // Sidebar disabled page breaking
  }
  
  if (y + requiredSpace > PAGE_HEIGHT - BOTTOM_MARGIN) {
    doc.addPage();
    return doc.y; // Return the new Y position (which will be at the top margin)
  }
  
  return y;
}

function drawMainSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y += mode === 'very_dense' ? 6 : (mode === 'dense' ? 10 : 16); // Dynamic spacing before section
  y = checkPageBreak(doc, y, 65); // Check for title height + some text height to prevent orphan titles
  
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

  return y + 10;
}

function drawMainText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y = checkPageBreak(doc, y, 20);
  
  doc
    .font('Helvetica')
    .fontSize(mode === 'very_dense' ? 8.5 : (mode === 'dense' ? 9 : 9.5))
    .fillColor(COLORS.mainText)
    .text(text, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH, align: 'justify', lineGap: mode === 'very_dense' ? 1.5 : (mode === 'dense' ? 2 : 3) });

  return doc.y + (mode === 'very_dense' ? 6 : (mode === 'dense' ? 10 : 15));
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
    .text(exp.cargo || '', RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH });
  
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
      .text(exp.descricao, RIGHT_COL_X, y, { width: RIGHT_COL_WIDTH, align: 'justify', lineGap: mode === 'very_dense' ? 1 : (mode === 'dense' ? 1.5 : 2) });
  }

  return doc.y + ((doc as any).layoutMode === 'very_dense' ? 5 : ((doc as any).layoutMode === 'dense' ? 8 : 12));
}

// --- Left Column ---

function drawSidebarSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  const mode = (doc as any).layoutMode;
  y += mode === 'very_dense' ? 6 : (mode === 'dense' ? 10 : 15); // Dynamic spacing before sidebar section
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
    .text(text, LEFT_COL_X + 10, y, { width: LEFT_COL_WIDTH - 20, align: 'left', lineGap: mode === 'very_dense' ? 1.5 : (mode === 'dense' ? 2 : 3) });

  return doc.y + (mode === 'very_dense' ? 6 : (mode === 'dense' ? 10 : 15));
}

function isInvalidPart(str?: string) {
  if (!str) return true;
  const lower = str.toLowerCase();
  return lower.includes('não informad') || lower.includes('incompleto');
}

function drawEducation(
  doc: PDFKit.PDFDocument,
  edu: NonNullable<StructuredResumeData['escolaridade']>[0],
  y: number
): number {
  const parts = [edu.curso, edu.instituicao, edu.periodo].filter(p => !isInvalidPart(p));
  if (parts.length === 0) return y;
  return drawListItem(doc, parts.join(' - '), y, COLORS.sidebarText, LEFT_COL_X + 10, LEFT_COL_WIDTH - 20, true);
}

function drawCourse(
  doc: PDFKit.PDFDocument,
  curso: NonNullable<StructuredResumeData['cursos_complementares']>[0],
  y: number
): number {
  const parts = [curso.nome, curso.instituicao, curso.periodo].filter(p => !isInvalidPart(p));
  if (parts.length === 0) return y;
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
    .text(text, textX, y, { width: textWidth, lineGap: mode === 'very_dense' ? 1 : 1.5 });

  return doc.y + (mode === 'very_dense' ? 3 : (mode === 'dense' ? 4 : 6));
}
