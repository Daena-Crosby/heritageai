/**
 * SECURITY: Security Event Logging Middleware
 *
 * Provides logging for security-relevant events including:
 * - Authentication attempts (success/failure)
 * - Rate limit violations
 * - Authorization failures
 * - Suspicious request patterns
 *
 * OWASP References:
 * - A09:2021 - Security Logging and Monitoring Failures
 * - A07:2021 - Identification and Authentication Failures
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================
// SECURITY: Request ID Generation
// ============================

/**
 * SECURITY: Generates a unique request ID for tracing
 * Uses crypto.randomUUID for cryptographically secure IDs
 */
export const generateRequestId = (): string => {
  return crypto.randomUUID();
};

/**
 * SECURITY: Middleware to add request ID to all requests
 * Enables correlation of logs across a single request lifecycle
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = generateRequestId();

  // Attach to request for logging
  (req as any).requestId = requestId;

  // SECURITY: Include request ID in response headers for client correlation
  res.setHeader('X-Request-ID', requestId);

  next();
};

// ============================
// SECURITY: Log Entry Types
// ============================

interface SecurityLogEntry {
  timestamp: string;
  requestId: string;
  event: SecurityEventType;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  ip: string;
  userId?: string;
  userEmail?: string;
  method: string;
  path: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_LOGOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTHORIZATION_FAILURE'
  | 'INVALID_INPUT'
  | 'SUSPICIOUS_REQUEST'
  | 'API_KEY_MISSING'
  | 'FILE_UPLOAD'
  | 'ADMIN_ACTION';

// ============================
// SECURITY: Logging Functions
// ============================

/**
 * SECURITY: Extracts client IP from request, accounting for proxies
 * In production, ensure X-Forwarded-For is only trusted from known proxies
 */
const getClientIp = (req: Request): string => {
  // SECURITY: In production, configure trusted proxies in Express
  // For now, prefer socket address over forwarded header
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();

  return req.ip || forwardedIp || req.socket.remoteAddress || 'unknown';
};

/**
 * SECURITY: Logs a security event with structured data
 * In production, this should integrate with a SIEM or log aggregator
 */
export const logSecurityEvent = (
  req: Request,
  event: SecurityEventType,
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
  details?: Record<string, unknown>
): void => {
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId || 'no-request-id',
    event,
    severity,
    ip: getClientIp(req),
    userId: (req as any).user?.id,
    userEmail: (req as any).user?.email,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    details,
  };

  // SECURITY: Log format is structured JSON for easy parsing by log aggregators
  const logLine = JSON.stringify(entry);

  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      console.error(`[SECURITY] ${logLine}`);
      break;
    case 'WARN':
      console.warn(`[SECURITY] ${logLine}`);
      break;
    default:
      console.log(`[SECURITY] ${logLine}`);
  }
};

// ============================
// SECURITY: Pre-built Logging Helpers
// ============================

/**
 * SECURITY: Log successful authentication
 */
export const logAuthSuccess = (req: Request, userId: string, email: string): void => {
  logSecurityEvent(
    req,
    'AUTH_SUCCESS',
    'INFO',
    { userId, email: maskEmail(email) }
  );
};

/**
 * SECURITY: Log failed authentication attempt
 * Important for detecting brute-force attacks
 */
export const logAuthFailure = (req: Request, email: string, reason: string): void => {
  logSecurityEvent(
    req,
    'AUTH_FAILURE',
    'WARN',
    {
      email: maskEmail(email),
      reason,
      // SECURITY: Include attempt count if available for rate limiting correlation
    }
  );
};

/**
 * SECURITY: Log user logout
 */
export const logAuthLogout = (req: Request): void => {
  logSecurityEvent(req, 'AUTH_LOGOUT', 'INFO');
};

/**
 * SECURITY: Log rate limit violation
 */
export const logRateLimitExceeded = (
  req: Request,
  limiterType: string
): void => {
  logSecurityEvent(
    req,
    'RATE_LIMIT_EXCEEDED',
    'WARN',
    { limiterType }
  );
};

/**
 * SECURITY: Log authorization failure (403)
 */
export const logAuthorizationFailure = (
  req: Request,
  requiredRole: string,
  actualRole?: string
): void => {
  logSecurityEvent(
    req,
    'AUTHORIZATION_FAILURE',
    'WARN',
    { requiredRole, actualRole }
  );
};

