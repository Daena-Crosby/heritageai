/**
 * SECURITY: Search Routes
 *
 * Implements secure search with:
 * - Rate limiting (60 req/min)
 * - Input validation and sanitization
 * - Query parameter length limits
 * - Pagination limits to prevent resource exhaustion
 *
 * OWASP Reference: A03:2021 - Injection (Search Injection Prevention)
 */

import express, { Request, Response } from 'express';
import { searchStories, getAllStories } from '../services/database';
import { searchLimiter } from '../middleware/rateLimiter';
import { validate, searchQuerySchema } from '../middleware/validate';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// SECURITY: Apply search-specific rate limiting
router.use(searchLimiter);

/**
 * GET /api/search
 * SECURITY: Search stories with validated query parameters
 */
router.get(
  '/',
  optionalAuth,
  validate(searchQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { q, language, country, theme, age_group, page, limit } = req.query as unknown as {
        q?: string;
        language?: string;
        country?: string;
        theme?: string;
        age_group?: string;
        page: number;
        limit: number;
      };

      // SECURITY: Query is already sanitized by validation middleware

      if (!q) {
        // No query - return filtered stories with pagination
        const filters = {
          language,
          country,
          storyteller_id: undefined,
          theme,
          age_group,
        };

        const stories = (await getAllStories(filters)) ?? [];

        // SECURITY: Apply pagination server-side
        const startIndex = (page - 1) * limit;
        const paginatedStories = stories.slice(startIndex, startIndex + limit);

        return res.json({
          stories: paginatedStories,
          total: stories.length,
          page,
          limit,
          totalPages: Math.ceil(stories.length / limit),
        });
      }

      // SECURITY: Search with validated and sanitized query
      const stories = (await searchStories(q)) ?? [];

      // SECURITY: Apply pagination server-side
      const startIndex = (page - 1) * limit;
      const paginatedStories = stories.slice(startIndex, startIndex + limit);

      res.json({
        stories: paginatedStories,
        total: stories.length,
        page,
        limit,
        totalPages: Math.ceil(stories.length / limit),
      });
    } catch (error: any) {
      // SECURITY: Don't expose internal error details
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed. Please try again.' });
    }
  }
);

export default router;
