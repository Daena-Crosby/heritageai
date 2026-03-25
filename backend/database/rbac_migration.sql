-- ============================
-- RBAC Migration
-- Run this in Supabase SQL Editor
-- ============================

-- 1. Add moderation fields to stories
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderation_note TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- 2. All existing published stories are considered approved
UPDATE stories SET moderation_status = 'approved' WHERE is_published = true;
UPDATE stories SET moderation_status = 'pending'  WHERE is_published = false AND moderation_status IS NULL;

-- 3. New stories start as pending (not published) — change default
ALTER TABLE stories ALTER COLUMN is_published SET DEFAULT false;

-- 4. Index for moderation queue lookups
CREATE INDEX IF NOT EXISTS idx_stories_moderation_status ON stories(moderation_status);
CREATE INDEX IF NOT EXISTS idx_stories_moderated_by     ON stories(moderated_by);

-- 5. Extend audit_log actions to include moderation actions
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
  CHECK (action IN (
    'upload', 'update', 'delete', 'login', 'register',
    'flag_comment', 'publish', 'unpublish',
    'approve_story', 'reject_story',
    'role_change', 'ban_user'
  ));
