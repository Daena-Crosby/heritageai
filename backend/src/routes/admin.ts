import express, { Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = express.Router();
router.use(requireAuth, requireAdmin);

const roleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
});

// ── User management ──────────────────────────────────────

// GET /api/admin/users — list all users
router.get('/users', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, bio, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// PUT /api/admin/users/:id/role — change a user's role
router.put('/users/:id/role', validate(roleSchema), async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;

  // Prevent self-demotion
  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role: req.body.role })
    .eq('id', targetId)
    .select('id, display_name, role')
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found.' });

  await supabase.from('audit_log').insert({
    user_id: req.user!.id,
    action: 'role_change',
    resource_type: 'user',
    resource_id: targetId,
  });

  res.json({ message: `Role updated to ${req.body.role}.`, user: data });
});

// DELETE /api/admin/users/:id — remove a user
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account here.' });
  }

  // Delete from Supabase Auth (cascades to users table via FK)
  const { error } = await supabase.auth.admin.deleteUser(targetId);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_log').insert({
    user_id: req.user!.id,
    action: 'ban_user',
    resource_type: 'user',
    resource_id: targetId,
  });

  res.json({ message: 'User removed.' });
});

// ── Platform stats ───────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  const [
    { count: totalUsers },
    { count: totalStories },
    { count: pendingStories },
    { count: flaggedComments },
    { count: totalProcessingJobs },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('processing_jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
  ]);

  res.json({
    totalUsers:          totalUsers ?? 0,
    totalStories:        totalStories ?? 0,
    pendingStories:      pendingStories ?? 0,
    flaggedComments:     flaggedComments ?? 0,
    activeProcessingJobs: totalProcessingJobs ?? 0,
  });
});

// ── Audit log ────────────────────────────────────────────

// GET /api/admin/audit-log
router.get('/audit-log', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  const { data, error } = await supabase
    .from('audit_log')
    .select('*, actor:users!audit_log_user_id_fkey(id, display_name, role)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

export default router;
