/**
 * SECURITY: Media Routes
 *
 * Implements secure media access with:
 * - UUID validation on story IDs
 * - No sensitive data exposure
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { validate, uuidParamSchema } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();

// SECURITY: Schema for story ID parameter
const storyIdParamSchema = z.object({
  storyId: z.string().uuid('Invalid story ID format'),
});

/**
 * GET /api/media/story/:storyId
 * SECURITY: Get media files for a story
 */
router.get(
  '/story/:storyId',
  validate(storyIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('media')
        // SECURITY: Only select public fields
        .select('id, type, file_url, created_at')
        .eq('story_id', req.params.storyId);

      if (error) throw error;

      res.json(data ?? []);
    } catch (error: any) {
      console.error('Media fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch media.' });
    }
  }
);

export default router;