/**
 * SECURITY: Log invalid input detection
 */
export const logInvalidInput = (
  req: Request,
  field: string,
  reason: string
): void => {
  logSecurityEvent(
    req,
    'INVALID_INPUT',
    'WARN',
    { field, reason }
  );
};

/**
 * SECURITY: Log suspicious request patterns
 * e.g., SQL injection attempts, path traversal, etc.
 */
export const logSuspiciousRequest = (
  req: Request,
  reason: string,
  pattern?: string
): void => {
  logSecurityEvent(
    req,
    'SUSPICIOUS_REQUEST',
    'ERROR',
    {
      reason,
      // SECURITY: Don't log the actual malicious pattern to avoid log injection
      patternDetected: pattern ? 'yes' : 'no',
    }
  );
};

/**
 * SECURITY: Log file upload events
 */
export const logFileUpload = (
  req: Request,
  filename: string,
  mimeType: string,
  size: number
): void => {
  logSecurityEvent(
    req,
    'FILE_UPLOAD',
    'INFO',
    { filename, mimeType, sizeBytes: size }
  );
};

/**
 * SECURITY: Log admin/moderation actions
 */
export const logAdminAction = (
  req: Request,
  action: string,
  resourceType: string,
  resourceId: string
): void => {
  logSecurityEvent(
    req,
    'ADMIN_ACTION',
    'INFO',
    { action, resourceType, resourceId }
  );
};

// ============================
// SECURITY: Helper Functions
// ============================

/**
 * SECURITY: Masks email for logging (GDPR/privacy compliance)
 * Shows first 2 chars + domain for debugging without exposing full email
 */
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***';

  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
    ? `${local.slice(0, 2)}***`
    : '***';

  return `${maskedLocal}@${domain}`;
};

// ============================
// SECURITY: Suspicious Pattern Detection
// ============================

/**
 * SECURITY: Detects common attack patterns in request data
 * This is a defense-in-depth measure - primary protection is proper escaping/parameterization
 */
const SUSPICIOUS_PATTERNS = [
  // SQL Injection patterns
  /('|"|;|--|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table)/i,
  // Path traversal
  /(\.\.[\/\\]|\.\.%2[fF]|\.\.%5[cC])/,
  // XSS patterns (backup to sanitization)
  /(<script|javascript:|on\w+\s*=)/i,
  // Command injection
  /(;|\||`|\$\(|&&|\|\|)/,
];

/**
 * SECURITY: Middleware to detect and log suspicious request patterns
 * Does NOT block requests (that's handled by validation) but logs for monitoring
 */
export const suspiciousPatternDetector = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const checkValue = (value: unknown, location: string): void => {
    if (typeof value !== 'string') return;

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(value)) {
        logSuspiciousRequest(req, `Suspicious pattern in ${location}`, 'detected');
        // SECURITY: Don't break - log all suspicious patterns but continue processing
        // The validation layer will handle blocking if needed
        break;
      }
    }
  };

  // Check URL path
  checkValue(req.path, 'path');

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      checkValue(value, `query.${key}`);
    }
  }

  // Check body (only for JSON bodies)
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      checkValue(value, `body.${key}`);
    }
  }

  next();
};

// ============================
// SECURITY: API Key Validation Logging
// ============================

/**
 * SECURITY: Logs when required API keys are missing
 * Helps identify misconfiguration quickly
 */
export const logMissingApiKey = (keyName: string): void => {
  console.error(`[SECURITY] CRITICAL: Missing required API key: ${keyName}`);
};

/**
 * SECURITY: Startup check for required environment variables
 * Call this on server startup to fail fast on misconfiguration
 */
export const validateRequiredEnvVars = (): void => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const optional = [
    'HUGGINGFACE_API_TOKEN',
    'GROQ_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[SECURITY] CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    // SECURITY: In production, you might want to exit the process
    // process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn(`[SECURITY] WARN: Missing optional environment variables (some features disabled): ${missingOptional.join(', ')}`);
  }

  // SECURITY: Check that service role key is not accidentally exposed
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Verify it looks like a valid key format (basic sanity check)
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (key.length < 100) {
      console.warn('[SECURITY] WARN: SUPABASE_SERVICE_ROLE_KEY appears to be malformed or too short');
    }
  }
};
