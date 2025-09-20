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
        name: "EliteStock Trading Platform",
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

// Professional Email Templates with Branding
export const emailTemplates = {
  welcomeEmail: (username: string, dashboardUrl: string = 'https://your-domain.com/dashboard') => ({
    subject: "Welcome to EliteStock Trading Platform",
    text: `Welcome ${username}! Your account has been created successfully.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8fafc; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; background: white; margin: 20px 0; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🚀 EliteStock Trading</div>
            <p style="margin: 0; opacity: 0.9;">Professional Trading Platform</p>
          </div>
          <div class="content">
            <h2 style="color: #1e40af;">Welcome ${username}!</h2>
            <p>Your account has been successfully created and you're ready to start trading with EliteStock.</p>
            <p>🎯 <strong>What's next?</strong></p>
            <ul style="padding-left: 20px;">
              <li>Complete your KYC verification</li>
              <li>Make your first deposit</li>
              <li>Explore our trading tools</li>
            </ul>
            <a href="${dashboardUrl}" class="btn">Access Your Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 EliteStock Trading. All rights reserved.</p>
            <p>This email was sent to you because you created an account with us.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  transactionUpdate: (type: string, amount: string, status: string, date: string) => ({
    subject: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)} - EliteStock`,
    text: `Your ${type} of $${amount} is now ${status}.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8fafc; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; background: white; margin: 20px 0; border-radius: 8px; }
          .transaction-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .status-completed { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-failed { color: #ef4444; font-weight: bold; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🚀 EliteStock Trading</div>
            <p style="margin: 0; opacity: 0.9;">Transaction Notification</p>
          </div>
          <div class="content">
            <h2 style="color: #1e40af;">Transaction Update</h2>
            <div class="transaction-details">
              <p><strong>Type:</strong> ${type.toUpperCase()}</p>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Status:</strong> <span class="status-${status}">${status.toUpperCase()}</span></p>
              <p><strong>Date:</strong> ${date}</p>
            </div>
            ${status === 'completed' ? '<p style="color: #10b981;">✅ Your transaction has been successfully processed.</p>' : ''}
            ${status === 'pending' ? '<p style="color: #f59e0b;">⏳ Your transaction is being reviewed by our team.</p>' : ''}
            ${status === 'failed' ? '<p style="color: #ef4444;">❌ Your transaction could not be completed. Please contact support.</p>' : ''}
          </div>
          <div class="footer">
            <p>&copy; 2025 EliteStock Trading. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  kycStatusUpdate: (status: string) => {
    const statusMessages = {
      verified: "Your identity verification has been successfully completed! You now have full access to all platform features.",
      rejected: "Your KYC verification was not approved. Please resubmit your documents with correct information.",
      pending: "Your KYC documents are being reviewed. This usually takes 1-2 business days."
    };

    return {
      subject: `KYC Verification ${status === "verified" ? "Approved" : status === "rejected" ? "Rejected" : "Update"}`,
      text: `Your KYC verification status: ${status}. ${statusMessages[status as keyof typeof statusMessages] || ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8fafc; }
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; background: white; margin: 20px 0; border-radius: 8px; }
            .status-box { padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .status-verified { background: #dcfce7; border: 2px solid #10b981; color: #065f46; }
            .status-rejected { background: #fee2e2; border: 2px solid #ef4444; color: #991b1b; }
            .status-pending { background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">🚀 EliteStock Trading</div>
              <p style="margin: 0; opacity: 0.9;">KYC Verification Update</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">KYC Status Update</h2>
              <div class="status-box status-${status}">
                <h3>${status === 'verified' ? '✅' : status === 'rejected' ? '❌' : '⏳'} Status: ${status.toUpperCase()}</h3>
                <p>${statusMessages[status as keyof typeof statusMessages] || 'Your KYC status has been updated.'}</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 EliteStock Trading. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },
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
