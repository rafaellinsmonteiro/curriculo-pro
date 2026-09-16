import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ autoFirstPage: true });
doc.pipe(fs.createWriteStream('test.pdf'));

doc.text('Page 1');
doc.addPage();
doc.text('Page 2');

if (typeof doc.switchToPage === 'function') {
  doc.switchToPage(0);
  doc.text('Back on Page 1');
  console.log('switchToPage is supported');
} else {
  console.log('switchToPage is NOT supported');
}
doc.end();
