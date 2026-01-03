import nodemailer from 'nodemailer';
import Logger from './logger';

// Email transporter configuration (lazy-loaded to ensure dotenv is configured)
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  // Return cached transporter if already created
  if (transporter !== null) {
    return transporter;
  }

  // Support for multiple email providers via environment variables
  const emailService = process.env.EMAIL_SERVICE || 'gmail'; // gmail, sendgrid, etc.
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    Logger.warn('Email credentials not configured. Email functionality will be disabled.');
    transporter = null;
    return null;
  }

  if (emailService === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass, // Use App Password for Gmail
      },
    });
  } else {
    // Generic SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

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
    Logger.error('Cannot send email: Email transporter not configured');
    return false;
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@blurchat.com';
    
    await emailTransporter.sendMail({
      from: `BlurChat <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    });

    Logger.info(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    Logger.error('Failed to send email:', error);
    return false;
  }
};

// Waitlist confirmation email template
export const getWaitlistConfirmationEmail = (email: string, position: number): EmailOptions => {
  return {
    to: email,
    subject: '🎉 Welcome to BlurChat Waitlist!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .position-badge { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 25px; font-size: 24px; font-weight: bold; margin: 20px 0; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 10px 0; padding-left: 30px; position: relative; }
            .feature-list li:before { content: "✨"; position: absolute; left: 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">BlurChat</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your intimate communication tool</p>
            </div>
            <div class="content">
              <h2>Hey there! 👋</h2>
              <p>Thank you for joining the BlurChat waitlist! We're thrilled to have you on this journey.</p>
              
              <div style="text-align: center;">
                <div class="position-badge">#${position}</div>
                <p>You're number <strong>${position}</strong> on our waitlist</p>
              </div>

              <h3>Here's what's coming next:</h3>
              <ul class="feature-list">
                <li><strong>1-Click Date Night:</strong> Flawless YouTube sync with zero lag. Watch together, perfectly synchronized.</li>
                <li><strong>Integrated Video Chat:</strong> See each other's reactions while watching, not just the movie.</li>
                <li><strong>Shared Journal:</strong> Your private diary. Lock memories together, just for the two of you.</li>
                <li><strong>Simple Text Chat:</strong> Chat while you watch, seamlessly.</li>
              </ul>

              <p><strong>Our mission:</strong> We're not just building an app. We're eliminating *loneliness*. Making connection *perfect*.</p>

              <p>We'll notify you as soon as we launch. Stay tuned! 🚀</p>

              <div class="footer">
                <p>With love,<br>The BlurChat Team</p>
                <p>Follow our journey: <a href="https://blurchat.com">blurchat.com</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

