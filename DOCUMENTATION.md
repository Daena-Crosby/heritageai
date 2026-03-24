# Heritage AI — Full Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [AI Processing Pipeline](#6-ai-processing-pipeline)
7. [Security Implementation](#7-security-implementation)
8. [Frontend Screens & Components](#8-frontend-screens--components)
9. [Setup & Configuration](#9-setup--configuration)
10. [Development History](#10-development-history)
11. [Known Issues & Limitations](#11-known-issues--limitations)
12. [Roadmap](#12-roadmap)

---

## 1. Project Overview

Heritage AI is a mobile application designed to preserve and celebrate Jamaican cultural heritage through storytelling. The app allows contributors to:

- **Record or upload audio** of oral stories in Jamaican Patois or other dialects
- **Type or upload document versions** of written stories
- **AI-process stories** automatically — transcription, translation, theme detection, illustrations, and video
- **Browse and search** a community archive filtered by theme, age group, language, and country
- **View stories** in Storybook mode (illustrated pages) or Video mode (audio with synced subtitles)
- **Comment and favorite** stories (requires account)

The app targets preservation of Jamaican folklore, Anansi tales, moral stories, and oral traditions.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Mobile App | React Native + Expo | 0.81.5 / ~54.0.0 | iOS, Android, Web |
| Navigation | React Navigation | 6.x | Stack navigation |
| Backend API | Node.js + Express | 18+ / 4.18 | REST API server |
| Language | TypeScript | 5.3.3 | Both frontend and backend |
| Database | PostgreSQL (Supabase) | 15 | Persistent data storage |
| Auth | Supabase Auth | 2.x | JWT-based user authentication |
| File Storage | Supabase Storage | — | Audio, video, image files |
| Token Storage | expo-secure-store | ~14.0 | Encrypted JWT storage on device |
| HTTP Client | Axios | 1.6.2 | API requests |
| Validation | Zod | 3.x | Request body/query validation |
| Security | Helmet + express-rate-limit | 7.x | HTTP headers + rate limiting |
| Document Parsing | Mammoth | — | .docx → plain text |
| Speech-to-Text | Hugging Face Whisper | base | Audio transcription |
| Translation | Hugging Face M2M100 | 418M | Patois → English |
| Image Generation | Hugging Face Stable Diffusion | 2.1 | Story illustrations |
| Theme Detection | Hugging Face BART | large-mnli | Zero-shot classification |
| Video Assembly | FFMPEG (fluent-ffmpeg) | 2.1.2 | Images + audio → MP4 |

---

## 3. Project Structure

```
heritageai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts          # Anon + service-role Supabase clients
│   │   ├── middleware/
│   │   │   ├── auth.ts              # requireAuth, optionalAuth, requireAdmin
│   │   │   ├── errorHandler.ts      # Global Express error handler
│   │   │   ├── rateLimiter.ts       # 4 rate limit tiers
│   │   │   └── validate.ts          # Zod schemas + validate() factory
│   │   ├── routes/
│   │   │   ├── auth.ts              # /api/auth — register, login, refresh, logout
│   │   │   ├── comments.ts          # /api/comments — CRUD + flagging
│   │   │   ├── media.ts             # /api/media — media retrieval
│   │   │   ├── processing.ts        # /api/processing — AI job status
│   │   │   ├── search.ts            # /api/search — full-text search
│   │   │   ├── stories.ts           # /api/stories — story CRUD
│   │   │   ├── upload.ts            # /api/upload — audio, text, document
│   │   │   └── users.ts             # /api/users — profiles + favorites
│   │   ├── services/
│   │   │   ├── ai.ts                # Hugging Face AI integrations
│   │   │   ├── database.ts          # All Supabase table operations
│   │   │   ├── storage.ts           # Supabase Storage upload helpers
│   │   │   └── video.ts             # FFMPEG video assembly
│   │   └── index.ts                 # Express app entry point
│   ├── database/
│   │   ├── schema.sql               # Full PostgreSQL schema
│   │   └── rls_policies.sql         # Row Level Security policies
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StoryCard.tsx        # Story list card
│   │   │   ├── StorybookMode.tsx    # Illustrated page-flip viewer
│   │   │   └── VideoMode.tsx        # Video player + processing status
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx       # Login / register
│   │   │   ├── HomeScreen.tsx       # Story feed + filters
│   │   │   ├── RecordingScreen.tsx  # 3-tab story input
│   │   │   └── StoryViewScreen.tsx  # Story detail (storybook/video)
│   │   ├── services/
│   │   │   ├── api.ts               # Axios client + all API functions
│   │   │   └── auth.ts              # Auth service + SecureStore token management
│   │   └── config/
│   │       └── supabase.ts          # Frontend Supabase client (anon only)
│   ├── App.tsx                      # Navigation + auth state
│   └── package.json
├── ARCHITECTURE.md                  # Architecture decisions + API table
├── CLAUDE.md                        # AI assistant instructions
├── DOCUMENTATION.md                 # This file
└── .gitignore
```

---

## 4. Database Schema

### Tables

#### `users`
Mirrors Supabase Auth. Auto-created via trigger on signup.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | References `auth.users(id)` |
| display_name | TEXT | |
| avatar_url | TEXT | |
| role | TEXT | `user` \| `moderator` \| `admin` |
| bio | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated by trigger |

#### `storytellers`
Elder or contributor profiles, linked to stories.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| location | TEXT | |
| dialect | TEXT | |
| created_by | UUID | References `users(id)` |
| created_at | TIMESTAMPTZ | |

#### `stories`
Core content record.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | TEXT | 1–200 chars |
| storyteller_id | UUID | References `storytellers(id)` |
| uploaded_by | UUID | References `users(id)` |
| age_group | TEXT | `children` \| `teens` \| `general` |
| country | TEXT | Default: `Jamaica` |
| language | TEXT | Default: `Jamaican Patois` |
| theme | TEXT | Stored lowercase |
| length_seconds | INT | |
| is_published | BOOLEAN | Default: `true` |
| view_count | INT | Default: `0` |
| search_vector | TSVECTOR | Auto-updated by trigger for full-text search |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated by trigger |

#### `media`
Audio and video file references.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| story_id | UUID | References `stories(id)` CASCADE |
| type | TEXT | `audio` \| `video` |
| file_url | TEXT | Supabase Storage URL |
| file_size_bytes | BIGINT | |
| duration_seconds | INT | |
| created_at | TIMESTAMPTZ | |

#### `translations`
Transcription, English translation, and subtitle data.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| story_id | UUID | References `stories(id)` CASCADE |
| original_text | TEXT | Transcribed dialect text |
| translated_text | TEXT NOT NULL | English translation |
| subtitles | JSONB | `[{start, end, text}]` |
| cultural_notes | TEXT | Reserved for future AI notes |
| created_at | TIMESTAMPTZ | |

#### `illustrations`
AI-generated storybook images.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| story_id | UUID | References `stories(id)` CASCADE |
| image_url | TEXT | Supabase Storage URL |
| page_number | INT | Starts at 1 |
| prompt_used | TEXT | Reserved |
| created_at | TIMESTAMPTZ | |

#### `tags`
Reusable theme labels, always stored lowercase.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT UNIQUE | Lowercase, 1–50 chars |

#### `story_tags`
Many-to-many relationship between stories and tags.
| Column | Type |
|--------|------|
| story_id | UUID (PK) |
| tag_id | UUID (PK) |

#### `favorites`
User story bookmarks.
| Column | Type |
|--------|------|
| user_id | UUID (PK) |
| story_id | UUID (PK) |
| created_at | TIMESTAMPTZ |

#### `comments`
Per-story user comments with moderation support.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| story_id | UUID | References `stories(id)` CASCADE |
| user_id | UUID | References `users(id)` CASCADE |
| content | TEXT | 1–2000 chars |
| is_flagged | BOOLEAN | Default: `false` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated by trigger |

#### `processing_jobs`
Tracks AI pipeline status per story upload.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| story_id | UUID | References `stories(id)` CASCADE |
| status | TEXT | `pending` \| `processing` \| `completed` \| `failed` |
| current_step | TEXT | `transcription` \| `translation` \| `subtitles` \| `themes` \| `illustrations` \| `video` |
| progress_pct | INT | 0–100 |
| error_message | TEXT | |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `audit_log`
Immutable server-side record of all write actions. Writable only by service role.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | |
| action | TEXT | `upload` \| `update` \| `delete` \| `login` \| etc. |
| resource_type | TEXT | `story` \| `comment` \| `user` \| `storyteller` |
| resource_id | UUID | |
| ip_address | INET | |
| user_agent | TEXT | |
| created_at | TIMESTAMPTZ | |

### Triggers
- **`stories_search_update`** — regenerates `search_vector` on INSERT/UPDATE to `stories`
- **`stories_updated_at`** — sets `updated_at = NOW()` on UPDATE
- **`users_updated_at`** — same for `users`
- **`comments_updated_at`** — same for `comments`
- **`processing_jobs_updated_at`** — same for `processing_jobs`
- **`on_auth_user_created`** — inserts a row into `public.users` when a new Supabase Auth user is created

### Row Level Security
Defined in `backend/database/rls_policies.sql`. Key rules:
- Published stories are publicly readable
- Only the uploader (or admin) can update/delete their stories
- Users manage only their own profile, favorites, and comments
- `audit_log` and `processing_jobs` writes are service-role only

---

## 5. API Reference

**Base URL:** `http://localhost:3000/api`

### Authentication — `/api/auth`
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | — | `{email, password, displayName?}` | Create account |
| POST | `/login` | — | `{email, password}` | Returns `{token, refreshToken, user}` |
| POST | `/refresh` | — | `{refreshToken}` | Exchange refresh token for new access token |
| POST | `/logout` | Optional | — | Invalidates server session |
| POST | `/reset-password` | — | `{email}` | Sends password reset email |

### Users — `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Required | Get own profile |
| PATCH | `/me` | Required | Update `display_name`, `bio`, `avatar_url` |
| GET | `/:id` | — | Get public profile |
| GET | `/me/stories` | Required | My uploaded stories (paginated) |
| GET | `/me/favorites` | Required | My favorited stories |
| POST | `/me/favorites/:storyId` | Required | Add to favorites |
| DELETE | `/me/favorites/:storyId` | Required | Remove from favorites |

### Stories — `/api/stories`
| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|-------------|-------------|
| GET | `/` | — | `language, country, theme, age_group, page, limit` | List all published stories |
| GET | `/:id` | — | — | Full story with media, translations, illustrations, tags |
| POST | `/` | Required | — | Create story record |
| PATCH | `/:id` | Required (owner) | — | Update story metadata |

### Upload — `/api/upload`
| Method | Endpoint | Auth | Format | Description |
|--------|----------|------|--------|-------------|
| POST | `/audio` | Optional | `multipart/form-data` | Upload audio + full AI pipeline |
| POST | `/text` | Optional | `application/json` | Submit typed text + AI pipeline |
| POST | `/document` | Optional | `multipart/form-data` | Upload .txt/.docx + AI pipeline |

**Audio/Document form fields:** `audio`/`document` (file), `title`, `storytellerName`, `storytellerLocation`, `storytellerDialect`, `ageGroup`, `country`, `language`, `theme`

**Text JSON body:** `storyText`, plus all metadata fields above

### Search — `/api/search`
| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/` | `q, language, country, theme, age_group, page, limit` | Case-insensitive search across title and theme |

### Comments — `/api/comments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/story/:id` | — | Get non-flagged comments for a story |
| POST | `/story/:id` | Required | Post a comment |
| PATCH | `/:id` | Required (owner) | Edit own comment |
| DELETE | `/:id` | Required (owner/mod) | Delete comment |
| POST | `/:id/flag` | Required | Flag comment for review |

### Media — `/api/media`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/story/:storyId` | Get all media (audio + video) for a story |

### Processing — `/api/processing`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:storyId` | Get AI pipeline status `{status, current_step, progress_pct}` |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{status: "ok", timestamp}` |

---

## 6. AI Processing Pipeline

### Audio Upload Flow
```
Audio file received
  → Create storyteller + story records
  → Upload audio to Supabase Storage
  → Whisper (HF) → transcribed text in original dialect
  → M2M100 (HF) → English translation
  → Subtitle generation (word timing estimate, 0.5s/word)
  → BART zero-shot (HF) → top 3 theme tags
  → Stable Diffusion (HF) → 1 illustration per sentence (max 10)
  → FFMPEG → MP4 video (async, fire-and-forget)
  → Return story + translation + illustrations to client
```

### Text / Document Upload Flow
```
Text content received (typed or extracted from .docx/.txt)
  → Create storyteller + story records
  → Translate if language is not English
  → BART zero-shot → theme tags
  → Stable Diffusion → illustrations (max 10)
  → Return story + translation + illustrations
  (No transcription, subtitles, or video — no audio source)
```

### Hugging Face Models
| Task | Model | Notes |
|------|-------|-------|
| Speech-to-Text | `openai/whisper-base` | Handles Jamaican Patois reasonably well |
| Translation | `facebook/m2m100_418M` | 100+ language pairs |
| Image Generation | `stabilityai/stable-diffusion-2-1` | Cartoon/children's book style prompt prefix |
| Theme Classification | `facebook/bart-large-mnli` | Zero-shot against: folklore, moral, anansi, history, tradition, legend, fable |

### Fallback Behaviour
If `HUGGINGFACE_API_TOKEN` is missing or the API fails:
- Transcription returns `"Transcription in progress..."`
- Translation returns the original text unchanged
- Illustrations return a 1×1 transparent PNG placeholder
- Theme suggestions return an empty array

---

## 7. Security Implementation

### Layers
1. **Helmet** — sets security HTTP headers (HSTS, X-Content-Type, X-Frame-Options, CSP)
2. **CORS** — allowlist of origins from `CORS_ORIGIN` env var; mobile app requests (no `Origin` header) pass through
3. **Rate Limiting** (express-rate-limit):
   - General: 100 req / 15 min per IP
   - Upload: 10 uploads / hour per IP
   - Search: 60 req / min per IP
   - Auth: 10 req / 15 min per IP (skips successful requests)
4. **Authentication** (Supabase JWT):
   - `requireAuth` — blocks unauthenticated requests
   - `optionalAuth` — attaches user if token present, allows guests through
   - `requireAdmin` — checks `users.role = 'admin'` in DB after JWT validation
5. **Input Validation** (Zod) — all request bodies and query strings validated with defined schemas before handler runs
6. **File Upload Security** — MIME type allowlist, 50MB audio / 10MB document size limits
7. **Row Level Security** — Supabase RLS ensures users can only read/write their own data when accessing the database directly
8. **Service Role Key** — backend uses service role for DB writes (bypasses RLS safely); anon key never used for writes
9. **Token Storage** — JWTs stored in `expo-secure-store` (device encrypted storage), not AsyncStorage

### User Roles
| Role | Permissions |
|------|------------|
| Guest | Read published stories, comments, and translations |
| `user` | + Upload stories, post comments, manage favorites, edit own content |
| `moderator` | + Update any story, delete/unflag any comment |
| `admin` | + Delete stories, read audit log, manage all users |

---

## 8. Frontend Screens & Components

### App.tsx
Root component. On startup:
1. Attaches Axios interceptors (auto-attach JWT, auto-refresh on 401)
2. Checks `expo-secure-store` for an existing token and validates it
3. Shows `AuthScreen` if user taps Sign In, otherwise proceeds as guest
4. Passes `user`, `onLoginPress`, `onLogout` down to HomeScreen

### HomeScreen
- Loads all published stories on mount with no filter
- **Theme filter chips:** folklore, moral, anansi, history, tradition, legend, fable
- **Age group chips:** Children, Teens, General
- Filters are independently toggleable; both can be active simultaneously
- Tapping an active chip deselects it (returns to all stories)
- Search bar overrides filter view; clearing search restores filtered view
- "✕ Clear filters" button appears when any filter or search is active
- Empty state shows context-appropriate message

### RecordingScreen (3 tabs)
| Tab | Input | Notes |
|-----|-------|-------|
| Audio | Mic recording or file picker | Supports mp3, m4a, wav, ogg, webm, aac (iOS m4a fixed) |
| Document | File picker | .txt, .doc, .docx up to 10MB |
| Type Story | Multiline TextInput | Up to 50,000 characters |

All tabs share the same metadata form (title, storyteller, location, age group chips, language, theme, country). Submits to the appropriate `/upload/*` endpoint.

### AuthScreen
- Sign In / Create Account tabs
- Guest skip option ("Continue as guest")
- Displays email verification message after registration
- Error messages from API displayed inline

### StoryViewScreen
- Header with back button and story title
- Mode toggle: **Storybook** / **Video**

### StorybookMode
- Page-flip navigation through AI illustrations
- Each page shows illustration + translated text for that sentence
- Page counter

### VideoMode
Three states:
1. **Video ready** → Native `expo-av` Video player with transport controls
2. **Processing** → First illustration + audio playback + live subtitle overlay + "Video generating..." badge + progress bar polling `/api/processing/:storyId` every 4 seconds
3. **Failed** → Error banner + audio-only fallback

---

## 9. Setup & Configuration

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (for testing)
- Supabase account
- Hugging Face account with API token
- FFMPEG installed and on PATH (for video generation)

### First-Time Setup

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install frontend dependencies
cd frontend && npm install

# 3. Create backend environment file
cp backend/.env.example backend/.env   # or create manually
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, HUGGINGFACE_API_TOKEN

# 4. Create frontend environment file
cp frontend/.env.example frontend/.env  # or create manually
# Fill in: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL
```

**In Supabase Dashboard:**
1. SQL Editor → paste and run `backend/database/schema.sql`
2. SQL Editor → paste and run `backend/database/rls_policies.sql`
3. Storage → New bucket → name: `media` → Public: ✓
4. Authentication → Providers → Email → Enable

### Running Locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# Confirm: "HeritageAI Backend running on port 3000"

# Terminal 2 — Frontend
cd frontend && npx expo start --clear
# Scan QR code with Expo Go on your phone
```

### Physical Device Setup
Your phone and computer must be on the same network. Find your computer's local IP (`ipconfig` on Windows) and set:
```env
# frontend/.env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```
If the phone times out, open port 3000 in Windows Firewall (run as admin):
```
netsh advfirewall firewall add rule name="HeritageAI Backend" dir=in action=allow protocol=TCP localport=3000
```

---

## 10. Development History

### Phase 1 — Initial Build
- React Native + Expo mobile frontend
- Node.js + Express backend
- Supabase PostgreSQL database (7 tables: storytellers, stories, media, translations, illustrations, tags, story_tags)
- Hugging Face AI pipeline (Whisper, M2M100, Stable Diffusion, BART)
- FFMPEG video generation
- Basic story upload (audio only), browse, and search
- Storybook mode (illustrated pages) + Video mode (audio + subtitle overlay)

### Phase 2 — Architecture & Security Hardening
**Database:**
- Added 5 new tables: `users`, `favorites`, `comments`, `processing_jobs`, `audit_log`
- Added `uploaded_by`, `is_published`, `view_count`, `search_vector`, `updated_at` to `stories`
- Added database-level CHECK constraints on all enum fields
- Full-text search via `tsvector` column with GIN index and auto-update trigger
- `updated_at` auto-update triggers on stories, users, comments, processing_jobs
- `rls_policies.sql` — Row Level Security on all tables, auto user profile creation trigger

**Security:**
- Added `helmet` for HTTP security headers
- Added `express-rate-limit` with 4 tiers (general, upload, search, auth)
- Added `zod` input validation with reusable `validate()` middleware factory
- Added `requireAuth`, `optionalAuth`, `requireAdmin` JWT middleware
- Added `supabaseAdmin` (service role) client for all backend DB writes
- MIME type allowlist for file uploads

**New API Routes:**
- `/api/auth` — register, login, refresh token, logout, password reset
- `/api/users` — profile management, my stories, favorites CRUD
- `/api/comments` — comment CRUD, flagging
- `/api/processing` — AI job status polling

### Phase 3 — Frontend Auth + Video Playback
- `expo-secure-store` for encrypted JWT storage on device
- `auth.ts` service with Axios interceptors (auto-attach token, auto-refresh on 401)
- `AuthScreen.tsx` — sign in / create account / guest mode
- `VideoMode.tsx` rewritten — real `expo-av` video player when ready; polls processing status every 4 seconds while generating; falls back to audio + illustration + subtitles
- `App.tsx` — session persistence on startup, auth state propagated through navigation
- Sign In / Sign Out button in HomeScreen header

### Phase 4 — Multi-Format Story Input
- Fixed iOS audio MIME type (`audio/x-m4a` added to allowlist)
- Added `mammoth` for .docx text extraction
- New `/api/upload/text` route — accepts typed story text
- New `/api/upload/document` route — accepts .txt, .doc, .docx
- Shared `processTextPipeline()` helper (translation + themes + illustrations, no audio/video)
- `RecordingScreen.tsx` redesigned with 3 tabs: Audio | Document | Type Story
- Age group changed from free text to tap-to-select chip row

### Phase 5 — Filter & Case Sensitivity Fixes
- All backend DB writes switched to `supabaseAdmin` (fixed "row violates RLS" errors)
- Theme and age group values normalized to lowercase on save
- Tag names normalized to lowercase; lookup uses `ilike`
- `getAllStories` filters use `ilike` instead of `eq` — case-insensitive matching
- HomeScreen redesigned: loads all stories by default, two filter rows (Theme + Age Group), independent toggleable chips, "Clear filters" button, context-aware empty state

---

## 11. Known Issues & Limitations

| Issue | Status | Notes |
|-------|--------|-------|
| Subtitle timing is an estimate | Open | Uses 0.5s/word approximation — Whisper's `return_timestamps` parameter is unsupported in the current HF client version |
| `multer` 1.x has vulnerabilities | Open | Upgrade to `multer@2.x` when ready — API changed slightly |
| `fluent-ffmpeg` is deprecated | Open | Video generation still works; monitor for alternatives |
| Video generation is fire-and-forget | Open | Failures are logged to console but not surfaced to the user; `processing_jobs` table is ready but pipeline doesn't write to it yet |
| No automated tests | Open | No test suite exists; all testing is manual |
| No CI/CD pipeline | Open | No GitHub Actions; deployments are manual |
| No push notifications | Open | App can't notify user when processing completes |
| PDF document support | Not started | `pdf-parse` or similar needed |
| Export to PDF storybook | Not started | `pdfkit` planned |
| Offline mode | Not started | Expo FileSystem available but not wired up |
| Multi-language subtitle target | Not started | Currently always translates to English |

---

## 12. Roadmap

### Priority 1 — Connect processing_jobs to the pipeline
Wire the `processing_jobs` table into `routes/upload.ts` so each pipeline step updates `current_step` and `progress_pct`. The VideoMode polling UI is already built and ready to display live progress.

### Priority 2 — Production deployment
- Dockerize the backend
- Deploy backend to Railway / Render / Fly.io
- Set up EAS Build for app store submission
- Switch `EXPO_PUBLIC_API_URL` from LAN IP to production URL

### Priority 3 — Content quality
- Use Whisper's actual word timestamps for accurate subtitle timing
- Add cultural notes field: post-process translation with an LLM to generate 2–3 sentences of cultural context
- Support additional target languages for translation

### Priority 4 — Discovery features
- Upgrade search to use `ts_rank` for relevance ordering
- Story collections / playlists
- Trending stories (most viewed this week)
- Story export: PDF storybook, MP4 download

### Priority 5 — Admin & moderation
- Admin dashboard: view flagged comments, processing job statuses, audit log
- Moderator tools: bulk story management, user management
