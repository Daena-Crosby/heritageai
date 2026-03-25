import { Router, Request, Response } from 'express';
import { translateDialectText } from '../services/ai';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

const SUPPORTED_DIALECTS = [
  'Jamaican Patois',
  'Trinidadian Slang',
  'Nigerian Pidgin',
  'Louisiana Creole',
  'Haitian Kreyòl',
];

/**
 * POST /api/translate
 * Body: { text: string, sourceDialect: string }
 * Returns: { translation: string, sourceDialect: string }
 */
router.post('/', searchLimiter, async (req: Request, res: Response) => {
  const { text, sourceDialect } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!sourceDialect || !SUPPORTED_DIALECTS.includes(sourceDialect)) {
    return res.status(400).json({
      error: `sourceDialect must be one of: ${SUPPORTED_DIALECTS.join(', ')}`,
    });
  }
  if (text.trim().length > 2000) {
    return res.status(400).json({ error: 'text must be 2000 characters or fewer' });
  }

  try {
    const result = await translateDialectText(text.trim(), sourceDialect);
    return res.json({ translation: result.translation, sourceDialect });
  } catch (err: any) {
    const msg = err?.message || 'Translation failed';
    if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }
    return res.status(500).json({ error: msg });
  }
});

export default router;
