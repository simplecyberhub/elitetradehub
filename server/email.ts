import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

// Initialize SendGrid if available
let mailService: typeof sgMail | null = null;
if (
  process.env.SENDGRID_API_KEY &&
  process.env.SENDGRID_API_KEY !== "your-sendgrid-api-key" &&
  process.env.SENDGRID_API_KEY.startsWith("SG.")
) {
  mailService = sgMail;
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid initialized successfully");
} else {
  console.warn(
    "SendGrid API key not properly configured - using fallback email service",
  );
}

// Initialize Nodemailer transporter
let nodemailerTransporter: any = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  nodemailerTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
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
      console.warn("SendGrid not configured");
      return false;
    }

    // Validate from email format for SendGrid
    let fromEmail = params.from;
    if (!fromEmail.includes("@")) {
      fromEmail = "care@trust-corp.online"; // Use a default verified sender
    }

    const emailData: any = {
      to: params.to,
      from: {
        email: fromEmail,
        name: "TFXC Trading Platform",
      },
      subject: params.subject,
    };

    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;

    await mailService.send(emailData);
    console.log("Email sent successfully via SendGrid to:", params.to);
    return true;
  } catch (error: any) {
    console.error("SendGrid email error:", {
      message: error.message,
      code: error.code,
      response: error.response?.body,
    });

    // Log specific SendGrid errors for debugging
    if (error.code === 403) {
      console.error(
        "SendGrid 403 Error: Check API key permissions and sender verification",
      );
    }

    return false;
  }
}

async function sendEmailWithNodemailer(params: EmailParams): Promise<boolean> {
  try {
    if (!nodemailerTransporter) {
      console.warn("Nodemailer SMTP not configured");
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
    console.log("Email sent successfully via SMTP to:", params.to);
    return true;
  } catch (error) {
    console.error("SMTP email error:", error);
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
  console.warn("All email services failed for:", params.to);
  return false;
}

// Professional email template wrapper
const getEmailTemplate = (title: string, content: string, platformName: string = "TFXC") => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .title { color: #667eea; font-size: 24px; margin-bottom: 20px; }
        .message { background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #e0e0e0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">${platformName}</h1>
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <div class="message">
            ${content}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email templates
export const emailTemplates = {
  welcomeEmail: (username: string, platformName: string = "TFXC") => ({
    subject: `Welcome to ${platformName}!`,
    text: `Welcome ${username}! Your account has been created successfully.`,
    html: getEmailTemplate(
      `Welcome, ${username}!`,
      `<p>Your account has been created successfully. You can now access all our trading features.</p>
       <p>Get started by completing your profile and exploring our markets.</p>
       <a href="${process.env.FRONTEND_URL || 'https://your-platform.com'}" class="button">Get Started</a>`,
      platformName
    ),
  }),

  depositConfirmation: (amount: string, currency: string, platformName: string = "TFXC") => ({
    subject: "Deposit Confirmation",
    text: `Your deposit of ${amount} ${currency} has been confirmed.`,
    html: getEmailTemplate(
      "Deposit Confirmed",
      `<p>Your deposit has been successfully processed.</p>
       <p><strong>Amount:</strong> ${amount} ${currency}</p>
       <p>The funds are now available in your account.</p>`,
      platformName
    ),
  }),

  withdrawalRequest: (amount: string, currency: string, platformName: string = "TFXC") => ({
    subject: "Withdrawal Request Received",
    text: `Your withdrawal request for ${amount} ${currency} has been received and is being processed.`,
    html: getEmailTemplate(
      "Withdrawal Request",
      `<p>Your withdrawal request has been received and is being processed.</p>
       <p><strong>Amount:</strong> ${amount} ${currency}</p>
       <p>You will receive a notification once the withdrawal is completed.</p>`,
      platformName
    ),
  }),

  kycStatusUpdate: (status: string, platformName: string = "TFXC") => ({
    subject: `KYC Verification ${status === "verified" ? "Approved" : status === "rejected" ? "Rejected" : "Update"}`,
    text: `Your KYC verification status has been updated to: ${status}. ${status === "verified" ? "You can now access all platform features." : status === "rejected" ? "Please resubmit your documents with correct information." : ""}`,
    html: getEmailTemplate(
      `KYC Verification ${status === "verified" ? "Approved" : status === "rejected" ? "Rejected" : "Update"}`,
      `<p>Your KYC verification status has been updated to: <strong style="color: ${status === 'verified' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b'}">${status.toUpperCase()}</strong></p>
       ${status === "verified" ? "<p>Congratulations! You can now access all platform features.</p>" : 
         status === "rejected" ? "<p>Please resubmit your documents with the correct information.</p>" : 
         "<p>Your documents are being reviewed. We'll notify you once the process is complete.</p>"}`,
      platformName
    ),
  }),
};

export async function sendTransactionEmail(
  userEmail: string,
  transaction: any,
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid API key not configured - email not sent");
    return;
  }

  try {
    const msg = {
      to: userEmail,
      from: "care@trust-corp.online",
      subject: `Transaction ${transaction.type} - ${transaction.status}`,
      html: `
        <h2>Transaction Update</h2>
        <p>Your ${transaction.type} of $${transaction.amount} is now ${transaction.status}.</p>
        <p>Transaction ID: ${transaction.id}</p>
        <p>Date: ${new Date(transaction.createdAt).toLocaleString()}</p>
      `,
    };

    await sgMail.send(msg);
    console.log("Transaction email sent successfully");
  } catch (error) {
    console.error("SendGrid email error:", error);
    // Don't throw error - continue with transaction processing
    console.log("Transaction email not sent - continuing with transaction");
  }
}
