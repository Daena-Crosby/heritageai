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

### Rate limiting is applied per route (IP + user-based)
Rate limiting uses combined IP and user-based tracking to prevent abuse:

| Tier | Limit | Window | Applied To |
|------|-------|--------|------------|
| General | 100 req | 15 min | All routes (global) |
| Auth | 10 failed | 15 min | Login/register (only counts failures) |
| Upload | 10 uploads | 1 hour | File uploads |
| Search | 60 req | 1 min | Search, translate, guide |
| Comments | 30 req | 5 min | Comment operations |
| AI | 20 req | 1 min | Translation, cultural guide |
| Sensitive | 5 req | 1 min | Admin/moderation actions |

All rate limiters return proper `429` responses with `Retry-After` headers and `RateLimit-*` standard headers.

### Input validation and sanitization uses Zod
All request bodies go through Zod schemas defined in `middleware/validate.ts`. The validation middleware:
- Validates input against schemas with strict mode (rejects unexpected fields)
- Sanitizes all string inputs to prevent XSS (HTML entity encoding)
- Enforces length limits on all text fields
- Uses UUID validation for all ID parameters

Add new schemas in `validate.ts` and use the `validate(schema, source, options)` middleware factory.

### AI provider split — HuggingFace vs Groq
Two separate AI providers are used:
- **HuggingFace** (`HUGGINGFACE_API_TOKEN`): Whisper transcription, Stable Diffusion illustrations, BART theme classification. Uses `@huggingface/inference` SDK v2.x.
- **Groq** (`GROQ_API_KEY`): Dialect translation and Cultural Guide chat. Uses direct axios calls to `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible). Do NOT route these through the HuggingFace SDK — it uses the deprecated `api-inference.huggingface.co` URL internally.

### Static StyleSheet + dynamic theme — never mix
`StyleSheet.create()` runs at module load time, before any component mounts, so it cannot reference `useTheme()` values. All theme colors (`C.bg`, `C.text`, etc.) must be applied as **inline style props** in JSX, not inside `StyleSheet.create({})`.

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=                    # Project URL from Supabase → Settings → API
SUPABASE_ANON_KEY=               # anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # service_role key — NEVER expose to frontend
HUGGINGFACE_API_TOKEN=           # from huggingface.co/settings/tokens
GROQ_API_KEY=                    # from console.groq.com — used for translation + guide
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

## Screens & Navigation

Navigation is **state-based** — no React Navigation or drawer navigator. `App.tsx` holds `activeScreen` state and renders the correct screen. This avoids the `react-native-reanimated` dependency.

| Screen | `activeScreen` value | Component |
|--------|----------------------|-----------|
| Home | `'home'` | `HomeScreen` |
| Dialect Translator | `'dialects'` | `DialectsScreen` |
| Heritage Vault | `'vault'` | `HeritageVaultScreen` |
| Cultural Guide | `'guide'` | `CulturalGuideScreen` |
| Record Story | `'record'` | `RecordingScreen` |
| Story Detail | — (overlay via `selectedStoryId`) | `StoryViewScreen` |

The `AppScreen` type is exported from `frontend/src/components/Sidebar.tsx`.

## Theme System

The app supports **dark mode and light mode**, toggled by the user via the sidebar.

- `frontend/src/theme/colors.ts` — defines `ThemeColors` interface, `darkColors`, `lightColors`
- `frontend/src/theme/ThemeContext.tsx` — `ThemeProvider` + `useTheme()` hook
- All components call `const { colors: C, isDark, toggle } = useTheme()`
- `App.tsx` is wrapped in `<ThemeProvider>` at the root

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
| `api-inference.huggingface.co is no longer supported` | HuggingFace SDK v2.x uses deprecated URL | Do not use SDK for translation/guide — use Groq via direct axios calls instead |
| `Property 'C' doesn't exist` (runtime crash) | `StyleSheet.create()` referenced `C.*` from `useTheme()` at module load time | Move all theme color values to inline JSX style props; keep `StyleSheet` for structural/static values only |
| Translation or Guide returns "Not Found" | HuggingFace models not available on free tier | Already migrated to Groq — ensure `GROQ_API_KEY` is set in `backend/.env` |
| `stories.slice is not a function` | API response format changed to paginated | Frontend `api.ts` now handles both array and `{ stories: [], total, page }` formats |
| `429 Too Many Requests` | Rate limit exceeded | Wait for `Retry-After` seconds; check rate limit tier in `rateLimiter.ts` |

