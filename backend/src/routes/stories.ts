/**
 * SECURITY: Story Routes
 *
 * Implements secure story access with:
 * - Role-based visibility (guests, users, moderators, admins)
 * - Ownership verification for edits
 * - Input validation on all updates
 * - Query parameter sanitization
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Response } from 'express';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';
import {
  validate,
  storyQuerySchema,
  storyUpdateSchema,
  uuidParamSchema,
} from '../middleware/validate';
import { asyncHandler, NotFoundError, AuthorizationError } from '../middleware/errorHandler';

const router = express.Router();

// SECURITY: Select statement for story queries (no sensitive fields)
const STORY_SELECT = `
  *,
  storytellers (*),
  translations (*),
  media (*),
  illustrations (*),
  story_tags ( tags (*) )
`;

/**
 * GET /api/stories
 * SECURITY: Get all stories with role-based visibility filtering
 */
router.get(
  '/',
  optionalAuth,
  validate(storyQuerySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { language, country, storyteller_id, theme, age_group, page, limit } =
      req.query as unknown as {
        language?: string;
        country?: string;
        storyteller_id?: string;
        theme?: string;
        age_group?: string;
        page: number;
        limit: number;
      };

    const role = req.user?.role;
    const userId = req.user?.id;

    let query = supabase
      .from('stories')
      .select(STORY_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false });

    // SECURITY: Role-based visibility filtering
    if (role === 'admin' || role === 'moderator') {
      // Moderators and admins see all stories
    } else if (userId) {
      // SECURITY: Authenticated users see approved stories + their own
      query = (query as any).or(
        `moderation_status.eq.approved,uploaded_by.eq.${userId}`
      );
    } else {
      // SECURITY: Guests see only approved stories
      query = query.eq('moderation_status', 'approved');
    }

    // SECURITY: Apply validated filters (already sanitized)
    if (language) query = query.ilike('language', language);
    if (country) query = query.ilike('country', country);
    if (storyteller_id) query = query.eq('storyteller_id', storyteller_id);
    if (theme) query = query.ilike('theme', `%${theme}%`);
    if (age_group) query = query.ilike('age_group', age_group);

    // SECURITY: Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      stories: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  })
);

/**
 * GET /api/stories/:id
 * SECURITY: Get single story with access control
 */
router.get(
  '/:id',
  optionalAuth,
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Story not found.');
    }

    const role = req.user?.role;
    const userId = req.user?.id;
    const isOwner = data.uploaded_by === userId;
    const isMod = role === 'admin' || role === 'moderator';

    // SECURITY: Check access permissions
    if (!isMod && !isOwner && data.moderation_status !== 'approved') {
      // Don't reveal that the story exists but is not approved
      throw new NotFoundError('Story not found.');
    }

    res.json(data);
  })
);

/**
 * PATCH /api/stories/:id
 * SECURITY: Update story (owner or moderator only)
 */
router.patch(
  '/:id',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  validate(storyUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Fetch story to check ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('stories')
      .select('uploaded_by')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) {
      throw new NotFoundError('Story not found.');
    }

    const isMod = req.user!.role === 'admin' || req.user!.role === 'moderator';
    const isOwner = existing.uploaded_by === req.user!.id;

    // SECURITY: Authorization check
    if (!isOwner && !isMod) {
      throw new AuthorizationError('Not authorized to edit this story.');
    }

    // SECURITY: Regular users cannot modify moderation fields
    const updateData = { ...req.body };
    if (!isMod) {
      delete updateData.moderation_status;
      delete updateData.moderation_note;
      delete updateData.is_published;
      delete updateData.moderated_by;
      delete updateData.moderated_at;
    }

    // SECURITY: Normalize theme to lowercase
    if (updateData.theme) {
      updateData.theme = updateData.theme.toLowerCase().trim();
    }

    const { data, error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  })
);

export default router;
