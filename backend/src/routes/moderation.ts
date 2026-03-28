/**
 * SECURITY: Moderation Routes
 *
 * Implements secure moderation with:
 * - Strict role-based access (moderator/admin only)
 * - Sensitive operation rate limiting
 * - Audit logging for all actions
 * - UUID validation on all parameters
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Response } from 'express';
import { requireAuth, requireModerator, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import { sensitiveLimiter } from '../middleware/rateLimiter';
import { validate, rejectSchema, uuidParamSchema } from '../middleware/validate';
import { logAdminAction } from '../middleware/securityLogger';

const router = express.Router();

// SECURITY: All moderation routes require authentication + moderator role
router.use(requireAuth, requireModerator);

// SECURITY: Apply sensitive operation rate limiting
router.use(sensitiveLimiter);

// ============================
// Stories Queue
// ============================

/**
 * GET /api/moderation/queue
 * SECURITY: Get all pending stories for moderation
 */
router.get('/queue', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .select(
      '*, storytellers(*), uploaded_by_user:users!stories_uploaded_by_fkey(id, display_name, role)'
    )
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Moderation queue error:', error);
    return res.status(500).json({ error: 'Failed to fetch moderation queue.' });
  }

  res.json(data ?? []);
});

/**
 * GET /api/moderation/stories
 * SECURITY: Get all stories with moderation status overview
 */
router.get('/stories', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .select(
      'id, title, moderation_status, moderation_note, is_published, created_at, country, theme, uploaded_by, storytellers(name)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Moderation stories error:', error);
    return res.status(500).json({ error: 'Failed to fetch stories.' });
  }

  res.json(data ?? []);
});

/**
 * POST /api/moderation/stories/:id/approve
 * SECURITY: Approve a story and publish it
 */
router.post(
  '/stories/:id/approve',
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    const storyId = req.params.id;

    const { data, error } = await supabase
      .from('stories')
      .update({
        moderation_status: 'approved',
        is_published: true,
        moderation_note: null,
        moderated_by: req.user!.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('Story approve error:', error);
      return res.status(500).json({ error: 'Failed to approve story.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    // SECURITY: Audit log for moderation action
    await supabase.from('audit_log').insert({
      user_id: req.user!.id,
      action: 'approve_story',
      resource_type: 'story',
      resource_id: storyId,
    });

    // SECURITY: Log admin action
    logAdminAction(req, 'approve_story', 'story', storyId);

    res.json({ message: 'Story approved.', story: data });
  }
);

/**
 * POST /api/moderation/stories/:id/reject
 * SECURITY: Reject a story with optional note
 */
router.post(
  '/stories/:id/reject',
  validate(uuidParamSchema, 'params'),
  validate(rejectSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const storyId = req.params.id;

    const { data, error } = await supabase
      .from('stories')
      .update({
        moderation_status: 'rejected',
        is_published: false,
        moderation_note: req.body.note ?? null,
        moderated_by: req.user!.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('Story reject error:', error);
      return res.status(500).json({ error: 'Failed to reject story.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    // SECURITY: Audit log for moderation action
    await supabase.from('audit_log').insert({
      user_id: req.user!.id,
      action: 'reject_story',
      resource_type: 'story',
      resource_id: storyId,
    });

    // SECURITY: Log admin action
    logAdminAction(req, 'reject_story', 'story', storyId);

    res.json({ message: 'Story rejected.', story: data });
  }
);

// ============================
// Comments Moderation
// ============================

/**
 * GET /api/moderation/flagged-comments
 * SECURITY: Get all flagged comments for review
 */
router.get('/flagged-comments', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('comments')
    .select(
      '*, stories(id, title), commenter:users!comments_user_id_fkey(id, display_name)'
    )
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Flagged comments error:', error);
    return res.status(500).json({ error: 'Failed to fetch flagged comments.' });
  }

  res.json(data ?? []);
});

/**
 * DELETE /api/moderation/comments/:id
 * SECURITY: Remove a flagged comment
 */
router.delete(
  '/comments/:id',
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    const commentId = req.params.id;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Comment delete error:', error);
      return res.status(500).json({ error: 'Failed to delete comment.' });
    }

    // SECURITY: Audit log
    await supabase.from('audit_log').insert({
      user_id: req.user!.id,
      action: 'delete',
      resource_type: 'comment',
      resource_id: commentId,
    });

    // SECURITY: Log admin action
    logAdminAction(req, 'delete_comment', 'comment', commentId);

    res.json({ message: 'Comment deleted.' });
  }
);

/**
 * POST /api/moderation/comments/:id/dismiss
 * SECURITY: Clear the flag on a comment
 */
router.post(
  '/comments/:id/dismiss',
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    const commentId = req.params.id;

    const { error } = await supabase
      .from('comments')
      .update({ is_flagged: false })
      .eq('id', commentId);

    if (error) {
      console.error('Comment dismiss error:', error);
      return res.status(500).json({ error: 'Failed to dismiss flag.' });
    }

    // SECURITY: Log admin action (no audit log for flag dismissal as it's minor)
    logAdminAction(req, 'dismiss_flag', 'comment', commentId);

    res.json({ message: 'Flag dismissed.' });
  }
);

export default router;
