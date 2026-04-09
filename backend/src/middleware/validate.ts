/**
 * SECURITY: Input Validation and Sanitization Middleware
 *
 * Implements comprehensive input validation using Zod with:
 * - Schema-based validation with type checking
 * - String length limits on all text inputs
 * - HTML/XSS sanitization for user-provided content
 * - Strict mode to reject unexpected fields
 * - Proper error responses without leaking internal details
 *
 * OWASP References:
 * - A03:2021 - Injection (XSS Prevention)
 * - A04:2021 - Insecure Design (Input Validation)
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

// ============================
// SECURITY: HTML/XSS Sanitization Helpers
// ============================

/**
 * SECURITY: Sanitizes a string to prevent XSS attacks.
 * Encodes HTML special characters to their entity equivalents.
 * This is a defense-in-depth measure - frontend should also sanitize on display.
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';

  return input
    // SECURITY: Encode HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // SECURITY: Remove null bytes (can bypass filters)
    .replace(/\x00/g, '')
    // SECURITY: Normalize unicode to prevent homograph attacks
    .normalize('NFKC');
};

/**
 * SECURITY: Sanitizes a string but preserves basic formatting.
 * For content like story text where we want to keep newlines but prevent XSS.
 */
export const sanitizeContent = (input: string): string => {
  if (typeof input !== 'string') return '';

  // SECURITY: Basic HTML entity encoding
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\x00/g, '');

  // SECURITY: Limit consecutive newlines to prevent layout attacks
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  return sanitized.trim();
};

/**
 * SECURITY: Recursively sanitizes all string values in an object.
 * Used to sanitize entire request bodies.
 */
const sanitizeObject = <T>(obj: T, contentFields: string[] = []): T => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, contentFields)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof value === 'string') {
        // SECURITY: Use content-preserving sanitization for known content fields
        sanitized[key] = contentFields.includes(key)
          ? sanitizeContent(value)
          : sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeObject(value, contentFields);
      }
    }
    return sanitized as T;
  }

  return obj;
};

// ============================
// SECURITY: Validation Middleware Factory
// ============================

/**
 * Options for the validation middleware
 */
interface ValidateOptions {
  /** Fields that should use content-preserving sanitization (newlines allowed) */
  contentFields?: string[];
  /** Whether to strip unknown fields (default: true for security) */
  stripUnknown?: boolean;
}

/**
 * SECURITY: Validation middleware factory using Zod schemas.
 *
 * @param schema - Zod schema for validation
 * @param source - Request property to validate ('body', 'query', 'params')
 * @param options - Additional validation options
 *
 * Features:
 * - Type-safe validation with detailed error messages
 * - Automatic HTML sanitization of all string inputs
 * - Rejection of unexpected fields (configurable)
 * - Safe error responses that don't leak schema details
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
  options: ValidateOptions = {}
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const { contentFields = [], stripUnknown = true } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // SECURITY: Sanitize input before validation
      const rawInput = req[source];
      const sanitizedInput = sanitizeObject(rawInput, contentFields);

      // SECURITY: Parse with strict mode to catch extra fields
      const result = schema.safeParse(sanitizedInput);

      if (!result.success) {
        // SECURITY: Throw validation error to be handled by centralized error handler
        const errors = formatZodError(result.error);

        const validationError = new ValidationError('Validation failed');
        validationError.details = errors;
        // SECURITY: Include field-level errors for client-side handling
        validationError.fields = result.error.flatten().fieldErrors as Record<string, string[]>;
        throw validationError;
      }

      // SECURITY: Replace request data with validated and sanitized data
      // This ensures only validated fields are used downstream
      (req as any)[source] = result.data;
      next();
    } catch (err) {
      // SECURITY: Don't expose internal errors
      console.error('Validation middleware error:', err);
      // Forward to centralized error handler
      next(err);
    }
  };
};

/**
 * SECURITY: Formats Zod errors into user-friendly messages
 * without exposing internal schema structure
 */
const formatZodError = (error: ZodError): string[] => {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
};

// ============================
// SECURITY: Common Zod Refinements
// ============================

/**
 * SECURITY: Creates a sanitized string schema with length limits
 */
const safeString = (minLen: number, maxLen: number) =>
  z
    .string()
    .min(minLen, `Must be at least ${minLen} characters`)
    .max(maxLen, `Must be at most ${maxLen} characters`)
    .transform((val) => val.trim());

