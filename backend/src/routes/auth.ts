/**
 * SECURITY: Authentication Routes
 *
 * Implements secure authentication with:
 * - Strict rate limiting (10 failed attempts / 15 min)
 * - Input validation on all fields
 * - Timing-safe responses (no email enumeration)
 * - Security event logging
 *
 * OWASP Reference: A07:2021 - Identification and Authentication Failures
 */

import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authLimiter } from '../middleware/rateLimiter';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from '../middleware/validate';
import {
  logAuthSuccess,
  logAuthFailure,
  logAuthLogout,
} from '../middleware/securityLogger';
import { asyncHandler, AuthenticationError, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// SECURITY: Apply auth-specific rate limiting to all routes
router.use(authLimiter);

/**
 * POST /api/auth/register
 * SECURITY: Creates a new user account with validation
 */
router.post('/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] },
    },
  });

  if (error) {
    // SECURITY: Log registration failures
    logAuthFailure(req, email, 'registration_failed');
    throw new ValidationError(error.message);
  }

  // SECURITY: Log successful registration
  if (data.user) {
    logAuthSuccess(req, data.user.id, email);
  }

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    user: { id: data.user?.id, email: data.user?.email },
  });
}));

/**
 * POST /api/auth/login
 * SECURITY: Authenticates user and returns tokens
 */
router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // SECURITY: Log failed login attempt (important for detecting brute-force)
    logAuthFailure(req, email, 'invalid_credentials');

    // SECURITY: Use generic message to prevent username enumeration
    throw new AuthenticationError('Invalid credentials.');
  }

  // Fetch role from users table for immediate frontend use
  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', data.user!.id)
    .single();

  // SECURITY: Log successful login
  logAuthSuccess(req, data.user!.id, email);

  res.json({
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      role: profile?.role ?? 'user',
      display_name: profile?.display_name,
    },
  });
}));

/**
 * POST /api/auth/refresh
 * SECURITY: Rotates tokens to maintain session security
 */
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    // SECURITY: Log token refresh failures
    logAuthFailure(req, 'unknown', 'invalid_refresh_token');
    throw new AuthenticationError('Invalid or expired refresh token.');
  }

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}));

/**
 * POST /api/auth/logout
 * SECURITY: Invalidates session server-side
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    // SECURITY: Server-side token invalidation
    await supabase.auth.admin.signOut(token).catch(() => {
      // Ignore errors - token may already be invalid
    });
  }

  // SECURITY: Log logout event
  logAuthLogout(req);

  res.json({ message: 'Logged out successfully.' });
}));

/**
 * POST /api/auth/reset-password
 * SECURITY: Initiates password reset with timing-safe response
 */
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // SECURITY: Always perform the operation, even if email doesn't exist
  // This prevents email enumeration attacks
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
  });

  // SECURITY: Always return 200 to prevent email enumeration
  // Attacker cannot determine if email exists in system
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
}));

export default router;
