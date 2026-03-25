import express, { Response } from 'express';
import { requireAuth, requireModerator, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = express.Router();
router.use(requireAuth, requireModerator);

const rejectSchema = z.object({
  note: z.string().min(1).max(500).optional(),
});

// ── Stories queue ────────────────────────────────────────

// GET /api/moderation/queue — all pending stories
router.get('/queue', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*, storytellers(*), uploaded_by_user:users!stories_uploaded_by_fkey(id, display_name, role)')
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/moderation/stories — all stories with status (for full overview)
router.get('/stories', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, moderation_status, moderation_note, is_published, created_at, country, theme, uploaded_by, storytellers(name)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/moderation/stories/:id/approve
router.post('/stories/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .update({
      moderation_status: 'approved',
      is_published: true,
      moderation_note: null,
      moderated_by: req.user!.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Story not found.' });

  // Audit
  await supabase.from('audit_log').insert({
    user_id: req.user!.id,
    action: 'approve_story',
    resource_type: 'story',
    resource_id: req.params.id,
  });

  res.json({ message: 'Story approved.', story: data });
});

// POST /api/moderation/stories/:id/reject
router.post('/stories/:id/reject', validate(rejectSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('stories')
    .update({
      moderation_status: 'rejected',
      is_published: false,
      moderation_note: req.body.note ?? null,
      moderated_by: req.user!.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Story not found.' });

  await supabase.from('audit_log').insert({
    user_id: req.user!.id,
    action: 'reject_story',
    resource_type: 'story',
    resource_id: req.params.id,
  });

  res.json({ message: 'Story rejected.', story: data });
});

// ── Comments ─────────────────────────────────────────────

// GET /api/moderation/flagged-comments
router.get('/flagged-comments', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, stories(id, title), commenter:users!comments_user_id_fkey(id, display_name)')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// DELETE /api/moderation/comments/:id — remove a flagged comment
router.delete('/comments/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_log').insert({
    user_id: req.user!.id,
    action: 'delete',
    resource_type: 'comment',
    resource_id: req.params.id,
  });

  res.json({ message: 'Comment deleted.' });
});

// POST /api/moderation/comments/:id/dismiss — clear the flag
router.post('/comments/:id/dismiss', async (_req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('comments')
    .update({ is_flagged: false })
    .eq('id', _req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Flag dismissed.' });
});

export default router;
