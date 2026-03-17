const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"E-Commerce Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw - email failure shouldn't break the flow
    return null;
  }
};

const sendOrderConfirmation = async (user, order) => {
  const itemsList = (order.items || []).map(item =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">$${item.price.toFixed(2)}</td>
    </tr>`
  ).join('');

  await sendEmail({
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#7c3aed;">Order Confirmed! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;">Product</th>
              <th style="padding:8px;text-align:left;">Qty</th>
              <th style="padding:8px;text-align:left;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
        </table>
        <p><strong>Total: $${order.totalPrice.toFixed(2)}</strong></p>
        <p>We'll notify you when your order ships.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#888;font-size:12px;">Thank you for shopping with us!</p>
      </div>
    `
  });
};

const sendDeliveryUpdate = async (user, order, status) => {
  const statusMessages = {
    processing: 'Your order is being processed',
    shipped: 'Your order has been shipped',
    out_for_delivery: 'Your order is out for delivery',
    delivered: 'Your order has been delivered'
  };

  await sendEmail({
    to: user.email,
    subject: `Order Update - ${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#7c3aed;">Order Update</h2>
        <p>Hi ${user.name},</p>
        <p>${statusMessages[status] || `Order status updated to: ${status}`}</p>
        <p>Order: <strong>${order.orderNumber}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#888;font-size:12px;">Thank you for shopping with us!</p>
      </div>
    `
  });
};

const sendPaymentConfirmation = async (user, payment) => {
  await sendEmail({
    to: user.email,
    subject: 'Payment Confirmed',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#7c3aed;">Payment Confirmed ✅</h2>
        <p>Hi ${user.name},</p>
        <p>Your payment of <strong>$${payment.amount.toFixed(2)}</strong> has been confirmed.</p>
        <p>Transaction ID: ${payment.transactionId || 'N/A'}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#888;font-size:12px;">Thank you for shopping with us!</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendDeliveryUpdate,
  sendPaymentConfirmation
};
