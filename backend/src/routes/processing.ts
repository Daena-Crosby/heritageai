/**
 * SECURITY: Processing Status Routes
 *
 * Implements secure processing status access with:
 * - UUID validation on story IDs
 * - Safe defaults for missing data
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();

// SECURITY: Schema for story ID parameter
const storyIdParamSchema = z.object({
  storyId: z.string().uuid('Invalid story ID format'),
});

/**
 * GET /api/processing/:storyId
 * SECURITY: Get AI pipeline status for a story
 */
router.get(
  '/:storyId',
  validate(storyIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const { storyId } = req.params;

    try {
      const { data, error } = await supabaseAdmin
        .from('processing_jobs')
        // SECURITY: Only select non-sensitive fields
        .select('id, status, current_step, progress_pct, error_message, created_at, updated_at')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No job record means story was processed before job tracking was added
        // or the story doesn't exist — return a "completed" fallback
        // SECURITY: Don't reveal whether the story exists
        return res.json({
          status: 'completed',
          progress_pct: 100,
          current_step: null,
        });
      }

      // SECURITY: Don't expose full error messages in production
      const sanitizedData = {
        ...data,
        error_message:
          process.env.NODE_ENV === 'development'
            ? data.error_message
            : data.error_message
            ? 'Processing failed. Please try again.'
            : null,
      };

      res.json(sanitizedData);
    } catch (error: any) {
      console.error('Processing status error:', error);
      res.status(500).json({ error: 'Failed to fetch processing status.' });
    }
  }
);

export default router;
