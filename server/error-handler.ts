import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message: string = 'External service unavailable') {
    super(message, 503);
  }
}

// Enhanced error logging
export function logError(error: Error, req?: Request): void {
  const timestamp = new Date().toISOString();
  const method = req?.method || 'UNKNOWN';
  const path = req?.path || 'UNKNOWN';
  const userId = req?.session?.userId || 'anonymous';
  
  console.error(`[${timestamp}] ERROR: ${method} ${path} - User: ${userId}`);
  console.error(`Message: ${error.message}`);
  
  if (error.stack) {
    console.error(`Stack: ${error.stack}`);
  }
  
  // In production, you might want to send this to a logging service
  // like Winston, Loggly, or Datadog
}

// Centralized error handler middleware
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError(error, req);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({
      message: 'Validation failed',
      errors: validationError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Handle custom app errors
  if ('statusCode' in error && error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  if (error.name === 'MongoError' && (error as any).code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry' });
  }

  // Handle PostgreSQL errors
  if ((error as any).code) {
    switch ((error as any).code) {
      case '23505': // Unique violation
        return res.status(409).json({ message: 'Resource already exists' });
      case '23503': // Foreign key violation
        return res.status(400).json({ message: 'Referenced resource does not exist' });
      case '23502': // Not null violation
        return res.status(400).json({ message: 'Required field missing' });
      case '42P01': // Undefined table
        return res.status(500).json({ message: 'Database configuration error' });
    }
  }

  // Default error response
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      name: error.name 
    })
  });
}

// Async error wrapper to catch Promise rejections
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    const [req, res, next] = args as [Request, Response, NextFunction, ...any[]];
    return Promise.resolve(fn(...args)).catch(next);
  };
}

// Request context logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = req.session?.userId || 'anonymous';

  console.log(`[${new Date().toISOString()}] ${method} ${path} - IP: ${ip} - User: ${userId} - UA: ${userAgent}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${statusCode} - ${duration}ms`);
  });

  next();
}

// Health check endpoint
export function healthCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}