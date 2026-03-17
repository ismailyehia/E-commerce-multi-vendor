const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (order, user) => {
    return new Promise((resolve, reject) => {
        try {
            const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
            if (!fs.existsSync(invoiceDir)) {
                fs.mkdirSync(invoiceDir, { recursive: true });
            }

            const fileName = `invoice-${order.orderNumber}.pdf`;
            const filePath = path.join(invoiceDir, fileName);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header
            doc.fontSize(24).fillColor('#7c3aed').text('INVOICE', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666').text(`Invoice #: ${order.orderNumber}`, { align: 'center' });
            doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'center' });
            doc.moveDown(1.5);

            // Divider
            doc.strokeColor('#e5e7eb').lineWidth(1)
                .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Customer info
            doc.fontSize(12).fillColor('#333').text('Bill To:', { underline: true });
            doc.fontSize(10).fillColor('#555');
            doc.text(user.name);
            doc.text(user.email);
            if (order.shippingAddress) {
                doc.text(order.shippingAddress.street);
                doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`);
                doc.text(order.shippingAddress.country);
            }
            doc.moveDown(1.5);

            // Table header
            const tableTop = doc.y;
            doc.fontSize(10).fillColor('#7c3aed');
            doc.text('Product', 50, tableTop, { width: 220 });
            doc.text('Qty', 280, tableTop, { width: 60, align: 'center' });
            doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
            doc.text('Total', 450, tableTop, { width: 80, align: 'right' });
            doc.moveDown(0.5);

            doc.strokeColor('#e5e7eb').lineWidth(1)
                .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Table rows
            doc.fillColor('#333');
            (order.items || []).forEach(item => {
                const y = doc.y;
                doc.fontSize(9);
                doc.text(item.name || 'Product', 50, y, { width: 220 });
                doc.text(String(item.quantity), 280, y, { width: 60, align: 'center' });
                doc.text(`$${item.price.toFixed(2)}`, 350, y, { width: 80, align: 'right' });
                doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
                doc.moveDown(0.8);
            });

            // Divider
            doc.strokeColor('#e5e7eb').lineWidth(1)
                .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Totals
            const totalsX = 350;
            doc.fontSize(10).fillColor('#555');
            doc.text('Subtotal:', totalsX, doc.y, { width: 80, align: 'right', continued: true });
            doc.text(`  $${order.itemsPrice.toFixed(2)}`, { align: 'right' });

            doc.text('Shipping:', totalsX, doc.y, { width: 80, align: 'right', continued: true });
            doc.text(`  $${order.shippingPrice.toFixed(2)}`, { align: 'right' });

            doc.text('Tax:', totalsX, doc.y, { width: 80, align: 'right', continued: true });
            doc.text(`  $${order.taxPrice.toFixed(2)}`, { align: 'right' });

            if (order.discountAmount > 0) {
                doc.text('Discount:', totalsX, doc.y, { width: 80, align: 'right', continued: true });
                doc.fillColor('#22c55e').text(`  -$${order.discountAmount.toFixed(2)}`, { align: 'right' });
            }

            doc.moveDown(0.5);
            doc.fontSize(14).fillColor('#7c3aed').font('Helvetica-Bold');
            doc.text('Total:', totalsX, doc.y, { width: 80, align: 'right', continued: true });
            doc.text(`  $${order.totalPrice.toFixed(2)}`, { align: 'right' });

            // Footer
            doc.moveDown(3);
            doc.fontSize(9).fillColor('#999').font('Helvetica');
            doc.text('Thank you for your purchase!', { align: 'center' });
            doc.text('This is a computer-generated invoice.', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(`/uploads/invoices/${fileName}`);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoice };
