# HeritageAI Setup Guide

Complete setup instructions for the HeritageAI project.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (already configured)
- Hugging Face account with API token
- FFMPEG installed (for video generation on backend)

## Quick Setup

### 1. Install Dependencies

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Manual:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```env
SUPABASE_URL=https://ohagqabkblscgbgaeknk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
HUGGINGFACE_API_TOKEN=your_token_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
```

#### Frontend (`frontend/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://ohagqabkblscgbgaeknk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `backend/database/schema.sql`
4. Create a storage bucket named `media` with public access

### 4. Get Hugging Face API Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new token with read permissions
3. Add it to `backend/.env` as `HUGGINGFACE_API_TOKEN`

### 5. Install FFMPEG (Backend Only)

**Windows:**
- Download from https://ffmpeg.org/download.html
- Add to PATH

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

The API will run on `http://localhost:3000`

### Start Frontend

```bash
cd frontend
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
heritageai/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/      # Supabase configuration
│   │   ├── services/    # Business logic (AI, database, storage, video)
│   │   └── routes/      # API endpoints
│   ├── database/        # SQL schema
│   └── package.json
├── frontend/            # React Native Expo app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── screens/    # Screen components
│   │   ├── services/   # API client
│   │   └── config/      # Configuration
│   └── package.json
└── README.md
```

## Testing

1. **Test Backend API:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test Story Upload:**
   - Use the Recording screen in the app
   - Record or upload an audio file
   - Fill in metadata
   - Upload and wait for processing

3. **Test Story Viewing:**
   - Browse stories on Home screen
   - Tap a story to view
   - Switch between Storybook and Video modes

## Troubleshooting

### Backend Issues

- **Port already in use:** Change `PORT` in `backend/.env`
- **Supabase connection error:** Check your Supabase URL and anon key
- **Hugging Face API error:** Verify your API token is valid
- **FFMPEG not found:** Install FFMPEG and ensure it's in PATH

### Frontend Issues

- **Cannot connect to backend:** 
  - Ensure backend is running
  - Check `EXPO_PUBLIC_API_URL` matches backend URL
  - For physical device, use your computer's IP address instead of localhost

- **Audio recording not working:**
  - Check app permissions (microphone)
  - For iOS, ensure Info.plist has microphone permission

### Database Issues

- **Tables not found:** Run the SQL schema in Supabase SQL Editor
- **Storage bucket not found:** Create `media` bucket in Supabase Storage

## Next Steps

1. Add your Hugging Face API token
2. Set up Supabase storage bucket
3. Run database migrations
4. Start backend and frontend
5. Test with sample audio files

## Free Hosting Options

For backend hosting (free tier):
- **Railway:** https://railway.app
- **Render:** https://render.com
- **Fly.io:** https://fly.io

Update `EXPO_PUBLIC_API_URL` in frontend `.env` with your hosted backend URL.
