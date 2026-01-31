import express, { Request, Response } from 'express';
import { searchStories, getAllStories } from '../services/database';

const router = express.Router();

// Search stories by query
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      // If no query, return all stories with filters
      const filters = {
        language: req.query.language as string | undefined,
        country: req.query.country as string | undefined,
        storyteller_id: req.query.storyteller_id as string | undefined,
        theme: req.query.theme as string | undefined,
        age_group: req.query.age_group as string | undefined,
      };
      
      const stories = await getAllStories(filters);
      return res.json(stories);
    }

    const stories = await searchStories(query);
    res.json(stories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
