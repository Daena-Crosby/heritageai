/**
 * SECURITY: Admin Routes
 *
 * Implements secure admin operations with:
 * - Strict admin-only access
 * - Sensitive operation rate limiting
 * - Self-action prevention (can't demote/delete self)
 * - Comprehensive audit logging
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import { sensitiveLimiter } from '../middleware/rateLimiter';
import {
  validate,
  roleSchema,
  uuidParamSchema,
  auditLogQuerySchema,
} from '../middleware/validate';
import { logAdminAction } from '../middleware/securityLogger';

const router = express.Router();

// SECURITY: All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// SECURITY: Apply sensitive operation rate limiting
router.use(sensitiveLimiter);

// ============================
// User Management
// ============================

/**
 * GET /api/admin/users
 * SECURITY: List all users (admin only)
 */
router.get('/users', async (_req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    // SECURITY: Explicitly select fields - don't expose all columns
    .select('id, display_name, bio, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }

  res.json(data ?? []);
});

/**
 * PUT /api/admin/users/:id/role
 * SECURITY: Change a user's role (with self-demotion prevention)
 */
router.put(
  '/users/:id/role',
  validate(uuidParamSchema, 'params'),
  validate(roleSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const targetId = req.params.id;

    // SECURITY: Prevent self-demotion (admin locking themselves out)
    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role: req.body.role })
      .eq('id', targetId)
      .select('id, display_name, role')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // SECURITY: Audit log
    await supabase.from('audit_log').insert({
      user_id: req.user!.id,
      action: 'role_change',
      resource_type: 'user',
      resource_id: targetId,
    });

    // SECURITY: Log admin action
    logAdminAction(req, `role_change:${req.body.role}`, 'user', targetId);

    res.json({ message: `Role updated to ${req.body.role}.`, user: data });
  }
);

/**
 * DELETE /api/admin/users/:id
 * SECURITY: Remove a user (with self-deletion prevention)
 */
router.delete(
  '/users/:id',
  validate(uuidParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    const targetId = req.params.id;

    // SECURITY: Prevent self-deletion (admin deleting themselves)
    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own account here.' });
    }

    // SECURITY: Delete from Supabase Auth (cascades to users table via FK)
    const { error } = await supabase.auth.admin.deleteUser(targetId);

    if (error) {
      console.error('User delete error:', error);
      return res.status(500).json({ error: 'Failed to delete user.' });
    }

    // SECURITY: Audit log
    await supabase.from('audit_log').insert({
      user_id: req.user!.id,
      action: 'ban_user',
      resource_type: 'user',
      resource_id: targetId,
    });

    // SECURITY: Log admin action
    logAdminAction(req, 'delete_user', 'user', targetId);

    res.json({ message: 'User removed.' });
  }
);

// ============================
// Platform Statistics
// ============================

/**
 * GET /api/admin/stats
 * SECURITY: Get platform statistics (admin only)
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      { count: totalUsers },
      { count: totalStories },
      { count: pendingStories },
      { count: flaggedComments },
      { count: totalProcessingJobs },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending'),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_flagged', true),
      supabase
        .from('processing_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']),
    ]);

    res.json({
      totalUsers: totalUsers ?? 0,
      totalStories: totalStories ?? 0,
      pendingStories: pendingStories ?? 0,
      flaggedComments: flaggedComments ?? 0,
      activeProcessingJobs: totalProcessingJobs ?? 0,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

// ============================
// Audit Log
// ============================

/**
 * GET /api/admin/audit-log
 * SECURITY: Get audit log with pagination (admin only)
 */
router.get(
  '/audit-log',
  validate(auditLogQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };

    const { data, error, count } = await supabase
      .from('audit_log')
      .select(
        '*, actor:users!audit_log_user_id_fkey(id, display_name, role)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Audit log error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit log.' });
    }

    res.json({
      entries: data ?? [],
      total: count,
      limit,
      offset,
    });
  }
);

export default router;
