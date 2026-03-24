import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Reusable validator factory — pass a Zod schema, get a middleware
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    (req as any)[source] = result.data;
    next();
  };
};

// ============================
// Schemas
// ============================

export const storyUploadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  storytellerName: z.string().min(1).max(100).optional(),
  storytellerLocation: z.string().max(100).optional(),
  storytellerDialect: z.string().max(50).optional(),
  ageGroup: z.enum(['children', 'teens', 'general']).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(100).optional(),
  theme: z.string().max(100).optional(),
});

export const storyUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  age_group: z.enum(['children', 'teens', 'general']).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(100).optional(),
  theme: z.string().max(100).optional(),
  is_published: z.boolean().optional(),
});

export const storyQuerySchema = z.object({
  language: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  theme: z.string().max(100).optional(),
  age_group: z.enum(['children', 'teens', 'general']).optional(),
  storyteller_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  language: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  theme: z.string().max(100).optional(),
  age_group: z.enum(['children', 'teens', 'general']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
