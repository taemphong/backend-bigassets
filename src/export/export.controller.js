import { getAssetsWithIds } from './export.service.js';

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const exportQRCodesToPDF = async (req, res) => {
  try {
    const ids = req.query.ids?.split(',').map(Number);
    if (!ids?.length) return res.status(400).json({ message: 'กรุณาระบุ ids' });

    const assets = await getAssetsWithIds(ids);
    if (!assets.length) return res.status(404).json({ message: 'ไม่พบข้อมูลทรัพย์สิน' });

    const cm = v => v * 28.35;
    const labelW = cm(4.5), labelH = cm(4.5), spacing = cm(0.2), margin = cm(0.5);
    const cols = 2, rowsPerPage = 2, perPage = cols * rowsPerPage;
    const pageW = margin * 2 + cols * labelW + (cols - 1) * spacing;
    const pageH = margin * 2 + rowsPerPage * labelH + (rowsPerPage - 1) * spacing;
    const qrSize = cm(3);

    const outDir = path.resolve('src/exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `qrcode_export_${Date.now()}.pdf`);

    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const thaiFontPath = path.resolve('src/fonts/Sarabun-Regular.ttf');
    doc.registerFont('THFont', thaiFontPath);

    for (let i = 0; i < assets.length; i += perPage) {
      const chunk = assets.slice(i, i + perPage);
      doc.addPage({ size: [pageW, pageH], margin });

      let x = margin, y = margin;
      chunk.forEach((a, index) => {
        if (a.qr_code_url?.startsWith('data:image/png;base64,')) {
          try {
            const buffer = Buffer.from(a.qr_code_url.split(',')[1].trim(), 'base64');
            doc.image(buffer, x + (labelW - qrSize) / 2, y + cm(0.3), { width: qrSize });
          } catch (err) {
            doc.font('THFont').fontSize(10).text('QR ERROR', x, y + cm(0.3), { width: labelW, align: 'center' });
          }
        } else {
          doc.font('THFont').fontSize(10).text('NO QR', x, y + cm(0.3), { width: labelW, align: 'center' });
        }

        const textY = y + qrSize + cm(0.5);
        doc.font('THFont').fontSize(10).text(`${a.asset_code}`, x, textY, { width: labelW, align: 'center' });
        doc.font('THFont').fontSize(9).text(a.asset_name || '', x, textY + cm(0.5), { width: labelW, align: 'center' });

        if ((index + 1) % cols === 0) { x = margin; y += labelH + spacing; } else x += labelW + spacing;
      });
    }

    doc.end();
    stream.on('finish', () => res.download(outPath, 'qrcodes.pdf', () => fs.unlinkSync(outPath)));
  } catch (err) {
    console.error('❗️ Export PDF Error:', err);
    res.status(500).json({ message: 'Export PDF ผิดพลาด', error: err.message });
  }
};