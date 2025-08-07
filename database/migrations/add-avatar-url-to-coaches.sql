-- Add avatar_url column to coaches table
-- This allows coaches to have profile pictures/avatars

-- Add the avatar_url column to the coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN coaches.avatar_url IS 'URL to the coach profile picture/avatar stored in S3';

-- Update RLS policy to allow coaches to update their own avatar_url
-- (assuming there's already a policy for coaches to update their own profiles)
-- The existing UPDATE policy should already cover this new column

-- Optional: Set default avatar for existing coaches (using the Eleve default avatar)
-- UPDATE coaches 
-- SET avatar_url = 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg' 
-- WHERE avatar_url IS NULL; 