# Heritage AI — Architecture Overview

## Current Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile App | React Native + Expo | iOS, Android, Web |
| Backend API | Node.js + Express + TypeScript | REST API |
| Database | Supabase (PostgreSQL) | Persistent storage |
| Storage | Supabase Storage (S3) | Audio, video, images |
| Auth | Supabase Auth (JWT) | User accounts |
| AI: Speech-to-Text | Hugging Face Whisper | Dialect transcription |
| AI: Translation | Hugging Face M2M100 | Patois → English |
| AI: Image Gen | Hugging Face Stable Diffusion | Storybook illustrations |
| AI: Classification | Hugging Face BART | Theme tagging |
| Video Assembly | FFMPEG | Illustration + audio → MP4 |

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
- MIME type allowlist: `audio/mpeg, wav, ogg, webm, m4a`
- 50MB file size hard limit
- Files stored in Supabase Storage, not on server disk

### 6. Database Security
- Anon key used for user-scoped queries (respects RLS)
- Service-role key used only for server-side writes (audit log, processing jobs)
- All inputs parameterized via Supabase client (SQL injection prevention)

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

---

## Remaining Features — Implementation Roadmap

### Priority 1: Core (Required for launch)

#### 1.1 Video Playback in App
**File**: `frontend/src/components/VideoMode.tsx`
- Replace placeholder with `expo-video` package
- Poll `/api/media/story/:id?type=video` every 5 seconds while `processing_jobs.status = 'processing'`
- Show processing progress bar using `processing_jobs.progress_pct`
- Fall back to audio + subtitle overlay if video not ready

#### 1.2 Processing Status API
**New file**: `backend/src/routes/processing.ts`
- `GET /api/processing/:storyId` — returns `{ status, current_step, progress_pct, error_message }`
- Update `upload.ts` to create a `processing_jobs` record and update it at each pipeline step
- Use `supabaseAdmin` client for all processing_job writes

#### 1.3 Auth Integration in Frontend
**Files**: `frontend/src/services/api.ts`, new `frontend/src/screens/AuthScreen.tsx`
- Add login/register screens
- Store JWT in `expo-secure-store` (not AsyncStorage — it's plaintext)
- Attach `Authorization: Bearer <token>` header to all API requests
- Handle 401 responses by refreshing token or redirecting to login

---

### Priority 2: Discovery & Engagement

#### 2.1 Full-Text Search Upgrade
**File**: `backend/src/routes/search.ts`
- Use PostgreSQL `search_vector @@ to_tsquery()` for relevance-ranked results
- Add `ts_rank` to order results by relevance
- Include translation text in search (join to `translations` table)

**SQL to add to schema:**
```sql
-- In search route, use:
SELECT *, ts_rank(search_vector, query) AS rank
FROM stories, to_tsquery('english', $1) query
WHERE search_vector @@ query AND is_published = true
ORDER BY rank DESC;
```

#### 2.2 Story Collections / Playlists
**New tables**: `collections`, `collection_stories`
- Users can group stories into named collections
- Share collections via link
- Featured collections curated by admins

#### 2.3 Popularity & Trending
- Increment `stories.view_count` on each `GET /stories/:id`
- Add `GET /stories?sort=popular` query param
- Weekly trending: stories with most views in past 7 days (use `audit_log` or separate `views` table)

---

### Priority 3: Content Quality

#### 3.1 Subtitle Timing Accuracy
**File**: `backend/src/services/ai.ts`
- Replace estimated timing (0.5s/word) with Whisper's actual word-level timestamps
- Whisper returns `segments` with `start`/`end` — use these directly
- Store `segments` as subtitles JSONB: `[{ start, end, text, speaker? }]`

#### 3.2 Cultural Notes
**Column already in schema**: `translations.cultural_notes`
- Extend AI pipeline: after translation, call an LLM to generate 2-3 sentences of cultural context
- Display in story detail screen as an expandable "Cultural Context" card

#### 3.3 Multi-Language Support
- Currently hardcoded to Jamaican Patois → English
- M2M100 supports 100+ language pairs
- Add `source_language` and `target_language` to translation record
- Allow user to select target language on upload

---

### Priority 4: Platform & Operations

#### 4.1 Processing Job Visibility (Admin)
**New file**: `backend/src/routes/admin.ts`
- `GET /api/admin/processing` — list all jobs by status
- `POST /api/admin/processing/:id/retry` — re-queue failed jobs
- Protected by `requireAdmin` middleware

#### 4.2 Moderation Dashboard
- List flagged comments (`is_flagged = true`)
- `PATCH /api/admin/comments/:id/unflag` — clear flag
- `DELETE /api/admin/stories/:id` — remove inappropriate content
- Read audit log for investigation

#### 4.3 Export / Download
- `GET /api/stories/:id/export.pdf` — generate PDF storybook (illustrations + text)
- `GET /api/stories/:id/export.mp4` — return video URL or trigger generation
- Use `pdfkit` for PDF generation

#### 4.4 CI/CD & Deployment
- Add `Dockerfile` for backend
- GitHub Actions: lint → type-check → deploy to Railway/Render on main push
- Expo EAS Build for mobile release builds
- Environment-specific `.env` files: `.env.development`, `.env.production`

---

## Environment Variables

### Backend (`.env`)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NEW — needed for audit log + admin ops

# AI
HUGGINGFACE_API_TOKEN=hf_...

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,https://your-production-app.com

# Auth
PASSWORD_RESET_REDIRECT_URL=https://your-app.com/reset-password
```

### Frontend (`.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Setup Checklist (Fresh Install)

1. Run `backend/database/schema.sql` in Supabase SQL editor
2. Run `backend/database/rls_policies.sql` in Supabase SQL editor
3. Create Supabase Storage bucket `media` with public read access
4. Set up Supabase Auth (enable Email provider, configure redirect URLs)
5. Copy `.env.example` → `.env` in `backend/`, fill all values
6. `cd backend && npm install && npm run dev`
7. `cd frontend && npm install && npx expo start`
