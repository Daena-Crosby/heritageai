import express, { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validate, commentSchema, uuidParamSchema } from '../middleware/validate';

const router = express.Router();

// Get comments for a story
router.get('/story/:id', validate(uuidParamSchema, 'params'), async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('comments')
    .select('id, content, created_at, updated_at, users(id, display_name, avatar_url)', { count: 'exact' })
    .eq('story_id', req.params.id)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'Failed to fetch comments.' });
  res.json({ comments: data, total: count, page, limit });
});

// Post a comment on a story
router.post('/story/:id', requireAuth, validate(uuidParamSchema, 'params'), validate(commentSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      story_id: req.params.id,
      user_id: req.user!.id,
      content: req.body.content,
    })
    .select('id, content, created_at, users(id, display_name, avatar_url)')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to post comment.' });
  res.status(201).json(data);
});

// Update own comment
router.patch('/:id', requireAuth, validate(commentSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('comments')
    .update({ content: req.body.content })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select('id, content, updated_at')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Comment not found or not yours.' });
  res.json(data);
});

// Delete own comment
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(404).json({ error: 'Comment not found or not yours.' });
  res.json({ message: 'Comment deleted.' });
});

// Flag a comment (any authenticated user)
router.post('/:id/flag', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('comments')
    .update({ is_flagged: true })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: 'Failed to flag comment.' });
  res.json({ message: 'Comment flagged for review.' });
});

export default router;
