import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authLimiter } from '../middleware/rateLimiter';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = express.Router();
router.use(authLimiter);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register a new user
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    user: { id: data.user?.id, email: data.user?.email },
  });
});

// Login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  res.json({
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    user: { id: data.user?.id, email: data.user?.email },
  });
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required.' });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

// Logout (client-side token removal, server-side invalidation)
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await supabase.auth.admin.signOut(token).catch(() => {});
  }
  res.json({ message: 'Logged out successfully.' });
});

// Password reset request
router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Valid email required.' });

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
  });

  // Always return 200 to avoid leaking whether email is registered
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

export default router;
