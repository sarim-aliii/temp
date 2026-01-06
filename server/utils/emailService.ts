import nodemailer from 'nodemailer';


let transporter: nodemailer.Transporter | null = null;

// Initialize Transporter
const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error('❌ EMAIL CONFIG ERROR: EMAIL_USER or EMAIL_PASS is missing in .env');
    return null;
  }

  // Gmail Configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  return transporter;
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.error('❌ Cannot send email: Transporter not ready.');
    return false;
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@blurchat.com';
    
    const info = await emailTransporter.sendMail({
      from: `"BlurChat Security" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    });

    console.log(`✅ Email sent: ${info.messageId} to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message);
    if (error.response) console.error(error.response);
    return false;
  }
};