import express, { Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = express.Router();

const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

// Get current user's profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, bio, role, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found.' });
  res.json(data);
});

// Update current user's profile
router.patch('/me', requireAuth, validate(profileUpdateSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .update(req.body)
    .eq('id', req.user!.id)
    .select('id, display_name, avatar_url, bio, role, updated_at')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update profile.' });
  res.json(data);
});

// Get a user's public profile by ID
router.get('/:id', async (req: express.Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, bio, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found.' });
  res.json(data);
});

// Get stories uploaded by the current user
router.get('/me/stories', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('stories')
    .select('*, storytellers(name, location)', { count: 'exact' })
    .eq('uploaded_by', req.user!.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'Failed to fetch stories.' });
  res.json({ stories: data, total: count, page, limit });
});

// Get current user's favorites
router.get('/me/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('created_at, stories(id, title, theme, language, country, age_group, created_at, storytellers(name))')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch favorites.' });
  res.json(data?.map(f => ({ ...f.stories, favoritedAt: f.created_at })) ?? []);
});

// Add a story to favorites
router.post('/me/favorites/:storyId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: req.user!.id, story_id: req.params.storyId });

  if (error?.code === '23505') return res.status(409).json({ error: 'Already in favorites.' });
  if (error) return res.status(500).json({ error: 'Failed to add favorite.' });
  res.status(201).json({ message: 'Added to favorites.' });
});

// Remove a story from favorites
router.delete('/me/favorites/:storyId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('story_id', req.params.storyId);

  if (error) return res.status(500).json({ error: 'Failed to remove favorite.' });
  res.json({ message: 'Removed from favorites.' });
});

export default router;
