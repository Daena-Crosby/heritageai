/**
 * SECURITY: Comment Routes
 *
 * Implements secure comment handling with:
 * - Rate limiting (30 comments / 5 min)
 * - Input validation and sanitization
 * - Ownership verification for edit/delete
 * - UUID validation for all IDs
 *
 * OWASP References:
 * - A01:2021 - Broken Access Control (ownership checks)
 * - A03:2021 - Injection (input sanitization)
 */

import express, { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { commentLimiter } from '../middleware/rateLimiter';
import { validate, commentSchema, uuidParamSchema } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();

// SECURITY: Apply comment-specific rate limiting to all routes
router.use(commentLimiter);

// SECURITY: Pagination schema for comment listing
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/comments/story/:id
 * SECURITY: Get comments for a story with pagination
 */
router.get(
  '/story/:id',
  validate(uuidParamSchema, 'params'),
  async (req: Request, res: Response) => {
    // SECURITY: Validate pagination parameters
    const pagination = paginationSchema.safeParse(req.query);
    if (!pagination.success) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const { page, limit } = pagination.data;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('comments')
      .select(
        'id, content, created_at, updated_at, users(id, display_name, avatar_url)',
        { count: 'exact' }
      )
      .eq('story_id', req.params.id)
      // SECURITY: Only show non-flagged comments to regular users
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Comment fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch comments.' });
    }

    res.json({
      comments: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }
);

/**
 * POST /api/comments/story/:id
 * SECURITY: Post a comment on a story (authenticated users only)
 */
router.post(
  '/story/:id',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  validate(commentSchema, 'body', { contentFields: ['content'] }),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Verify story exists before allowing comment
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, moderation_status')
      .eq('id', req.params.id)
      .single();

    if (storyError || !story) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    // SECURITY: Only allow comments on approved stories
    if (story.moderation_status !== 'approved') {
      return res.status(403).json({ error: 'Cannot comment on unapproved stories.' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        story_id: req.params.id,
        user_id: req.user!.id,
        content: req.body.content,
      })
      .select('id, content, created_at, users(id, display_name, avatar_url)')
      .single();

    if (error) {
      console.error('Comment insert error:', error);
      return res.status(500).json({ error: 'Failed to post comment.' });
    }

    res.status(201).json(data);
  }
);

/**
 * PATCH /api/comments/:id
 * SECURITY: Update own comment only
 */
router.patch(
  '/:id',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  validate(commentSchema, 'body', { contentFields: ['content'] }),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Only allow updating own comments (enforced in WHERE clause)
    const { data, error } = await supabase
      .from('comments')
      .update({
        content: req.body.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id) // SECURITY: Ownership check
      .select('id, content, updated_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Comment not found or not yours.' });
    }

    res.json(data);
  }
);

/**
 * DELETE /api/comments/:id
 * SECURITY: Delete own comment only
 */
router.delete(
  '/:id',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Only allow deleting own comments (enforced in WHERE clause)
    const { error, count } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id); // SECURITY: Ownership check

    if (error) {
      console.error('Comment delete error:', error);
      return res.status(500).json({ error: 'Failed to delete comment.' });
    }

    // SECURITY: Return 404 if no rows affected (not owner or doesn't exist)
    if (count === 0) {
      return res.status(404).json({ error: 'Comment not found or not yours.' });
    }

    res.json({ message: 'Comment deleted.' });
  }
);

/**
 * POST /api/comments/:id/flag
 * SECURITY: Flag a comment for moderation (any authenticated user)
 */
router.post(
  '/:id/flag',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Verify comment exists
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // SECURITY: Prevent self-flagging
    if (comment.user_id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot flag your own comment.' });
    }

    const { error } = await supabase
      .from('comments')
      .update({ is_flagged: true })
      .eq('id', req.params.id);

    if (error) {
      console.error('Comment flag error:', error);
      return res.status(500).json({ error: 'Failed to flag comment.' });
    }

    res.json({ message: 'Comment flagged for review.' });
  }
);

export default router;
