import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Check if SendGrid API key is properly configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your-sendgrid-api-key') {
      console.warn('SendGrid API key not configured - email sending disabled');
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
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    // For development, don't let email failures break the application
    return false;
  }
}

// Email templates
export const emailTemplates = {
  depositConfirmation: (amount: string, assetSymbol: string) => ({
    subject: 'Deposit Confirmation - EliteStock',
    text: `Your deposit of ${amount} ${assetSymbol} has been confirmed and added to your account.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Deposit Confirmed</h2>
        <p>Great news! Your deposit has been successfully processed.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${amount} ${assetSymbol}</p>
          <p><strong>Status:</strong> <span style="color: #16a34a;">Confirmed</span></p>
        </div>
        <p>Your funds are now available for trading. Thank you for choosing EliteStock!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  }),

  withdrawalRequest: (amount: string, assetSymbol: string) => ({
    subject: 'Withdrawal Request Received - EliteStock',
    text: `Your withdrawal request of ${amount} ${assetSymbol} has been received and is being processed.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Withdrawal Request Received</h2>
        <p>We have received your withdrawal request and it is currently being processed.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${amount} ${assetSymbol}</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b;">Processing</span></p>
        </div>
        <p>Withdrawals typically take 1-3 business days to complete. You will receive another email once your withdrawal has been processed.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  }),

  kycStatusUpdate: (status: string) => ({
    subject: `KYC Status Update - ${status} - EliteStock`,
    text: `Your KYC verification status has been updated to: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'approved' ? '#16a34a' : status === 'rejected' ? '#dc2626' : '#f59e0b'};">KYC Status Update</h2>
        <p>Your Know Your Customer (KYC) verification status has been updated.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> <span style="color: ${status === 'approved' ? '#16a34a' : status === 'rejected' ? '#dc2626' : '#f59e0b'};">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
        </div>
        ${status === 'approved' 
          ? '<p>Congratulations! Your account is now fully verified and you have access to all trading features.</p>'
          : status === 'rejected'
          ? '<p>Unfortunately, we were unable to verify your documents. Please check your account for more details and resubmit if necessary.</p>'
          : '<p>Your documents are currently under review. We will notify you once the review is complete.</p>'
        }
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  }),

  welcomeEmail: (username: string) => ({
    subject: 'Welcome to EliteStock Trading Platform',
    text: `Welcome to EliteStock, ${username}! Your account has been successfully created.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to EliteStock!</h2>
        <p>Hello ${username},</p>
        <p>Welcome to EliteStock Trading Platform! Your account has been successfully created and you can now start your trading journey.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Getting Started:</h3>
          <ul style="margin: 10px 0;">
            <li>Complete your KYC verification for full access</li>
            <li>Make your first deposit to start trading</li>
            <li>Explore our copy trading features</li>
            <li>Check out our investment plans</li>
          </ul>
        </div>
        <p>If you have any questions, our support team is here to help!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  })
};