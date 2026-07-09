const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const INVOICE_DIR = path.join(__dirname, '..', '..', 'temp', 'invoices');

// Ensure the invoice PDF directory exists
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

/**
 * Generates a professional PDF Invoice and saves it to the temp directory.
 * @param {Object} invoice - The Mongoose invoice document (populated).
 * @param {string} template - The visual template style.
 * @returns {Promise<string>} - The absolute path of the generated PDF.
 */
const generateInvoicePDF = (invoice, template = 'Template 1') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const filename = `invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
      const filePath = path.join(INVOICE_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // --- CONFIG THEME STYLES ---
      let primaryColor = '#1e3a8a'; // Deep Blue
      let accentColor = '#3b82f6';
      let tableHeaderBg = '#f8fafc';
      let hasHeaderBand = false;

      if (template === 'Template 2') {
        primaryColor = '#dc2626'; // Crimson Red
        accentColor = '#ef4444';
        hasHeaderBand = true;
      } else if (template === 'Template 3') {
        primaryColor = '#059669'; // Emerald Green
        accentColor = '#10b981';
      } else if (template === 'Template 4') {
        primaryColor = '#7c3aed'; // Royal Purple
        accentColor = '#8b5cf6';
      } else if (template === 'Template 5') {
        primaryColor = '#d97706'; // Amber / Gold
        accentColor = '#f59e0b';
      } else if (template === 'Template 6') {
        primaryColor = '#374151'; // Charcoal Corporate
        accentColor = '#4b5563';
      }

      // --- HEADER SECTION ---
      if (hasHeaderBand) {
        // Dark slate grey top band spanning the top
        doc.rect(0, 0, 595, 145).fill('#0f172a');
        
        doc.fillColor('#ffffff')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text(invoice.companyDetails?.companyName || 'INVOICE MANAGEMENT SYSTEM', 50, 40);
           
        doc.fillColor('#94a3b8')
           .fontSize(9)
           .font('Helvetica')
           .text(`GSTIN: ${invoice.companyDetails?.gstNumber || 'N/A'} | Phone: ${invoice.companyDetails?.phone || 'N/A'} | Email: ${invoice.companyDetails?.email || 'N/A'}`, 50, 70);

        doc.fillColor('#ffffff')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('INVOICE', 400, 40, { align: 'right' });

        doc.fillColor('#94a3b8')
           .fontSize(9)
           .font('Helvetica')
           .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 65, { align: 'right' })
           .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 78, { align: 'right' })
           .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 91, { align: 'right' })
           .fillColor('#f87171')
           .text(`Status: ${invoice.status.toUpperCase()}`, 400, 104, { align: 'right' });
      } else {
        // Standard Classic Header
        doc.fillColor(primaryColor)
           .fontSize(22)
           .font('Helvetica-Bold')
           .text(invoice.companyDetails?.companyName || 'INVOICE MANAGEMENT SYSTEM', 50, 55);
        
        doc.fillColor('#4b5563')
           .fontSize(9)
           .font('Helvetica')
           .text(`GSTIN: ${invoice.companyDetails?.gstNumber || 'N/A'}`, 50, 85)
           .text(`Phone: ${invoice.companyDetails?.phone || 'N/A'}`, 50, 98)
           .text(`Email: ${invoice.companyDetails?.email || 'N/A'}`, 50, 111);

        doc.fillColor('#000000')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('INVOICE', 400, 55, { align: 'right' });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#374151')
           .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 85, { align: 'right' })
           .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 98, { align: 'right' })
           .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 111, { align: 'right' })
           .fillColor(invoice.status === 'paid' ? '#10b981' : '#ef4444')
           .text(`Status: ${invoice.status.toUpperCase()}`, 400, 124, { align: 'right' });

        // Draw a line under header
        doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#e5e7eb').lineWidth(1).stroke();
      }

      // --- ADDRESSES ---
      let billingY = hasHeaderBand ? 165 : 165;
      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Bill From:', 50, billingY, { underline: false });
      
      const adminAddr = invoice.companyDetails?.address;
      const adminAddressLines = [
        invoice.companyDetails?.name || 'Administrator',
        adminAddr?.street || '',
        `${adminAddr?.city || ''}, ${adminAddr?.state || ''} ${adminAddr?.zip || ''}`,
        adminAddr?.country || ''
      ].filter(line => line.trim() !== '').join('\n');

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text(adminAddressLines, 50, billingY + 16, { width: 240 });
      const adminEndY = doc.y;

      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Bill To:', 300, billingY, { underline: false });

      const clientAddr = invoice.clientDetails?.address;
      const clientAddressLines = [
        invoice.clientDetails?.companyName || invoice.clientDetails?.name || 'Client',
        invoice.clientDetails?.companyName ? `Contact: ${invoice.clientDetails?.name}` : '',
        `Email: ${invoice.clientDetails?.email}`,
        `GSTIN: ${invoice.clientDetails?.gstNumber || 'N/A'}`,
        `${clientAddr?.street || ''}, ${clientAddr?.city || ''}, ${clientAddr?.state || ''} ${clientAddr?.zip || ''}`,
        clientAddr?.country || ''
      ].filter(line => line.trim() !== '').join('\n');

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text(clientAddressLines, 300, billingY + 16, { width: 245 });
      const clientEndY = doc.y;

      // Draw another line dynamically under the tallest address column
      const endY = Math.max(adminEndY, clientEndY) + 15;
      doc.moveTo(50, endY).lineTo(545, endY).strokeColor('#e5e7eb').stroke();

      // --- TABLE HEADER ---
      let tableHeaderY = endY + 18;
      
      // Draw small accent color vertical band
      doc.rect(50, tableHeaderY - 1, 3, 13).fill(primaryColor);

      doc.fillColor('#1f2937')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Item Description', 58, tableHeaderY)
         .text('HSN/SAC', 200, tableHeaderY, { width: 45, align: 'right' })
         .text('Qty', 255, tableHeaderY, { width: 25, align: 'right' })
         .text('Price', 295, tableHeaderY, { width: 55, align: 'right' })
         .text('GST %', 365, tableHeaderY, { width: 35, align: 'right' })
         .text('Tax', 425, tableHeaderY, { width: 45, align: 'right' })
         .text('Total', 480, tableHeaderY, { width: 65, align: 'right' });

      doc.moveTo(50, tableHeaderY + 14).lineTo(545, tableHeaderY + 14).strokeColor('#9ca3af').lineWidth(1).stroke();

      // --- TABLE ITEMS ---
      let currentY = tableHeaderY + 22;
      invoice.items.forEach((item, index) => {
        // Prevent layout overflow, handle basic pagination logic
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
          
          // Re-draw table header on new page
          doc.rect(50, currentY - 1, 3, 13).fill(primaryColor);
          doc.fillColor('#1f2937')
             .fontSize(9)
             .font('Helvetica-Bold')
             .text('Item Description', 58, currentY)
             .text('HSN/SAC', 200, currentY, { width: 45, align: 'right' })
             .text('Qty', 255, currentY, { width: 25, align: 'right' })
             .text('Price', 295, currentY, { width: 55, align: 'right' })
             .text('GST %', 365, currentY, { width: 35, align: 'right' })
             .text('Tax', 425, currentY, { width: 45, align: 'right' })
             .text('Total', 480, currentY, { width: 65, align: 'right' });
          doc.moveTo(50, currentY + 14).lineTo(545, currentY + 14).strokeColor('#9ca3af').stroke();
          currentY += 20;
        }

        doc.fillColor('#4b5563')
           .fontSize(8.5)
           .font('Helvetica')
           .text(item.name, 50, currentY, { width: 140 })
           .text(item.hsnCode || '-', 200, currentY, { width: 45, align: 'right' })
           .text(item.quantity.toString(), 255, currentY, { width: 25, align: 'right' })
           .text(`Rs. ${item.price.toFixed(2)}`, 295, currentY, { width: 55, align: 'right' })
           .text(`${item.taxRate}%`, 365, currentY, { width: 35, align: 'right' })
           .text(`Rs. ${item.taxAmount.toFixed(2)}`, 425, currentY, { width: 45, align: 'right' })
           .text(`Rs. ${item.total.toFixed(2)}`, 480, currentY, { width: 65, align: 'right' });

         currentY += 18;
       });

       doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').stroke();
       currentY += 12;

       // --- TOTALS ---
       let totalsX = 350;
       doc.fontSize(9).fillColor('#4b5563');
       
       doc.text('Subtotal:', totalsX, currentY);
       doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' });
       currentY += 12;

       if (invoice.discountAmount > 0) {
         doc.text(`Discount (${invoice.discountRate}%):`, totalsX, currentY);
         doc.text(`-Rs. ${invoice.discountAmount.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' });
         currentY += 12;
       }

       const adminState = (invoice.companyDetails?.address?.state || '').trim().toUpperCase();
       const clientState = (invoice.clientDetails?.address?.state || '').trim().toUpperCase();

       const taxRate = invoice.items[0]?.taxRate || 18;

       if (adminState && clientState && adminState === clientState) {
         const halfTax = invoice.taxTotal / 2;
         const halfRate = taxRate / 2;
         
         doc.text(`CGST (${halfRate}%):`, totalsX, currentY);
         doc.text(`Rs. ${halfTax.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' });
         currentY += 12;

         doc.text(`SGST (${halfRate}%):`, totalsX, currentY);
         doc.text(`Rs. ${halfTax.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' });
         currentY += 15;
       } else {
         doc.text(`IGST (${taxRate}%):`, totalsX, currentY);
         doc.text(`Rs. ${invoice.taxTotal.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' });
         currentY += 15;
       }

       doc.moveTo(totalsX, currentY - 4).lineTo(545, currentY - 4).strokeColor('#e5e7eb').stroke();

       doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold');
       doc.text('Grand Total:', totalsX, currentY);
       doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, 440, currentY, { width: 105, align: 'right' }).font('Helvetica');
       currentY += 22;

      // --- NOTES / TERMS ---
      if (invoice.notes || invoice.terms) {
        if (currentY > 640) {
          doc.addPage();
          currentY = 50;
        }

        if (invoice.notes) {
          doc.fontSize(9.5).fillColor('#1f2937').font('Helvetica-Bold').text('Notes:', 50, currentY);
          doc.fontSize(8.5).fillColor('#4b5563').font('Helvetica').text(invoice.notes, 50, currentY + 12, { width: 300 });
          currentY += 35;
        }

        if (invoice.terms) {
          doc.fontSize(9.5).fillColor('#1f2937').font('Helvetica-Bold').text('Terms & Conditions:', 50, currentY);
          doc.fontSize(8.5).fillColor('#4b5563').font('Helvetica').text(invoice.terms, 50, currentY + 12, { width: 300 });
          currentY += 35;
        }
      }

      // --- AUTHORISED SIGNATORY BLOCK ---
      if (currentY > 640) {
        doc.addPage();
        currentY = 50;
      }
      
      let sigY = Math.max(currentY + 20, 650);
      doc.fontSize(9)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(`for ${invoice.companyDetails?.companyName || 'INVOICE MANAGEMENT SYSTEM'}`, 350, sigY, { width: 195, align: 'right' });
         
      doc.moveTo(370, sigY + 45).lineTo(545, sigY + 45).strokeColor('#9ca3af').lineWidth(1).stroke();
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Authorised Signatory', 350, sigY + 50, { width: 195, align: 'right' });

      // --- FOOTER ---
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9ca3af')
           .text(`Page ${i + 1} of ${pages.count}`, 50, 755, { align: 'center' })
           .text('This is a Computer Generated Invoice', 50, 765, { align: 'center' })
           .text('Thank you for your business!', 50, 775, { align: 'center' });
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
};
