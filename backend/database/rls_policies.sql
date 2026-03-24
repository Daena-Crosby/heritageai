-- ============================
-- HeritageAI Row Level Security Policies
-- Run this AFTER schema.sql in Supabase SQL editor
-- ============================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE illustrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storytellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================
-- USERS
-- ============================
-- Anyone can view user profiles
CREATE POLICY "User profiles are publicly readable"
    ON users FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE USING (auth.uid() = id);

-- Users are created automatically via Supabase Auth trigger
CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================
-- STORIES
-- ============================
-- Published stories visible to everyone
CREATE POLICY "Published stories are publicly readable"
    ON stories FOR SELECT USING (is_published = true);

-- Owners can see their own unpublished stories
CREATE POLICY "Owners can view own unpublished stories"
    ON stories FOR SELECT USING (auth.uid() = uploaded_by);

-- Authenticated users can upload stories
CREATE POLICY "Authenticated users can create stories"
    ON stories FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Only the uploader or admins can update a story
CREATE POLICY "Owners can update own stories"
    ON stories FOR UPDATE USING (
        auth.uid() = uploaded_by
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
        )
    );

-- Only admins can delete stories (soft delete preferred)
CREATE POLICY "Admins can delete stories"
    ON stories FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================
-- MEDIA (audio/video)
-- ============================
-- Public read for media linked to published stories
CREATE POLICY "Media for published stories is public"
    ON media FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = media.story_id AND stories.is_published = true
        )
    );

-- Authenticated users can add media to their own stories
CREATE POLICY "Owners can add media to their stories"
    ON media FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = media.story_id AND stories.uploaded_by = auth.uid()
        )
    );

-- ============================
-- TRANSLATIONS
-- ============================
CREATE POLICY "Translations for published stories are public"
    ON translations FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = translations.story_id AND stories.is_published = true
        )
    );

CREATE POLICY "Owners can add translations"
    ON translations FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = translations.story_id AND stories.uploaded_by = auth.uid()
        )
    );

-- ============================
-- ILLUSTRATIONS
-- ============================
CREATE POLICY "Illustrations for published stories are public"
    ON illustrations FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = illustrations.story_id AND stories.is_published = true
        )
    );

CREATE POLICY "Owners can add illustrations"
    ON illustrations FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = illustrations.story_id AND stories.uploaded_by = auth.uid()
        )
    );

-- ============================
-- STORYTELLERS
-- ============================
CREATE POLICY "Storytellers are publicly readable"
    ON storytellers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create storytellers"
    ON storytellers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their storytellers"
    ON storytellers FOR UPDATE USING (auth.uid() = created_by);

-- ============================
-- TAGS & STORY_TAGS
-- ============================
CREATE POLICY "Tags are publicly readable"
    ON tags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tags"
    ON tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Story tags are publicly readable"
    ON story_tags FOR SELECT USING (true);

CREATE POLICY "Owners can tag their stories"
    ON story_tags FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = story_tags.story_id AND stories.uploaded_by = auth.uid()
        )
    );

-- ============================
-- FAVORITES
-- ============================
CREATE POLICY "Users can see their own favorites"
    ON favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
    ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================
-- COMMENTS
-- ============================
-- Published story comments are public
CREATE POLICY "Comments on published stories are public"
    ON comments FOR SELECT USING (
        is_flagged = false
        AND EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = comments.story_id AND stories.is_published = true
        )
    );

-- Owners can see their own flagged comments
CREATE POLICY "Comment owners can see own flagged comments"
    ON comments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can comment"
    ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('moderator', 'admin')
        )
    );

-- ============================
-- PROCESSING JOBS
-- ============================
-- Users can see processing jobs for their own stories
CREATE POLICY "Owners can view processing status"
    ON processing_jobs FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = processing_jobs.story_id AND stories.uploaded_by = auth.uid()
        )
    );

-- Only backend (service role) should write to processing_jobs
-- No INSERT/UPDATE policies for authenticated users — use service role key in backend

-- ============================
-- AUDIT LOG
-- ============================
-- Only admins can read the full audit log
CREATE POLICY "Admins can read audit log"
    ON audit_log FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only backend (service role) should write audit logs
-- No INSERT policy for authenticated users — use service role key in backend

-- ============================
-- Auto-create user profile on signup
-- ============================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
