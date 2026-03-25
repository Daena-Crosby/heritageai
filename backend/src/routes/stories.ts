import express, { Request, Response } from 'express';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';

const router = express.Router();

const STORY_SELECT = `
  *,
  storytellers (*),
  translations (*),
  media (*),
  illustrations (*),
  story_tags ( tags (*) )
`;

// Get all stories — visibility filtered by role
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { language, country, storyteller_id, theme, age_group } = req.query;
    const role   = req.user?.role;
    const userId = req.user?.id;

    let query = supabase
      .from('stories')
      .select(STORY_SELECT)
      .order('created_at', { ascending: false });

    if (role === 'admin' || role === 'moderator') {
      // See all stories regardless of status
    } else if (userId) {
      // Authenticated users: approved stories + their own (any status)
      query = (query as any).or(`moderation_status.eq.approved,uploaded_by.eq.${userId}`);
    } else {
      // Guests: approved only
      query = query.eq('moderation_status', 'approved');
    }

    if (language)       query = query.ilike('language', language as string);
    if (country)        query = query.ilike('country', country as string);
    if (storyteller_id) query = query.eq('storyteller_id', storyteller_id as string);
    if (theme)          query = query.ilike('theme', `%${theme}%`);
    if (age_group)      query = query.ilike('age_group', age_group as string);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single story by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Story not found.' });

    const role     = req.user?.role;
    const userId   = req.user?.id;
    const isOwner  = data.uploaded_by === userId;
    const isMod    = role === 'admin' || role === 'moderator';

    if (!isMod && !isOwner && data.moderation_status !== 'approved') {
      return res.status(404).json({ error: 'Story not found.' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update story (owner or mod+)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('stories')
      .select('uploaded_by')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Story not found.' });

    const isMod   = req.user!.role === 'admin' || req.user!.role === 'moderator';
    const isOwner = existing.uploaded_by === req.user!.id;

    if (!isOwner && !isMod) {
      return res.status(403).json({ error: 'Not authorised to edit this story.' });
    }

    // Regular users cannot touch moderation fields
    if (!isMod) {
      delete req.body.moderation_status;
      delete req.body.moderation_note;
      delete req.body.is_published;
      delete req.body.moderated_by;
    }

    const { data, error } = await supabase
      .from('stories')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
