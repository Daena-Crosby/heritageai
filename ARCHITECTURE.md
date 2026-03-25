# Heritage AI — Architecture Overview

## Current Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile App | React Native + Expo | iOS, Android, Web |
| Backend API | Node.js + Express + TypeScript | REST API |
| Database | Supabase (PostgreSQL) | Persistent storage |
| Storage | Supabase Storage (S3) | Audio, video, images |
| Auth | Supabase Auth (JWT) | User accounts |
| AI: Speech-to-Text | Hugging Face Whisper (`openai/whisper-base`) | Dialect transcription |
| AI: Story Translation | Hugging Face M2M100 (`facebook/m2m100_418M`) | Patois → English (upload pipeline) |
| AI: Dialect Translator | Groq — Llama 3.1 8B (`llama-3.1-8b-instant`) | Interactive dialect → English translation |
| AI: Cultural Guide | Groq — Llama 3.3 70B (`llama-3.3-70b-versatile`) | Conversational heritage expert |
| AI: Image Gen | Hugging Face Stable Diffusion (`stabilityai/stable-diffusion-2-1`) | Storybook illustrations |
| AI: Classification | Hugging Face BART (`facebook/bart-large-mnli`) | Theme tagging |
| Video Assembly | FFMPEG | Illustration + audio → MP4 |
| Theme System | React Context (`ThemeProvider` / `useTheme()`) | Dark/light mode |
| Navigation | State-based (no React Navigation) | Avoids reanimated dependency |

---

## Frontend Architecture

### Navigation
Navigation is fully state-based. `App.tsx` holds `activeScreen: AppScreen` state and renders the correct screen directly. There is no React Navigation stack or drawer — this avoids the `react-native-reanimated` native module dependency.

```
App.tsx
├── ThemeProvider (wraps everything)
└── AppContent
    ├── TopBar (logo + auth button)
    ├── Sidebar (left nav — exports AppScreen type)
    └── Screen content (switch on activeScreen)
        ├── HomeScreen
        ├── DialectsScreen
        ├── HeritageVaultScreen
        ├── CulturalGuideScreen
        ├── RecordingScreen
        └── StoryViewScreen (overlay — shown when selectedStoryId is set)
```

### Theme System
Two color palettes (`darkColors`, `lightColors`) are defined in `frontend/src/theme/colors.ts`. The active palette is provided by `ThemeContext` and consumed via `useTheme()` in every component.

**Critical rule**: `StyleSheet.create()` executes at module load time, before any component renders and before `useTheme()` is available. All theme color values (`C.bg`, `C.text`, etc.) must be applied as **inline style props** in JSX — never inside `StyleSheet.create({})`.

### Screen Inventory

| Screen | File | Key Features |
|--------|------|-------------|
| Home | `HomeScreen.tsx` | Hero banner, recent stories, vault analytics |
| Dialect Translator | `DialectsScreen.tsx` | 5 dialects, two-panel layout, calls `/api/translate` |
| Heritage Vault | `HeritageVaultScreen.tsx` | Scrollable filter tabs (10 themes), multi-column grid |
| Cultural Guide | `CulturalGuideScreen.tsx` | Chat UI, full conversation history sent to `/api/guide` |
| Record Story | `RecordingScreen.tsx` | Audio / Document / Type tabs, category dropdown |
| Story View | `StoryViewScreen.tsx` | Storybook mode + Video mode tabs |

---

## Backend Architecture

### Route Map

| Mount Point | File | Description |
|-------------|------|-------------|
| `/api/auth` | `routes/auth.ts` | Register, login, refresh, logout, password reset |
| `/api/users` | `routes/users.ts` | Profile, favorites |
| `/api/stories` | `routes/stories.ts` | CRUD, listing, filters |
| `/api/upload` | `routes/upload.ts` | Audio / text / document upload + full AI pipeline |
| `/api/search` | `routes/search.ts` | Full-text search |
| `/api/media` | `routes/media.ts` | Media file URLs per story |
| `/api/comments` | `routes/comments.ts` | Comments, flagging |
| `/api/processing` | `routes/processing.ts` | AI pipeline job status |
| `/api/translate` | `routes/translate.ts` | Dialect → English via Groq |
| `/api/guide` | `routes/guide.ts` | Cultural Guide chat via Groq |

### AI Service Split (`backend/src/services/ai.ts`)

| Function | Provider | Model | Purpose |
|----------|----------|-------|---------|
| `transcribeAudio()` | HuggingFace SDK | `openai/whisper-base` | Audio → text |
| `translateText()` | HuggingFace SDK | `facebook/m2m100_418M` | Upload pipeline translation |
| `generateIllustration()` | HuggingFace SDK | `stabilityai/stable-diffusion-2-1` | Story illustrations |
| `generateSubtitles()` | HuggingFace SDK | `openai/whisper-base` | Timed subtitle chunks |
| `suggestThemes()` | HuggingFace SDK | `facebook/bart-large-mnli` | Zero-shot theme tagging |
| `translateDialectText()` | Groq (axios) | `llama-3.1-8b-instant` | Interactive dialect translation |
| `getCulturalGuideResponse()` | Groq (axios) | `llama-3.3-70b-versatile` | Conversational AI guide |

