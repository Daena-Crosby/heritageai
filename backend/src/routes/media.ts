import express, { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

const router = express.Router();

// Get media files for a story
router.get('/story/:storyId', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('story_id', req.params.storyId);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
