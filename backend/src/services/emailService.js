const fs = require('fs');
const path = require('path');

const EMAIL_DIR = path.join(__dirname, '..', '..', 'temp', 'emails');

// Ensure the email output directory exists
if (!fs.existsSync(EMAIL_DIR)) {
  fs.mkdirSync(EMAIL_DIR, { recursive: true });
}

const writeEmailToFile = (to, subject, htmlContent, filenamePrefix) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `${filenamePrefix}_${to.replace(/[@.]/g, '_')}_${timestamp}.html`;
  const filePath = path.join(EMAIL_DIR, filename);
  
  const fileData = `
    <!-- 
      Recipient: ${to}
      Subject: ${subject}
      Sent At: ${new Date().toLocaleString()}
    -->
    <hr />
    <div style="background-color: #f3f4f6; padding: 10px; font-family: monospace; border: 1px dashed #d1d5db; margin-bottom: 20px;">
      <strong>To:</strong> ${to}<br/>
      <strong>Subject:</strong> ${subject}<br/>
      <strong>Date:</strong> ${new Date().toLocaleString()}<br/>
    </div>
    ${htmlContent}
  `;
  
  fs.writeFileSync(filePath, fileData, 'utf8');
  console.log('\n==================================================');
  console.log(`[MOCK EMAIL SERVICE] Email Sent!`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Saved HTML preview to: file:///${filePath.replace(/\\/g, '/')}`);
  console.log('==================================================\n');
  
  return filePath;
};

const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to SaaS Invoice Manager!';
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb;">Welcome, ${user.name}!</h2>
      <p>Thank you for registering on our platform. Your account as a <strong>${user.role}</strong> has been successfully created.</p>
      <p>Here are your profile details:</p>
      <ul>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Role:</strong> ${user.role}</li>
      </ul>
      <p>Log in to access your dashboard, manage products, view reports, or check your invoices.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:5173" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to contact us.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #6b7280; text-align: center;">SaaS Invoice Management System &copy; 2026</p>
    </div>
  `;
  
  return writeEmailToFile(user.email, subject, html, 'welcome');
};

const sendInvoiceEmail = async (client, invoice, pdfFilePath = null) => {
  const subject = `New Invoice ${invoice.invoiceNumber} from Admin`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb;">New Invoice Issued</h2>
      <p>Dear ${client.name},</p>
      <p>We have issued a new invoice <strong>${invoice.invoiceNumber}</strong>. Please find the details below:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Invoice Number</th>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Due Date</th>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Total Amount</th>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #10b981;">Rs. ${invoice.totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Status</th>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-transform: uppercase;">${invoice.status}</td>
        </tr>
      </table>
      ${pdfFilePath ? `<p style="color: #4b5563; font-style: italic;">Note: Your PDF invoice has been generated and is attached (saved locally at ${pdfFilePath}).</p>` : ''}
      <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:5174" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Pay Invoice</a>
      </div>
      <p>If you have any queries regarding this invoice, please reach out to the administrator.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #6b7280; text-align: center;">SaaS Invoice Management System &copy; 2026</p>
    </div>
  `;

  return writeEmailToFile(client.email, subject, html, 'invoice');
};

const sendForgotPasswordEmail = async (user, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`; // Adjust if client/admin logins are on different ports
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #dc2626;">Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
      <p>Please click on the button below or copy-paste the URL into your browser to reset your password. This link is valid for 10 minutes only.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Or paste this link: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #6b7280; text-align: center;">SaaS Invoice Management System &copy; 2026</p>
    </div>
  `;

  return writeEmailToFile(user.email, subject, html, 'reset_password');
};

module.exports = {
  sendWelcomeEmail,
  sendInvoiceEmail,
  sendForgotPasswordEmail
};
