import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = express.Router();

// GET /api/processing/:storyId — returns current AI pipeline status
router.get('/:storyId', async (req: Request, res: Response) => {
  const { storyId } = req.params;

  const { data, error } = await supabaseAdmin
    .from('processing_jobs')
    .select('id, status, current_step, progress_pct, error_message, created_at, updated_at')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No job record means story was processed before job tracking was added
    // or the story doesn't exist — return a "completed" fallback
    return res.json({ status: 'completed', progress_pct: 100, current_step: null });
  }

  res.json(data);
});

export default router;
