# HeritageAI Backend

Node.js + Express API server for HeritageAI application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `HUGGINGFACE_API_TOKEN`: Your Hugging Face API token
- `PORT`: Server port (default: 3000)

4. Run development server:
```bash
npm run dev
```

## API Endpoints

### Stories
- `GET /api/stories` - Get all stories (with optional filters)
- `GET /api/stories/:id` - Get single story
- `POST /api/stories` - Create new story
- `PATCH /api/stories/:id` - Update story

### Upload
- `POST /api/upload/audio` - Upload audio file and process story
  - Body: FormData with `audio` file and metadata fields

### Search
- `GET /api/search?q=query` - Search stories by query
- `GET /api/search?language=...&theme=...` - Filter stories

### Media
- `GET /api/media/story/:storyId` - Get media files for a story

## Services

- **Database**: Supabase PostgreSQL operations
- **Storage**: Supabase Storage for audio/video/images
- **AI**: Whisper transcription, Hugging Face translation & image generation
- **Video**: FFMPEG video generation with illustrations

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
