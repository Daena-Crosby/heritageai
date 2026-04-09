/**
 * SECURITY: Dialect Translation Route
 *
 * Implements secure translation with:
 * - Rate limiting (20 AI requests / min)
 * - Input validation with length limits
 * - Dialect enum validation
 * - External API error handling
 *
 * OWASP Reference: A04:2021 - Insecure Design (API Rate Limiting)
 */

import { Router, Request, Response } from 'express';
import { translateDialectText } from '../services/ai';
import { aiLimiter } from '../middleware/rateLimiter';
import { validate, translateSchema } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// SECURITY: Apply AI-specific rate limiting
router.use(aiLimiter);

/**
 * POST /api/translate
 * SECURITY: Translate dialect text to English
 *
 * Body: { text: string, sourceDialect: string }
 * Returns: { translation: string, sourceDialect: string }
 */
router.post(
  '/',
  validate(translateSchema, 'body', { contentFields: ['text'] }),
  asyncHandler(async (req: Request, res: Response) => {
    const { text, sourceDialect } = req.body;

    // SECURITY: Text is already validated and sanitized
    // Errors are handled by handleExternalApiError in ai.ts and centralized error handler
    const result = await translateDialectText(text, sourceDialect);

    res.json({
      translation: result.translation,
      sourceDialect,
    });
  })
);

export default router;
