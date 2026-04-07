-- Add synopsis column to translations table
-- Run this in Supabase SQL Editor

ALTER TABLE translations ADD COLUMN IF NOT EXISTS synopsis TEXT;

-- Add comment
COMMENT ON COLUMN translations.synopsis IS 'AI-generated summary of the story (2-3 sentences)';
