import express, { Request, Response } from 'express';
import {
  createStory,
  getStory,
  getAllStories,
  updateStory,
} from '../services/database';

const router = express.Router();

// Get all stories with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      language: req.query.language as string | undefined,
      country: req.query.country as string | undefined,
      storyteller_id: req.query.storyteller_id as string | undefined,
      theme: req.query.theme as string | undefined,
      age_group: req.query.age_group as string | undefined,
    };

    const stories = await getAllStories(filters);
    res.json(stories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single story by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const story = await getStory(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    res.json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new story
router.post('/', async (req: Request, res: Response) => {
  try {
    const story = await createStory(req.body);
    res.status(201).json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update story
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const story = await updateStory(req.params.id, req.body);
    res.json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
