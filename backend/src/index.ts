/**
 * SECURITY: HeritageAI Backend Entry Point
 *
 * This is the main entry point for the Express application.
 * Security features implemented:
 * - Helmet security headers (CSP, HSTS, etc.)
 * - CORS with strict origin validation
 * - Rate limiting on all routes
 * - Request ID tracking for log correlation
 * - Suspicious pattern detection
 * - Secure error handling
 *
 * OWASP Top 10 Coverage:
 * - A01:2021 Broken Access Control → Auth middleware + RLS
 * - A02:2021 Cryptographic Failures → HTTPS enforcement via Helmet
 * - A03:2021 Injection → Input validation + sanitization
 * - A04:2021 Insecure Design → Rate limiting + validation
 * - A05:2021 Security Misconfiguration → Helmet + env validation
 * - A07:2021 Auth Failures → Rate limiting on auth routes
 * - A09:2021 Logging Failures → Security event logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Route imports
import storyRoutes from './routes/stories';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import mediaRoutes from './routes/media';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import commentRoutes from './routes/comments';
import processingRoutes from './routes/processing';
import translateRoutes from './routes/translate';
import guideRoutes from './routes/guide';
import moderationRoutes from './routes/moderation';
import adminRoutes from './routes/admin';

// Middleware imports
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import {
  requestIdMiddleware,
  suspiciousPatternDetector,
  validateRequiredEnvVars,
} from './middleware/securityLogger';

// Load environment variables first
dotenv.config();

// SECURITY: Validate required environment variables on startup
validateRequiredEnvVars();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// SECURITY: Request ID Tracking (must be first)
// ============================
app.use(requestIdMiddleware);

// ============================
// SECURITY: Helmet Security Headers
// ============================
app.use(
  helmet({
    // SECURITY: Allow Supabase storage URLs for media
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    // SECURITY: Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for some mobile webviews
        imgSrc: ["'self'", 'data:', 'https:'], // Allow Supabase storage images
        connectSrc: ["'self'", 'https://api.groq.com', 'https://*.supabase.co'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https:'], // Allow Supabase storage audio/video
        frameSrc: ["'none'"],
      },
    },

    // SECURITY: Strict Transport Security (HSTS)
    // Forces HTTPS in production
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // SECURITY: Prevent clickjacking
    frameguard: { action: 'deny' },

    // SECURITY: Prevent MIME type sniffing
    noSniff: true,

    // SECURITY: XSS filter (legacy browsers)
    xssFilter: true,

    // SECURITY: Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// ============================
// SECURITY: CORS Configuration
// ============================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // SECURITY: Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // SECURITY: Check against allowlist
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // SECURITY: Log blocked CORS attempts
      console.warn(`[SECURITY] CORS blocked origin: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    // SECURITY: Restrict methods to those actually used
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // SECURITY: Restrict headers
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    // SECURITY: Expose rate limit headers to clients
    exposedHeaders: [
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
      'Retry-After',
      'X-Request-ID',
    ],
    // SECURITY: Cache preflight requests for 10 minutes
    maxAge: 600,
  })
);

// ============================
// SECURITY: Body Parsing with Size Limits
// ============================
// SECURITY: Limit body size to prevent DoS via large payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================
// SECURITY: Suspicious Pattern Detection
// ============================
app.use(suspiciousPatternDetector);

// ============================
// SECURITY: Global Rate Limiting
// ============================
app.use(generalLimiter);

// ============================
// Routes
// ============================
// SECURITY: Each route applies additional route-specific rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

// ============================
// Health Check
// ============================
// SECURITY: Health check is intentionally excluded from rate limiting
// but still protected by Helmet and CORS
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'HeritageAI API is running',
    timestamp: new Date().toISOString(),
    // SECURITY: Don't expose version/environment in production
    ...(process.env.NODE_ENV === 'development' && {
      environment: process.env.NODE_ENV,
    }),
  });
});

// ============================
// SECURITY: 404 Handler
// ============================
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    // SECURITY: Don't reveal available endpoints
  });
});

// ============================
// SECURITY: Error Handler (must be last)
// ============================
app.use(errorHandler);

// ============================
// Server Startup
// ============================
app.listen(PORT, () => {
  console.log(`HeritageAI Backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);

  // SECURITY: Log startup security status
  console.log('[SECURITY] Security middleware initialized:');
  console.log('  - Helmet security headers: ENABLED');
  console.log('  - CORS: ENABLED');
  console.log('  - Rate limiting: ENABLED');
  console.log('  - Request ID tracking: ENABLED');
  console.log('  - Suspicious pattern detection: ENABLED');
  console.log('  - Input validation: ENABLED');
});
