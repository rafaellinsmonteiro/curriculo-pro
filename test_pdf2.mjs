import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ autoFirstPage: true, bufferPages: true, margins: { top: 40, bottom: 40, left: 40, right: 40 } });
doc.pipe(fs.createWriteStream('test.pdf'));

// Add text that spans multiple pages
const longText = 'A '.repeat(5000);
doc.text(longText); // This should automatically add pages!

// Now go back to page 0 to draw something else!
doc.switchToPage(0);
doc.fillColor('red').text('DRAWN ON PAGE 1 LATER', 100, 100);

doc.flushPages();
doc.end();
