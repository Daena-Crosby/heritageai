import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import storyRoutes from './routes/stories';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import mediaRoutes from './routes/media';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/stories', storyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HeritageAI API is running' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 HeritageAI Backend running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
});
