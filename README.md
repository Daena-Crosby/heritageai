<div align="center">
  <h1>Heritage AI</h1>
  <p><strong>A living archive for the voices, stories, and dialects of the African diaspora.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" />
    <img src="https://img.shields.io/badge/AI-HuggingFace_+_Groq-FFD21E?style=flat-square" />
  </p>
</div>

---

## What is Heritage AI?

Heritage AI is a mobile application built to preserve the oral traditions, stories, and linguistic heritage of Jamaican and broader African diaspora cultures before they are lost to time.

Users can **record audio**, **upload documents**, or **type stories** directly into the app. An AI pipeline then automatically transcribes the audio, translates dialect to English, generates illustrated storybook pages, classifies cultural themes, and assembles a shareable video — turning raw oral history into a structured, searchable digital archive.

The platform includes a **Dialect Translator** for Jamaican Patois and other Caribbean/African creoles, a **Cultural Guide** AI assistant with deep anthropological knowledge, a **Heritage Vault** for browsing the full story collection, and a full **role-based moderation system** so the community can govern what enters the archive.

---

## Features

- **Multi-format story input** — record live audio, upload audio files, paste documents (.txt, .doc, .docx), or type directly
- **AI processing pipeline** — transcription (Whisper), dialect translation, theme classification (BART), AI illustration (Stable Diffusion), subtitle generation, and video assembly (FFmpeg)
- **Dialect Translator** — translate Jamaican Patois, Trinidadian Slang, Nigerian Pidgin, Louisiana Creole, and Haitian Kreyòl into English
- **Cultural Guide** — conversational AI assistant specialising in African diaspora history, linguistics, and traditions
- **Heritage Vault** — searchable, filterable library of archived stories with storybook and video viewing modes
- **Role-based access control** — three-tier permission system (User, Moderator, Admin) with moderation queue and admin panel
- **Dark mode & light mode** — full theme support throughout the app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native 0.81 + Expo SDK 54 |
| Backend API | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL + Row Level Security) |
| File storage | Supabase Storage |
| Auth | Supabase Auth (JWT) + expo-secure-store |
| Transcription | HuggingFace Whisper (`openai/whisper-base`) |
| Translation / Guide | Groq API (`llama-3.3-70b` via OpenAI-compatible endpoint) |
| Theme classification | HuggingFace BART (`facebook/bart-large-mnli`) |
| Illustrations | HuggingFace Stable Diffusion (`stabilityai/stable-diffusion-2-1`) |
| Video assembly | FFmpeg (server-side) |

---

## Prerequisites

Before running anything, make sure you have the following installed and accounts set up:

**Software**
- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [FFmpeg](https://ffmpeg.org/download.html) — must be available on your system `PATH` for video assembly
- [Expo Go](https://expo.dev/go) on your iOS or Android phone (for running the app without a simulator)

**Accounts & API Keys**
- [Supabase](https://supabase.com) — free tier is sufficient; you need a project URL, anon key, and service role key
- [HuggingFace](https://huggingface.co/settings/tokens) — free account; create a read token
- [Groq](https://console.groq.com) — free tier; create an API key for dialect translation and the Cultural Guide

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/heritageai.git
cd heritageai
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema file:
   ```
   backend/database/schema.sql
   ```
3. Run the RLS policies:
   ```
   backend/database/rls_policies.sql
   ```
4. Run the RBAC migration:
   ```
   backend/database/rbac_migration.sql
   ```
5. Go to **Storage → New bucket**, name it `media`, and set it to **public**
6. Go to **Authentication → Providers** and enable **Email**

### 3. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

HUGGINGFACE_API_TOKEN=hf_your_token
GROQ_API_KEY=gsk_your_key

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://YOUR_LAN_IP:8081
PASSWORD_RESET_REDIRECT_URL=http://localhost:8081/reset-password
```

> Find your LAN IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux). It looks like `192.168.x.x`. This is needed for the mobile app to reach your backend over Wi-Fi.

Start the backend:

```bash
npm run dev
```

### 4. Configure the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

> `EXPO_PUBLIC_API_URL` is **not required** for local development — the app automatically detects your machine's LAN IP from the Expo manifest. Only set it when deploying to production.

Start the frontend:

```bash
npx expo start --clear
```

Scan the QR code with Expo Go on your phone. Make sure your phone and computer are on the same Wi-Fi network.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Public anon key (safe to use client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — **never expose this to the frontend** |
| `HUGGINGFACE_API_TOKEN` | Yes | For Whisper, BART, and Stable Diffusion |
| `GROQ_API_KEY` | Yes | For dialect translation and the Cultural Guide chat |
| `PORT` | No | API port, defaults to `3000` |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `PASSWORD_RESET_REDIRECT_URL` | No | Redirect URL for password reset emails |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key only |
| `EXPO_PUBLIC_API_URL` | Production only | Full backend URL, e.g. `https://heritageai.up.railway.app` |

---

## Role-Based Access Control

The platform has three roles. All new registrations default to **User**.

| Permission | User | Moderator | Admin |
|---|:---:|:---:|:---:|
| Browse Heritage Vault | ✓ | ✓ | ✓ |
| Upload stories | ✓ | ✓ | ✓ |
| Use Dialect Translator | ✓ | ✓ | ✓ |
| Use Cultural Guide | ✓ | ✓ | ✓ |
| Approve / reject stories | | ✓ | ✓ |
| Manage flagged comments | | ✓ | ✓ |
| View moderation queue | | ✓ | ✓ |
| Manage user roles | | | ✓ |
| Remove users | | | ✓ |
| View platform stats & audit log | | | ✓ |

### Assigning the first Admin

Since there are no admins on a fresh install, promote yourself directly in Supabase:

```sql
UPDATE users
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

After that, all role management is handled through the **Admin Panel** inside the app.

---

## Project Structure

```
heritageai/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase client setup
│   │   ├── middleware/       # Auth, rate limiting, validation, error handling
│   │   ├── routes/           # API route handlers
│   │   └── services/         # Database, AI pipeline, storage, video
│   └── database/
│       ├── schema.sql         # Full PostgreSQL schema
│       ├── rls_policies.sql   # Row Level Security policies
│       └── rbac_migration.sql # Role & moderation status migration
└── frontend/
    └── src/
        ├── components/        # Sidebar, StoryCard, StorybookMode, VideoMode
        ├── screens/           # All app screens
        ├── services/          # API client, auth helpers
        ├── theme/             # Dark/light colour system
        └── utils/             # API URL auto-detection
```

---

## Deploying to Production

### Backend (Railway recommended)

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app) and connect your repo
3. Set all `backend/.env` variables in Railway's environment settings
4. Railway will detect Node.js and deploy automatically — note the public URL it gives you

### Frontend (Expo EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform ios    # or android
```

Set `EXPO_PUBLIC_API_URL` to your deployed Railway backend URL before building.

---

## API Rate Limits

| Route group | Limit |
|---|---|
| General | 100 requests / 15 min |
| Uploads | 10 uploads / hour |
| Search | 60 requests / min |
| Auth | 10 requests / 15 min |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure stories submitted through the app go through the moderation queue before appearing publicly in the vault.

---

<div align="center">
  <p>Built to preserve the voices that history tried to silence.</p>
</div>
