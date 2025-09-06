
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Initialize SendGrid if available
let mailService: typeof sgMail | null = null;
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') {
  mailService = sgMail;
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Nodemailer transporter
let nodemailerTransporter: any = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  nodemailerTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

async function sendEmailWithSendGrid(params: EmailParams): Promise<boolean> {
  try {
    if (!mailService) {
      console.warn('SendGrid not configured');
      return false;
    }

    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService.send(emailData);
    console.log('Email sent successfully via SendGrid to:', params.to);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

async function sendEmailWithNodemailer(params: EmailParams): Promise<boolean> {
  try {
    if (!nodemailerTransporter) {
      console.warn('Nodemailer SMTP not configured');
      return false;
    }

    const mailOptions = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    await nodemailerTransporter.sendMail(mailOptions);
    console.log('Email sent successfully via SMTP to:', params.to);
    return true;
  } catch (error) {
    console.error('SMTP email error:', error);
    return false;
  }
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Try SendGrid first
  if (mailService) {
    const sendGridResult = await sendEmailWithSendGrid(params);
    if (sendGridResult) return true;
  }

  // Fallback to Nodemailer SMTP
  if (nodemailerTransporter) {
    const nodemailerResult = await sendEmailWithNodemailer(params);
    if (nodemailerResult) return true;
  }

  // If both fail, try a simple fallback method
  console.warn('All email services failed for:', params.to);
  return false;
}

// Email templates
export const emailTemplates = {
  welcomeEmail: (username: string) => ({
    subject: 'Welcome to EliteStock Trading Platform',
    text: `Welcome ${username}! Your account has been created successfully.`,
    html: `<h1>Welcome ${username}!</h1><p>Your account has been created successfully.</p>`
  }),
  
  depositConfirmation: (amount: string, currency: string) => ({
    subject: 'Deposit Confirmation',
    text: `Your deposit of ${amount} ${currency} has been confirmed.`,
    html: `<h1>Deposit Confirmed</h1><p>Your deposit of <strong>${amount} ${currency}</strong> has been confirmed.</p>`
  }),
  
  withdrawalRequest: (amount: string, currency: string) => ({
    subject: 'Withdrawal Request Received',
    text: `Your withdrawal request for ${amount} ${currency} has been received and is being processed.`,
    html: `<h1>Withdrawal Request</h1><p>Your withdrawal request for <strong>${amount} ${currency}</strong> has been received and is being processed.</p>`
  })
};
