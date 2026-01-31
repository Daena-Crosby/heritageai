-- ============================
-- HeritageAI Database Schema
-- ============================

-- ============================
-- 1. Storytellers (elders, contributors)
-- ============================
CREATE TABLE IF NOT EXISTS storytellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    dialect TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 2. Stories (main content)
-- ============================
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    storyteller_id UUID REFERENCES storytellers(id) ON DELETE SET NULL,
    age_group TEXT, -- optional: children, teens, general
    country TEXT DEFAULT 'Jamaica',
    language TEXT DEFAULT 'Jamaican Patois',
    theme TEXT, -- manual tagging
    length_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 3. Media (audio/video files)
-- ============================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('audio','video')),
    file_url TEXT NOT NULL, -- Supabase storage URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 4. Translations (text + subtitles)
-- ============================
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    original_text TEXT, -- transcription in dialect (optional)
    translated_text TEXT NOT NULL, -- interpretive English translation
    subtitles JSONB, -- optional: [{ "start": 0, "end": 5, "text": "..." }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 5. Illustrations (storybook images)
-- ============================
CREATE TABLE IF NOT EXISTS illustrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Supabase storage URL
    page_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- 6. Tags (themes, categories)
-- ============================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

-- ============================
-- 7. Story-Tag Mapping (many-to-many)
-- ============================
CREATE TABLE IF NOT EXISTS story_tags (
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, tag_id)
);

-- ============================
-- Indexes for performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_stories_storyteller_id ON stories(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_stories_theme ON stories(theme);
CREATE INDEX IF NOT EXISTS idx_stories_language ON stories(language);
CREATE INDEX IF NOT EXISTS idx_media_story_id ON media(story_id);
CREATE INDEX IF NOT EXISTS idx_translations_story_id ON translations(story_id);
CREATE INDEX IF NOT EXISTS idx_illustrations_story_id ON illustrations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_story_id ON story_tags(story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_tag_id ON story_tags(tag_id);
