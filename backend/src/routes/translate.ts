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
  async (req: Request, res: Response) => {
    const { text, sourceDialect } = req.body;

    try {
      // SECURITY: Text is already validated and sanitized
      const result = await translateDialectText(text, sourceDialect);

      return res.json({
        translation: result.translation,
        sourceDialect,
      });
    } catch (err: any) {
      const msg = err?.message || 'Translation failed';

      // SECURITY: Handle external API rate limits gracefully
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429')) {
        return res.status(429).json({
          error: 'Rate limit reached. Please wait a moment and try again.',
          retryAfter: 60,
        });
      }

      // SECURITY: Don't expose internal error details
      console.error('Translation error:', err);
      return res.status(500).json({
        error: 'Translation service temporarily unavailable. Please try again.',
      });
    }
  }
);

export default router;
