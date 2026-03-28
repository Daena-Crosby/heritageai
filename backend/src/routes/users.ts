/**
 * SECURITY: User Profile Routes
 *
 * Implements secure user profile management with:
 * - Authentication required for own profile access
 * - Input validation on profile updates
 * - UUID validation on user IDs
 * - Pagination on list endpoints
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 */

import express, { Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate, uuidParamSchema, sanitizeHtml } from '../middleware/validate';

const router = express.Router();

// SECURITY: Profile update schema with sanitization and length limits
const profileUpdateSchema = z
  .object({
    display_name: z
      .string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be 50 characters or less')
      .transform((val) => val.trim())
      .optional(),
    bio: z
      .string()
      .max(500, 'Bio must be 500 characters or less')
      .transform((val) => val.trim())
      .optional(),
    avatar_url: z
      .string()
      .url('Invalid avatar URL')
      .max(500, 'Avatar URL too long')
      .optional(),
  })
  .strict(); // SECURITY: Reject unexpected fields

// SECURITY: Pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/users/me
 * SECURITY: Get current user's profile (authenticated only)
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    // SECURITY: Explicitly select only needed fields
    .select('id, display_name, avatar_url, bio, role, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Profile not found.' });
  }

  res.json(data);
});

/**
 * PATCH /api/users/me
 * SECURITY: Update current user's profile (authenticated only)
 */
router.patch(
  '/me',
  requireAuth,
  validate(profileUpdateSchema, 'body', { contentFields: ['bio'] }),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Only allow updating own profile
    const { data, error } = await supabase
      .from('users')
      .update({
        ...req.body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user!.id)
      .select('id, display_name, avatar_url, bio, role, updated_at')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile.' });
    }

    res.json(data);
  }
);

/**
 * GET /api/users/:id
 * SECURITY: Get a user's public profile by ID
 */
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  async (req: express.Request, res: Response) => {
    const { data, error } = await supabase
      .from('users')
      // SECURITY: Only expose public profile fields
      .select('id, display_name, avatar_url, bio, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(data);
  }
);

/**
 * GET /api/users/me/stories
 * SECURITY: Get stories uploaded by the current user
 */
router.get('/me/stories', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // SECURITY: Validate pagination
  const pagination = paginationSchema.safeParse(req.query);
  if (!pagination.success) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  const { page, limit } = pagination.data;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('stories')
    .select('*, storytellers(name, location)', { count: 'exact' })
    .eq('uploaded_by', req.user!.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('User stories error:', error);
    return res.status(500).json({ error: 'Failed to fetch stories.' });
  }

  res.json({
    stories: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
});

/**
 * GET /api/users/me/favorites
 * SECURITY: Get current user's favorite stories
 */
router.get('/me/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      'created_at, stories(id, title, theme, language, country, age_group, created_at, storytellers(name))'
    )
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Favorites error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites.' });
  }

  res.json(data?.map((f) => ({ ...f.stories, favoritedAt: f.created_at })) ?? []);
});

/**
 * POST /api/users/me/favorites/:storyId
 * SECURITY: Add a story to favorites
 */
router.post(
  '/me/favorites/:storyId',
  requireAuth,
  validate(z.object({ storyId: z.string().uuid('Invalid story ID') }), 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    // SECURITY: Verify story exists and is accessible
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, moderation_status')
      .eq('id', req.params.storyId)
      .single();

    if (storyError || !story) {
      return res.status(404).json({ error: 'Story not found.' });
    }

    // SECURITY: Only allow favoriting approved stories
    if (story.moderation_status !== 'approved') {
      return res.status(403).json({ error: 'Cannot favorite unapproved stories.' });
    }

    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: req.user!.id, story_id: req.params.storyId });

    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Already in favorites.' });
    }

    if (error) {
      console.error('Add favorite error:', error);
      return res.status(500).json({ error: 'Failed to add favorite.' });
    }

    res.status(201).json({ message: 'Added to favorites.' });
  }
);

/**
 * DELETE /api/users/me/favorites/:storyId
 * SECURITY: Remove a story from favorites
 */
router.delete(
  '/me/favorites/:storyId',
  requireAuth,
  validate(z.object({ storyId: z.string().uuid('Invalid story ID') }), 'params'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('story_id', req.params.storyId);

    if (error) {
      console.error('Remove favorite error:', error);
      return res.status(500).json({ error: 'Failed to remove favorite.' });
    }

    res.json({ message: 'Removed from favorites.' });
  }
);

export default router;
