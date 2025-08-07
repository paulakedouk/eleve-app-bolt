-- Add organization logo URL field migration
-- Run this in your Supabase SQL Editor

-- Add logo_url field to organizations table
ALTER TABLE organizations 
ADD COLUMN logo_url TEXT DEFAULT NULL;

-- Add comment to describe the field
COMMENT ON COLUMN organizations.logo_url IS 'URL to the organization logo stored in S3';

-- Set a default logo URL for existing organizations (optional)
-- This should be updated with your actual default logo URL once uploaded to S3
UPDATE organizations 
SET logo_url = 'https://eleve-native-app.s3.amazonaws.com/defaults/eleve-default-logo.png'
WHERE logo_url IS NULL;

-- Success message
SELECT 'Organization logo_url field added successfully!' AS message;