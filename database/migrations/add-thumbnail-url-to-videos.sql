-- Migration: Add thumbnail_url field to videos table
-- Date: 2025-01-05
-- Description: Add thumbnail URL support for video previews

-- Add thumbnail_url column if it doesn't exist
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add index for thumbnail_url for better query performance  
CREATE INDEX IF NOT EXISTS idx_videos_thumbnail_url ON videos(thumbnail_url);

-- Add comment to document the field
COMMENT ON COLUMN videos.thumbnail_url IS 'S3 URL for video thumbnail/preview image'; 