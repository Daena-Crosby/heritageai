/**
 * SECURITY: Centralized Error Handler
 *
 * Provides secure error handling with:
 * - Safe error messages that don't leak internal details
 * - Structured error logging with request correlation
 * - Different behavior for development vs production
 * - Protection against error-based information disclosure
 *
 * OWASP Reference: A05:2021 - Security Misconfiguration (Error Handling)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * SECURITY: Known error types that are safe to expose to clients
 */
const SAFE_ERROR_TYPES = [
  'ValidationError',
  'AuthenticationError',
  'AuthorizationError',
  'NotFoundError',
  'RateLimitError',
];

/**
 * SECURITY: Error messages that are safe to expose
 * Map internal error patterns to user-friendly messages
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'jwt expired': 'Your session has expired. Please log in again.',
  'jwt malformed': 'Invalid authentication token.',
  'invalid signature': 'Invalid authentication token.',
  'CORS': 'Cross-origin request blocked.',
  'rate limit': 'Too many requests. Please try again later.',
  'file too large': 'File size exceeds the maximum limit.',
  'unsupported file type': 'File type is not supported.',
};

/**
 * SECURITY: Checks if an error message is safe to expose to clients
 */
const isSafeToExpose = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();

  // Check for known safe patterns
  for (const pattern of Object.keys(SAFE_ERROR_MESSAGES)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // SECURITY: Never expose these patterns
  const sensitivePatterns = [
    'sql',
    'query',
    'database',
    'connection',
    'password',
    'secret',
    'key',
    'token',
    'internal',
    'undefined',
    'null',
    'cannot read',
    'stack',
    'at /',
    'node_modules',
  ];

  return !sensitivePatterns.some((p) => lowerMessage.includes(p));
};

/**
 * SECURITY: Gets a safe error message for client response
 */
const getSafeErrorMessage = (err: Error): string => {
  const message = err.message || '';

  // Check for known safe messages
  for (const [pattern, safeMessage] of Object.entries(SAFE_ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return safeMessage;
    }
  }

  // If it's safe to expose, return original message
  if (isSafeToExpose(message)) {
    return message;
  }

  // SECURITY: Default to generic message for unknown errors
  return 'An error occurred. Please try again.';
};

/**
 * SECURITY: Gets HTTP status code based on error type
 */
const getStatusCode = (err: Error): number => {
  // Check for known error types
  if (err.name === 'ValidationError') return 400;
  if (err.name === 'AuthenticationError') return 401;
  if (err.name === 'AuthorizationError') return 403;
  if (err.name === 'NotFoundError') return 404;
  if (err.name === 'RateLimitError') return 429;

  // Check for specific error messages
  const message = err.message.toLowerCase();
  if (message.includes('not found')) return 404;
  if (message.includes('unauthorized') || message.includes('authentication')) return 401;
  if (message.includes('forbidden') || message.includes('not allowed')) return 403;
  if (message.includes('validation') || message.includes('invalid')) return 400;
  if (message.includes('rate limit')) return 429;
  if (message.includes('conflict') || message.includes('already exists')) return 409;

  // Default to 500 for unknown errors
  return 500;
};

/**
 * SECURITY: Main error handler middleware
 *
 * IMPORTANT: This must be registered LAST in the middleware chain
 * Express identifies error handlers by their 4-parameter signature
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = getStatusCode(err);
  const requestId = (req as any).requestId || 'unknown';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // SECURITY: Log full error details server-side only
  console.error(`[ERROR] Request ${requestId}:`, {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
    // SECURITY: Only log stack trace server-side
    stack: isDevelopment ? err.stack : undefined,
    // Include user info if available for debugging
    userId: (req as any).user?.id,
  });

  // SECURITY: Build client-safe response
  const response: Record<string, unknown> = {
    error: getSafeErrorMessage(err),
    requestId, // Include for support correlation
  };

  // SECURITY: Only include details in development mode
  if (isDevelopment) {
    response.debug = {
      name: err.name,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5), // Limit stack trace lines
    };
  }

  // SECURITY: Prevent caching of error responses
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  res.status(statusCode).json(response);
};

/**
 * SECURITY: Custom error classes for type-safe error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}
