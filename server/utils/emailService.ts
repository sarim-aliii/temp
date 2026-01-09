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

export const getWaitlistConfirmationEmail = (email: string, position: number): EmailOptions => {
  return {
    to: email,
    subject: "You're on the list! 🚀",
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">BlurChat</h1>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">You are confirmed!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hi there,</p>
          <p style="font-size: 16px; line-height: 1.5;">Thanks for joining the BlurChat waitlist. We are working hard to get you access.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Current Position</p>
            <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #ef4444;">#${position}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">We'll email you again when your spot is ready.</p>
        </div>
      </div>
    `,
  };
};


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

export const getAccessGrantedEmail = (email: string): EmailOptions => {
  return {
    to: email,
    subject: "Access Granted: Welcome to BlurChat",
    html: `
      <div style="font-family: monospace; background: #000; color: #fff; padding: 40px;">
        <h1 style="color: #ef4444; letter-spacing: 0.2em;">SYSTEM_ACCESS: GRANTED</h1>
        <p>Terminal ID: ${email}</p>
        <hr style="border: 1px solid #333; margin: 20px 0;" />
        <p>Your spot in the queue has cleared. You are now authorized to enter the system.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; background: #fff; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; margin-top: 20px;">
           ENTER_SYSTEM ->
        </a>
      </div>
    `
  };
};