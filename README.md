# HeritageAI

A mobile-first application designed to preserve Jamaican oral histories, folklore, and dialects. It empowers elders to record stories in their native dialects and makes them accessible to children and cultural communities through searchable archives, interactive storybooks, and auto-generated videos.

## Project Structure

```
heritageai/
├── frontend/          # React Native Expo app
├── backend/           # Node.js Express API
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend:** React Native + Expo + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **AI/NLP:** 
  - Whisper (speech-to-text)
  - Hugging Face (translation & image generation)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Hugging Face account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Add your environment variables
npm start
```

## Environment Variables

### Backend (.env)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `HUGGINGFACE_API_TOKEN`
- `PORT`

### Frontend (.env)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

## Features

- ✅ Audio recording and upload
- ✅ Speech-to-text transcription (Whisper)
- ✅ Dialect to English translation (Hugging Face)
- ✅ Storybook mode with auto-generated illustrations
- ✅ Video mode with audio narration
- ✅ Searchable archive with filters
- ✅ Offline downloads

## Development

See individual README files in `frontend/` and `backend/` directories for detailed setup instructions.
