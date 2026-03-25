import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// Security Headers
// ============================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Supabase storage URLs
}));

// ============================
// CORS
// ============================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ============================
// Body Parsing
// ============================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================
// Global Rate Limiting
// ============================
app.use(generalLimiter);

// ============================
// Routes
// ============================
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

// Health check (excluded from rate limiting intentionally)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'HeritageAI API is running', timestamp: new Date().toISOString() });
});

// ============================
// Error Handler (must be last)
// ============================
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`HeritageAI Backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