/**
 * SECURITY: Creates an optional sanitized string schema with length limits
 */
const optionalSafeString = (maxLen: number) =>
  z
    .string()
    .max(maxLen, `Must be at most ${maxLen} characters`)
    .transform((val) => val.trim())
    .optional();

// ============================
// Schemas - Story Upload
// ============================

export const storyUploadSchema = z
  .object({
    title: optionalSafeString(200),
    storytellerName: optionalSafeString(100),
    storytellerLocation: optionalSafeString(100),
    storytellerDialect: optionalSafeString(50),
    ageGroup: z.enum(['children', 'teens', 'general']).optional(),
    country: optionalSafeString(100),
    language: optionalSafeString(100),
    theme: optionalSafeString(100),
  })
  .strict(); // SECURITY: Reject unexpected fields

export const storyUpdateSchema = z
  .object({
    title: safeString(1, 200).optional(),
    age_group: z.enum(['children', 'teens', 'general']).optional(),
    country: optionalSafeString(100),
    language: optionalSafeString(100),
    theme: optionalSafeString(100),
    is_published: z.boolean().optional(),
  })
  .strict(); // SECURITY: Reject unexpected fields

// ============================
// Schemas - Story Query (with pagination limits)
// ============================

export const storyQuerySchema = z
  .object({
    language: optionalSafeString(100),
    country: optionalSafeString(100),
    theme: optionalSafeString(100),
    age_group: z.enum(['children', 'teens', 'general']).optional(),
    storyteller_id: z.string().uuid('Invalid storyteller ID format').optional(),
    // SECURITY: Enforce pagination limits to prevent resource exhaustion
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

// ============================
// Schemas - Search Query
// ============================

export const searchQuerySchema = z
  .object({
    q: safeString(1, 200).optional(),
    language: optionalSafeString(100),
    country: optionalSafeString(100),
    theme: optionalSafeString(100),
    age_group: z.enum(['children', 'teens', 'general']).optional(),
    // SECURITY: Enforce pagination limits
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

// ============================
// Schemas - Comments
// ============================

export const commentSchema = z
  .object({
    // SECURITY: Comments have strict length limits to prevent abuse
    content: safeString(1, 2000),
  })
  .strict();

// ============================
// Schemas - UUID Parameters
// ============================

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ============================
// Schemas - Translation
// ============================

const SUPPORTED_DIALECTS = [
  'Jamaican Patois',
  'Trinidadian Slang',
  'Nigerian Pidgin',
  'Louisiana Creole',
  'Haitian Kreyòl',
] as const;

export const translateSchema = z
  .object({
    // SECURITY: Limit text length to prevent abuse of AI services
    text: safeString(1, 2000),
    sourceDialect: z.enum(SUPPORTED_DIALECTS, {
      errorMap: () => ({ message: `Must be one of: ${SUPPORTED_DIALECTS.join(', ')}` }),
    }),
  })
  .strict();

// ============================
// Schemas - Cultural Guide
// ============================

export const guideMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  // SECURITY: Limit content length per message
  content: safeString(1, 4000),
});

export const guideSchema = z
  .object({
    // SECURITY: Limit message history to prevent context exploitation
    messages: z
      .array(guideMessageSchema)
      .min(1, 'At least one message is required')
      .max(20, 'Maximum 20 messages allowed'),
  })
  .strict();

// ============================
// Schemas - Auth (with password strength validation)
// ============================

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email format').max(255),
    // SECURITY: Password requirements
    // - Minimum 8 characters (NIST SP 800-63B recommends 8+)
    // - Maximum 128 to prevent DoS via bcrypt
    password: safeString(8, 128),
    displayName: optionalSafeString(50),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email('Invalid email format').max(255),
    // SECURITY: Don't enforce password rules on login (would leak info about valid passwords)
    password: z.string().min(1, 'Password is required').max(128),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format').max(255),
  })
  .strict();

// ============================
// Schemas - Admin
// ============================

export const roleSchema = z
  .object({
    role: z.enum(['user', 'moderator', 'admin']),
  })
  .strict();

export const auditLogQuerySchema = z
  .object({
    // SECURITY: Pagination limits for audit log
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

// ============================
// Schemas - Moderation
// ============================

export const rejectSchema = z
  .object({
    note: optionalSafeString(500),
  })
  .strict();