## File Responsibilities

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express app entry — wires Helmet, CORS, rate limiting, security logging, all routes |
| `backend/src/config/supabase.ts` | Exports `supabase` (anon) and `supabaseAdmin` (service role) |
| `backend/src/middleware/auth.ts` | `requireAuth`, `optionalAuth`, `requireModerator`, `requireAdmin` |
| `backend/src/middleware/rateLimiter.ts` | 7 rate limit tiers with IP + user-based tracking |
| `backend/src/middleware/validate.ts` | Zod schemas + `validate()` factory + HTML sanitization |
| `backend/src/middleware/securityLogger.ts` | Security event logging, request ID tracking, suspicious pattern detection |
| `backend/src/middleware/errorHandler.ts` | Secure error handling without exposing internal details |
| `backend/src/services/database.ts` | All Supabase table operations |
| `backend/src/services/ai.ts` | Whisper + BART + Stable Diffusion (HF SDK); dialect translation + Cultural Guide (Groq/axios) |
| `backend/src/services/storage.ts` | Supabase Storage upload helpers |
| `backend/src/services/video.ts` | FFMPEG video assembly |
| `backend/src/routes/upload.ts` | Audio, text, and document upload pipelines |
| `backend/src/routes/translate.ts` | `POST /api/translate` — dialect → English via Groq |
| `backend/src/routes/guide.ts` | `POST /api/guide` — Cultural Guide chat via Groq |
| `backend/database/schema.sql` | Full PostgreSQL schema with triggers and indexes |
| `backend/database/rls_policies.sql` | Row Level Security policies + auth trigger |
| `frontend/src/services/api.ts` | Axios client + all API call functions incl. `translateDialect()`, `getCulturalGuide()` |
| `frontend/src/services/auth.ts` | Login/register/logout + SecureStore token management |
| `frontend/src/theme/colors.ts` | Dark and light color palettes |
| `frontend/src/theme/ThemeContext.tsx` | Theme context provider + `useTheme()` hook |
| `frontend/src/components/Sidebar.tsx` | Left nav sidebar; exports `AppScreen` type |
| `frontend/src/screens/HomeScreen.tsx` | Hero banner + recent stories + vault analytics |
| `frontend/src/screens/DialectsScreen.tsx` | Dialect translator UI (calls `/api/translate`) |
| `frontend/src/screens/HeritageVaultScreen.tsx` | Story library with theme filter tabs |
| `frontend/src/screens/CulturalGuideScreen.tsx` | Conversational AI guide (calls `/api/guide`) |
| `frontend/src/screens/RecordingScreen.tsx` | 3-tab story input (Audio / Document / Type) |
| `frontend/src/components/VideoMode.tsx` | Video player with processing status polling |
| `frontend/App.tsx` | Navigation + auth state management |

## Security Rules — Do Not Break

### API Keys & Secrets
- `SUPABASE_SERVICE_ROLE_KEY` must never be sent to the frontend or logged
- `GROQ_API_KEY` must never be sent to the frontend or logged
- `HUGGINGFACE_API_TOKEN` must never be sent to the frontend or logged
- All secrets are validated at startup via `validateRequiredEnvVars()` in `securityLogger.ts`

### Authentication & Authorization
- All backend DB writes use `supabaseAdmin` (service role)
- Auth routes use the anon client for Supabase Auth only
- JWTs are stored in `expo-secure-store` (encrypted), not AsyncStorage
- Role-based access control: `user`, `moderator`, `admin`
- Ownership verification on all user-specific resources

### Input Validation & Sanitization
- All user inputs pass through Zod validation with strict mode
- All string inputs are HTML-sanitized to prevent XSS
- File uploads validate MIME type and enforce size limits (50MB audio, 10MB docs)
- UUID validation on all ID parameters
- Pagination limits enforced (max 100 items per page)

### Rate Limiting
- Combined IP + user-based rate limiting on all endpoints
- Auth routes only count failed attempts (successful logins don't consume quota)
- Graceful 429 responses with `Retry-After` headers
- Sensitive operations (admin/moderation) have stricter limits

### Security Logging
- Request ID tracking for log correlation (`X-Request-ID` header)
- Auth success/failure logging
- Rate limit violation logging
- Suspicious pattern detection (SQL injection, XSS, path traversal)
- Admin action audit logging
- File upload logging

### Error Handling
- Production errors return safe messages without internal details
- Stack traces only shown in development mode
- No-cache headers on error responses
- Request ID included for support correlation

### Security Headers (via Helmet)
- Content-Security-Policy configured
- Strict-Transport-Security (HSTS) enabled
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
