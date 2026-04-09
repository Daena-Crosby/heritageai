/**
 * SECURITY: Cultural Guide Route
 *
 * Implements secure AI chat with:
 * - Rate limiting (20 AI requests / min)
 * - Message array validation
 * - Content length limits per message
 * - Message history limits (max 20)
 *
 * OWASP Reference: A04:2021 - Insecure Design (API Rate Limiting)
 */

import { Router, Request, Response } from 'express';
import { getCulturalGuideResponse, GuideMessage } from '../services/ai';
import { aiLimiter } from '../middleware/rateLimiter';
import { validate, guideSchema } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// SECURITY: Apply AI-specific rate limiting
router.use(aiLimiter);

/**
 * POST /api/guide
 * SECURITY: Get AI response for cultural guide conversation
 *
 * Body: { messages: Array<{ role: 'user' | 'assistant', content: string }> }
 * Returns: { reply: string }
 */
router.post(
  '/',
  validate(guideSchema, 'body', { contentFields: ['content'] }),
  asyncHandler(async (req: Request, res: Response) => {
    const { messages } = req.body;

    // SECURITY: Limit message history to prevent context exploitation
    // This is validated by schema (max 20) but we also apply server-side limit
    const trimmed: GuideMessage[] = messages.slice(-10);

    // Errors are handled by handleExternalApiError in ai.ts and centralized error handler
    const reply = await getCulturalGuideResponse(trimmed);

    res.json({ reply });
  })
);

export default router;
