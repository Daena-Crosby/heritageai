/**
 * SECURITY: Rate Limiting Middleware
 *
 * Implements tiered rate limiting with:
 * - IP-based rate limiting for all requests
 * - User-based rate limiting for authenticated requests (prevents single user abuse)
 * - Graceful 429 responses with Retry-After headers
 * - Proper rate limit headers (RateLimit-* standard)
 *
 * OWASP Reference: A04:2021 - Insecure Design (Rate Limiting)
 */

import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

// ============================
// Security: Custom key generator for combined IP + user-based limiting
// ============================

/**
 * SECURITY: Generates a unique key for rate limiting based on IP and optional user ID.
 * This prevents a single authenticated user from consuming an IP's entire quota,
 * while still protecting against distributed attacks from multiple users on same IP.
 */
const getKeyGenerator = (prefix: string) => {
  return (req: Request): string => {
    // SECURITY: Extract client IP, accounting for proxies
    // Trust X-Forwarded-For only if behind a known proxy (configure in production)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // SECURITY: Include user ID if authenticated for per-user limits
    const userId = (req as any).user?.id;

    if (userId) {
      // Authenticated requests: limit per user per IP
      return `${prefix}:user:${userId}:${ip}`;
    }

    // Unauthenticated requests: limit per IP only
    return `${prefix}:ip:${ip}`;
  };
};

/**
 * SECURITY: Standard 429 response handler with proper headers
 * Includes Retry-After header for client retry logic
 */
const createRateLimitHandler = (windowMs: number, message: string) => {
  return (_req: Request, res: Response): void => {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);

    // SECURITY: Set Retry-After header for proper client behavior
    res.set('Retry-After', String(retryAfterSeconds));

    res.status(429).json({
      error: message,
      retryAfter: retryAfterSeconds,
      // SECURITY: Include timestamp for debugging (not sensitive)
      timestamp: new Date().toISOString(),
    });
  };
};

/**
 * SECURITY: Common rate limiter options
 * - standardHeaders: Sends RateLimit-* headers (RFC draft standard)
 * - legacyHeaders: Disabled (X-RateLimit-* deprecated)
 * - skipFailedRequests: false - count all requests to prevent abuse
 */
const createLimiter = (
  windowMs: number,
  max: number,
  prefix: string,
  message: string,
  options: Partial<Options> = {}
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // SECURITY: Send RateLimit-* headers
    legacyHeaders: false,   // SECURITY: Disable deprecated X-RateLimit-* headers
    keyGenerator: getKeyGenerator(prefix),
    handler: createRateLimitHandler(windowMs, message),
    // SECURITY: Skip successful requests only for auth (prevents lockout on valid logins)
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...options,
  });
};

// ============================
// Rate Limiters by Tier
// ============================

/**
 * SECURITY: General API rate limit - 100 requests per 15 minutes
 * Applied globally to all routes as baseline protection
 */
export const generalLimiter = createLimiter(
  15 * 60 * 1000,  // 15 minutes
  100,              // max requests
  'general',
  'Too many requests. Please try again later.'
);

/**
 * SECURITY: Upload rate limit - 10 uploads per hour per IP/user
 * Stricter limit to prevent storage abuse and DoS via resource exhaustion
 */
export const uploadLimiter = createLimiter(
  60 * 60 * 1000,  // 1 hour
  10,               // max uploads
  'upload',
  'Upload limit reached. You can upload up to 10 stories per hour.',
  {
    // SECURITY: Don't skip failed uploads - they still consume server resources
    skipFailedRequests: false,
  }
);

/**
 * SECURITY: Search/API-intensive operations - 60 requests per minute
 * Moderate limit for endpoints that may be computationally expensive
 */
export const searchLimiter = createLimiter(
  60 * 1000,  // 1 minute
  60,          // max requests
  'search',
  'Too many search requests. Please slow down.'
);

/**
 * SECURITY: Comment rate limit - 30 comments per 5 minutes
 * Prevents spam while allowing reasonable engagement
 */
export const commentLimiter = createLimiter(
  5 * 60 * 1000,  // 5 minutes
  30,              // max comments
  'comment',
  'Too many comments. Please wait before posting again.'
);

/**
 * SECURITY: Auth routes - strict limit to prevent brute-force attacks
 * 10 attempts per 15 minutes, only counting FAILED requests
 * OWASP Reference: A07:2021 - Identification and Authentication Failures
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getKeyGenerator('auth'),
  // SECURITY: Only count failed login attempts - successful logins don't count
  // This prevents legitimate users from being locked out after logging in successfully
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  handler: createRateLimitHandler(
    15 * 60 * 1000,
    'Too many authentication attempts. Please try again in 15 minutes.'
  ),
});

/**
 * SECURITY: Sensitive operations rate limit - 5 requests per minute
 * For admin/moderation actions that should be rare
 */
export const sensitiveLimiter = createLimiter(
  60 * 1000,  // 1 minute
  5,           // max requests
  'sensitive',
  'Too many sensitive operations. Please wait before trying again.'
);

/**
 * SECURITY: AI/External API rate limit - 20 requests per minute
 * Protects against abuse of expensive third-party API calls
 */
export const aiLimiter = createLimiter(
  60 * 1000,  // 1 minute
  20,          // max requests
  'ai',
  'Too many AI requests. Please wait before trying again.'
);
