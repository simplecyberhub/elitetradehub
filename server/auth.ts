import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { sendEmail, emailTemplates } from './email';

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Session configuration
const PgSession = connectPg(session);

export function configureSession(app: Express) {
  const sessionMiddleware = session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: false, // We manage the table in our schema
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  });

  app.use(sessionMiddleware);
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.userId = req.session.userId;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Email notification helpers
export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  try {
    const template = emailTemplates.welcomeEmail(username);
    await sendEmail({
      to: email,
      from: 'noreply@elitestock.com', // Replace with verified sender
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error to prevent blocking user registration
  }
}

export async function sendTransactionEmail(
  email: string, 
  type: 'deposit' | 'withdrawal', 
  amount: string, 
  asset: string = 'USD'
): Promise<void> {
  try {
    const template = type === 'deposit' 
      ? emailTemplates.depositConfirmation(amount, asset)
      : emailTemplates.withdrawalRequest(amount, asset);
    
    await sendEmail({
      to: email,
      from: 'noreply@elitestock.com', // Replace with verified sender
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    console.error(`Failed to send ${type} email:`, error);
  }
}

export async function sendKycStatusEmail(
  email: string, 
  status: string
): Promise<void> {
  try {
    const template = emailTemplates.kycStatusUpdate(status);
    await sendEmail({
      to: email,
      from: 'noreply@elitestock.com', // Replace with verified sender
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send KYC status email:', error);
  }
}

// Rate limiting and security headers
export function configureSecurity(app: Express) {
  // Enable trust proxy to fix rate limiting issues
  app.set('trust proxy', 1);
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  app.use('/api/', generalLimiter);
  app.use('/api/auth/', authLimiter);
}

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}