**Why Groq instead of HuggingFace for translate/guide:** The HuggingFace Inference SDK v2.x is hardcoded to use `api-inference.huggingface.co`, which has been deprecated. The NLLB and Mistral models used previously were also unavailable on the free inference tier. Groq provides free, fast, OpenAI-compatible inference with no warm-up delays.

---

## Database Schema

### Tables
```
users              — mirrors Supabase Auth; stores profile & role
storytellers       — elder/contributor profiles linked to stories
stories            — core content record with full-text search vector
media              — audio & video file URLs per story
translations       — original dialect text, English translation, subtitles JSONB
illustrations      — image URLs with page numbers per story
tags               — reusable theme/category labels
story_tags         — many-to-many: story ↔ tag
favorites          — user bookmarks
comments           — per-story comments with flagging
processing_jobs    — AI pipeline status tracker (pending→processing→completed/failed)
audit_log          — immutable record of all write actions (service-role only)
```

### Key Design Decisions
- **RLS (Row Level Security)** enabled on all tables — see `database/rls_policies.sql`
- **Full-text search** via `tsvector` column + GIN index on `stories(title, theme, language, country)`
- **`updated_at` triggers** on stories, users, comments, processing_jobs
- **Soft delete** preferred: use `is_published = false` rather than deleting stories
- **Service-role key** required for audit_log and processing_job writes (bypasses RLS safely)

### User Roles
| Role | Can Do |
|------|--------|
| `user` | Upload stories, comment, favorite, edit own content |
| `moderator` | Update any story, flag/remove comments |
| `admin` | Full access, read audit log, delete stories |

---

## Security Layers

### 1. HTTP Security (Helmet)
- Strict Transport Security, X-Content-Type, X-Frame-Options, CSP headers

### 2. Rate Limiting (`middleware/rateLimiter.ts`)
| Route | Window | Limit |
|-------|--------|-------|
| All API routes | 15 min | 100 req |
| `/api/upload/audio` | 1 hour | 10 uploads |
| `/api/search` | 1 min | 60 req |
| `/api/auth/*` | 15 min | 10 req (brute-force protection) |

### 3. Authentication (`middleware/auth.ts`)
- `requireAuth` — validates Supabase JWT, blocks unauthenticated
- `optionalAuth` — attaches user if token present, does not block
- `requireAdmin` — checks `users.role = 'admin'` after auth

### 4. Input Validation (`middleware/validate.ts`)
- All request bodies/queries validated with **Zod schemas**
- Reusable `validate(schema)` factory middleware
- Schemas enforce: string length limits, enum values, UUID formats

### 5. File Upload Security
- MIME type allowlist: `audio/mpeg, wav, ogg, webm, m4a, x-m4a, aac`
- 50MB file size hard limit
- Files stored in Supabase Storage, not on server disk

### 6. Database Security
- Anon key used for user-scoped queries (respects RLS)
- Service-role key used only for server-side writes (audit log, processing jobs)
- All inputs parameterized via Supabase client (SQL injection prevention)

### 7. API Key Security
- `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are backend-only — never exposed to frontend
- `HUGGINGFACE_API_TOKEN` is backend-only
- Frontend only receives the Supabase anon key (safe to expose — scoped by RLS)

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create account |
| POST | `/login` | Public | Get JWT tokens |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Optional | Invalidate session |
| POST | `/reset-password` | Public | Send reset email |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Required | Get own profile |
| PATCH | `/me` | Required | Update own profile |
| GET | `/:id` | Public | Get public profile |
| GET | `/me/stories` | Required | My uploaded stories |
| GET | `/me/favorites` | Required | My favorited stories |
| POST | `/me/favorites/:storyId` | Required | Add favorite |
| DELETE | `/me/favorites/:storyId` | Required | Remove favorite |

### Stories (`/api/stories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List stories (with filters + pagination) |
| GET | `/:id` | Public | Get story with all related data |
| POST | `/` | Required | Create story record |
| PATCH | `/:id` | Required (owner) | Update story metadata |

### Upload (`/api/upload`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/audio` | Optional | Upload + full AI processing pipeline |
| POST | `/text` | Optional | Submit typed story text |
| POST | `/document` | Optional | Upload PDF/DOCX story document |

### Search (`/api/search`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | Full-text search + filters |

### Comments (`/api/comments`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/story/:id` | Public | Get story comments |
| POST | `/story/:id` | Required | Post comment |
| PATCH | `/:id` | Required (owner) | Edit own comment |
| DELETE | `/:id` | Required (owner/mod) | Delete comment |
| POST | `/:id/flag` | Required | Flag for review |

