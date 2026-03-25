import { Router, Request, Response } from 'express';
import { getCulturalGuideResponse, GuideMessage } from '../services/ai';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/guide
 * Body: { messages: Array<{ role: 'user' | 'assistant', content: string }> }
 * Returns: { reply: string }
 */
router.post('/', searchLimiter, async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'Each message must have role "user" or "assistant"' });
    }
    if (typeof msg.content !== 'string' || !msg.content.trim()) {
      return res.status(400).json({ error: 'Each message must have a non-empty content string' });
    }
  }

  // Keep last 10 messages to avoid hitting context limits
  const trimmed: GuideMessage[] = messages.slice(-10);

  try {
    const reply = await getCulturalGuideResponse(trimmed);
    return res.json({ reply });
  } catch (err: any) {
    const msg = err?.message || 'Guide unavailable';
    if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }
    return res.status(500).json({ error: msg });
  }
});

export default router;
