# HeritageAI Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] Supabase account (already configured ✅)
- [ ] Hugging Face account (need API token)

## Step 1: Install Dependencies (2 minutes)

**Windows:**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

## Step 2: Configure Environment (1 minute)

### Backend
1. Open `backend/.env`
2. Add your Hugging Face API token:
   ```
   HUGGINGFACE_API_TOKEN=hf_your_token_here
   ```
   Get token from: https://huggingface.co/settings/tokens

### Frontend
The `.env` file is already configured with your Supabase credentials.

## Step 3: Set Up Supabase (2 minutes)

1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to **SQL Editor**
4. Copy contents of `backend/database/schema.sql`
5. Paste and click **Run**
6. Go to **Storage** → Create bucket named `media` → Set to **Public**

## Step 4: Start Backend

```bash
cd backend
npm run dev
```

You should see: `🚀 HeritageAI Backend running on port 3000`

## Step 5: Start Frontend

Open a new terminal:

```bash
cd frontend
npm start
```

## Step 6: Test the App

1. In Expo, press `a` for Android or `i` for iOS
2. Or scan QR code with Expo Go app on your phone
3. Tap the **+** button to record/upload a story
4. Fill in metadata and upload
5. Wait for processing (may take 1-2 minutes)
6. View your story in the library!

## Troubleshooting

**Backend won't start:**
- Check if port 3000 is available
- Verify `.env` file has all required variables
- Check Node.js version: `node --version` (should be 18+)

**Frontend can't connect to backend:**
- Ensure backend is running
- For physical device, change `EXPO_PUBLIC_API_URL` to your computer's IP
- Example: `http://192.168.1.100:3000`

**Hugging Face API errors:**
- Verify your API token is correct
- Check your Hugging Face account has API access
- Free tier has rate limits - wait a few seconds between requests

**Database errors:**
- Ensure you ran the SQL schema in Supabase
- Check Supabase project URL and anon key in `.env`

## Next Steps

- Record sample stories in Jamaican Patois
- Test storybook and video modes
- Explore search and filter features
- Customize UI colors and themes

## Need Help?

- Check `SETUP.md` for detailed instructions
- Check `PROJECT_SUMMARY.md` for feature overview
- Check `SUPABASE_SETUP.md` for database setup

Happy coding! 🎉
