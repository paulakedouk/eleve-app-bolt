-- Migration: Add location field to videos table
-- Date: 2024-01-16

-- Add location field to videos table
ALTER TABLE videos 
ADD COLUMN location TEXT CHECK (location IN ('mini ramp', 'park', 'street', 'vert'));

-- Create index for location field
CREATE INDEX IF NOT EXISTS idx_videos_location ON videos(location);

-- Add comment
COMMENT ON COLUMN videos.location IS 'Location where the video was recorded: mini ramp, park, street, or vert'; 