### Media (`/api/media`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/story/:storyId` | Public | Get all media for story |

### Processing (`/api/processing`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:storyId` | Public | Get AI pipeline job status |

### Dialect Translation (`/api/translate`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Public | Translate dialect text → English via Groq |

Request body: `{ text: string, sourceDialect: "Jamaican Patois" | "Nigerian Pidgin" | "Haitian Kreyòl" | "Trinidadian Slang" | "Louisiana Creole" }`
Response: `{ translation: string, sourceDialect: string }`

### Cultural Guide (`/api/guide`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Public | Send message to Heritage AI Guide; returns AI reply |

Request body: `{ messages: Array<{ role: "user" | "assistant", content: string }> }` (last 10 kept)
Response: `{ reply: string }`

---

## Heritage Vault Theme Filters

The vault supports 10 theme categories, stored lowercase in the database:

| Filter ID | Label |
|-----------|-------|
| `all` | ALL |
| `folklore` | Folklore |
| `moral` | Moral |
| `personal` | Personal |
| `history` | History |
| `ancestral` | Ancestral |
| `tradition` | Tradition |
| `legend` | Legend |
| `fable` | Fable |
| `anansi` | Anansi |

Stories without a matching theme only appear under **ALL**. All saves normalize to lowercase; filters use `ilike`.

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-side writes — never expose to frontend

# AI — HuggingFace (transcription, image gen, theme classification)
HUGGINGFACE_API_TOKEN=hf_...       # from huggingface.co/settings/tokens

# AI — Groq (dialect translation + Cultural Guide chat)
GROQ_API_KEY=gsk_...               # from console.groq.com — free tier available

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://<your-lan-ip>:8081

# Auth
PASSWORD_RESET_REDIRECT_URL=http://localhost:8081/reset-password
```

### Frontend (`frontend/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# EXPO_PUBLIC_API_URL=             # only set for production; auto-detected in dev
```

---

## Setup Checklist (Fresh Install)

1. Run `backend/database/schema.sql` in Supabase SQL editor
2. Run `backend/database/rls_policies.sql` in Supabase SQL editor
3. Create Supabase Storage bucket `media` with public read access
4. Set up Supabase Auth (enable Email provider, configure redirect URLs)
5. Get a free Groq API key at [console.groq.com](https://console.groq.com)
6. Copy all values into `backend/.env`
7. `cd backend && npm install && npm run dev`
8. `cd frontend && npm install && npx expo start --clear`

---

## Remaining Features — Implementation Roadmap

### Priority 1: Core (Required for launch)

#### 1.1 Video Playback in App
**File**: `frontend/src/components/VideoMode.tsx`
- Replace placeholder with `expo-video` package
- Poll `/api/media/story/:id?type=video` every 5 seconds while `processing_jobs.status = 'processing'`
- Show processing progress bar using `processing_jobs.progress_pct`
- Fall back to audio + subtitle overlay if video not ready

#### 1.2 Auth Token Forwarding
**Files**: `frontend/src/services/api.ts`, `frontend/src/services/auth.ts`
- Attach `Authorization: Bearer <token>` header to all API requests after login
- Handle 401 responses by refreshing token or redirecting to login

---

### Priority 2: Discovery & Engagement

#### 2.1 Full-Text Search Upgrade
**File**: `backend/src/routes/search.ts`
- Use PostgreSQL `search_vector @@ to_tsquery()` for relevance-ranked results
- Add `ts_rank` to order results by relevance
- Include translation text in search (join to `translations` table)

#### 2.2 Story Collections / Playlists
**New tables**: `collections`, `collection_stories`
- Users can group stories into named collections
- Featured collections curated by admins

#### 2.3 Popularity & Trending
- Increment `stories.view_count` on each `GET /stories/:id`
- Add `GET /stories?sort=popular` query param

---

### Priority 3: Content Quality

#### 3.1 Subtitle Timing Accuracy
**File**: `backend/src/services/ai.ts`
- Replace estimated timing (0.5s/word) with Whisper's actual word-level timestamps

#### 3.2 Cultural Notes via Groq
**Column already in schema**: `translations.cultural_notes`
- After translation, call Groq to generate 2–3 sentences of cultural context
- Display in story detail screen as an expandable "Cultural Context" card

#### 3.3 Multi-Language Support
- M2M100 supports 100+ language pairs
- Add `source_language` and `target_language` to translation record

---

### Priority 4: Platform & Operations

#### 4.1 Moderation Dashboard
- List flagged comments (`is_flagged = true`)
- Admin route to unflag/delete

#### 4.2 Export / Download
- `GET /api/stories/:id/export.pdf` — generate PDF storybook
- `GET /api/stories/:id/export.mp4` — return video URL

#### 4.3 CI/CD & Deployment
- Add `Dockerfile` for backend
- GitHub Actions: lint → type-check → deploy to Railway/Render on main push
- Expo EAS Build for mobile release builds
