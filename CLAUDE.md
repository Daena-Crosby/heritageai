# Heritage AI — Claude Code Instructions

## Project Overview
Heritage AI is a mobile application (React Native + Expo) for preserving Jamaican cultural heritage through AI-processed oral stories. Users can record audio, upload documents, or type stories directly. The AI pipeline transcribes, translates, illustrates, and generates video automatically.

## Monorepo Structure
```
heritageai/
├── backend/          # Node.js + Express + TypeScript API (port 3000)
├── frontend/         # React Native + Expo mobile app (port 8081)
├── backend/database/ # SQL schema and RLS policies (run in Supabase)
└── ARCHITECTURE.md   # Full architecture reference
```

## Dev Commands

```bash
# Backend (always run first)
cd backend && npm run dev

# Frontend
cd frontend && npx expo start --clear    # --clear wipes Metro cache

# Type-check backend only (frontend has no tsc script)
cd backend && npx tsc --noEmit
```

## Critical Conventions

### Database access — always use supabaseAdmin on the backend
All backend routes and services import `supabaseAdmin` (service role key), NOT the anon `supabase` client. The anon client respects RLS and will block server-side writes.
```typescript
// CORRECT — in all backend files
import { supabaseAdmin as supabase } from '../config/supabase';

// WRONG — blocks inserts due to RLS
import { supabase } from '../config/supabase';
```
The only exception is `routes/auth.ts`, which uses the anon client for Supabase Auth API calls.

### Theme and tag values — always lowercase
Themes and tags must be stored lowercase. Normalize on save:
```typescript
theme: theme?.toLowerCase().trim()
```
Filters use `ilike` (case-insensitive) so "Moral", "MORAL", and "moral" all match.

### Audio MIME types — iOS sends `audio/x-m4a`
The allowed list in `routes/upload.ts` includes `audio/x-m4a` and `audio/aac` for iOS compatibility. Do not remove these.

### Rate limiting is applied per route
- General: 100 req / 15 min
- Upload: 10 uploads / hour
- Search: 60 req / min
- Auth: 10 req / 15 min (brute-force protection)

### Input validation uses Zod
All request bodies go through Zod schemas defined in `middleware/validate.ts`. Add new schemas there and use the `validate(schema)` middleware factory.

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=                    # Project URL from Supabase → Settings → API
SUPABASE_ANON_KEY=               # anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # service_role key — NEVER expose to frontend
HUGGINGFACE_API_TOKEN=           # from huggingface.co/settings/tokens
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://<your-ip>:8081
PASSWORD_RESET_REDIRECT_URL=http://localhost:8081/reset-password
```

### Frontend (`frontend/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=   # anon key only — service role NEVER goes here
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000   # use LAN IP for physical device
```

### LAN IP is auto-detected — no manual configuration needed
The app reads the host from Expo's own manifest (`Constants.expoConfig.hostUri`) at runtime. Since Expo already knows the machine's LAN IP to serve the QR code, the backend URL is derived from the same IP automatically. No one needs to set `EXPO_PUBLIC_API_URL` for local development.

Only set `EXPO_PUBLIC_API_URL` when deploying to production (e.g. `https://heritageai.up.railway.app`). The detection logic lives in `frontend/src/utils/apiUrl.ts`.

## Supabase Setup (required once per environment)

1. **SQL Editor → Run** `backend/database/schema.sql`
2. **SQL Editor → Run** `backend/database/rls_policies.sql`
3. **Storage → New bucket** → name: `media` → Public bucket: ✓
4. Enable **Email auth** in Authentication → Providers

## AI Pipeline (audio upload flow)
1. Create storyteller + story records
2. Upload audio to Supabase Storage (`media` bucket)
3. Transcribe via Hugging Face Whisper (`openai/whisper-base`)
4. Translate via M2M100 (`facebook/m2m100_418M`)
5. Generate subtitles (word timing estimate)
6. Classify themes via BART zero-shot (`facebook/bart-large-mnli`)
7. Generate illustrations via Stable Diffusion (`stabilityai/stable-diffusion-2-1`)
8. Assemble video via FFMPEG (async, fire-and-forget)

Text and document uploads skip steps 3, 5, and 8.

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `row violates RLS policy` | Using anon client for server writes | Use `supabaseAdmin` in backend |
| `Unsupported file type: audio/x-m4a` | Missing iOS MIME type | Already fixed — `audio/x-m4a` is in the allowlist |
| `Network Error` on phone | Auto-detection failed or Expo manifest unavailable | Check `Constants.expoConfig.hostUri` is set; fallback: set `EXPO_PUBLIC_API_URL` to LAN IP manually |
| `timeout exceeded` on phone | Windows Firewall blocking port 3000 | Run as admin: `netsh advfirewall firewall add rule name="HeritageAI" dir=in action=allow protocol=TCP localport=3000` |
| `Cannot find module 'babel-preset-expo'` | Missing Babel preset | `cd frontend && npm install babel-preset-expo` then `npx expo start --clear` |
| Stories not matching theme filter | Case mismatch ("Moral" vs "moral") | Already fixed — filters use `ilike`, saves normalize to lowercase |
| `Could not find table 'stories'` | Schema not applied | Run `schema.sql` then `rls_policies.sql` in Supabase SQL Editor |

## File Responsibilities

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express app entry — wires helmet, CORS, rate limiting, all routes |
| `backend/src/config/supabase.ts` | Exports `supabase` (anon) and `supabaseAdmin` (service role) |
| `backend/src/middleware/auth.ts` | `requireAuth`, `optionalAuth`, `requireAdmin` |
| `backend/src/middleware/rateLimiter.ts` | 4 rate limit tiers |
| `backend/src/middleware/validate.ts` | Zod schemas + `validate()` factory |
| `backend/src/services/database.ts` | All Supabase table operations |
| `backend/src/services/ai.ts` | Whisper, M2M100, Stable Diffusion, BART |
| `backend/src/services/storage.ts` | Supabase Storage upload helpers |
| `backend/src/services/video.ts` | FFMPEG video assembly |
| `backend/src/routes/upload.ts` | Audio, text, and document upload pipelines |
| `backend/database/schema.sql` | Full PostgreSQL schema with triggers and indexes |
| `backend/database/rls_policies.sql` | Row Level Security policies + auth trigger |
| `frontend/src/services/api.ts` | Axios client + all API call functions |
| `frontend/src/services/auth.ts` | Login/register/logout + SecureStore token management |
| `frontend/src/screens/RecordingScreen.tsx` | 3-tab story input (Audio / Document / Type) |
| `frontend/src/components/VideoMode.tsx` | Video player with processing status polling |
| `frontend/App.tsx` | Navigation + auth state management |

## Security Rules — Do Not Break
- `SUPABASE_SERVICE_ROLE_KEY` must never be sent to the frontend or logged
- All backend DB writes use `supabaseAdmin` (service role)
- Auth routes use the anon client for Supabase Auth only
- JWTs are stored in `expo-secure-store` (encrypted), not AsyncStorage
- File uploads validate MIME type and enforce size limits (50MB audio, 10MB docs)
- All user inputs pass through Zod validation before use
