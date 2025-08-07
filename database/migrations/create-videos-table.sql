-- Migration: Create videos table for storing video metadata with S3 URLs
-- Date: 2024-01-15

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File information
    uri TEXT NOT NULL, -- Local URI (for backwards compatibility)
    s3_url TEXT NOT NULL, -- S3 public URL
    s3_key TEXT, -- S3 key for future operations
    thumbnail_url TEXT, -- Thumbnail URL for video preview
    duration INTEGER NOT NULL DEFAULT 0, -- Duration in seconds
    
    -- Relationships
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_ids UUID[] NOT NULL DEFAULT '{}', -- Array of student IDs
    
    -- Content metadata
    trick_name TEXT,
    landed BOOLEAN,
    comment TEXT,
    has_voice_note BOOLEAN DEFAULT FALSE,
    
    -- Upload metadata
    upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'uploaded', 'failed')),
    upload_progress INTEGER DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_coach_id ON videos(coach_id);
CREATE INDEX IF NOT EXISTS idx_videos_organization_id ON videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_videos_student_ids ON videos USING GIN(student_ids);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_upload_status ON videos(upload_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_videos_updated_at ON videos;
CREATE TRIGGER trigger_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_videos_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Coaches can view their own videos
CREATE POLICY "Coaches can view their own videos" ON videos
    FOR SELECT
    USING (coach_id = auth.uid());

-- Coaches can insert their own videos
CREATE POLICY "Coaches can insert their own videos" ON videos
    FOR INSERT
    WITH CHECK (coach_id = auth.uid());

-- Coaches can update their own videos
CREATE POLICY "Coaches can update their own videos" ON videos
    FOR UPDATE
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- Coaches can delete their own videos
CREATE POLICY "Coaches can delete their own videos" ON videos
    FOR DELETE
    USING (coach_id = auth.uid());

-- Students can view videos where they are included
CREATE POLICY "Students can view videos they are in" ON videos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = auth.uid() 
            AND students.id = ANY(videos.student_ids)
        )
    );

-- Parents can view videos of their children
CREATE POLICY "Parents can view their children's videos" ON videos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.parent_id = auth.uid() 
            AND students.id = ANY(videos.student_ids)
        )
    );

-- Admins can view all videos in their organization
CREATE POLICY "Admins can view organization videos" ON videos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid() 
            AND admins.organization_id = videos.organization_id
        )
    );

-- Add comments
COMMENT ON TABLE videos IS 'Stores video metadata with S3 URLs and folder structure';
COMMENT ON COLUMN videos.uri IS 'Local URI for backwards compatibility';
COMMENT ON COLUMN videos.s3_url IS 'Public S3 URL for accessing the video';
COMMENT ON COLUMN videos.s3_key IS 'S3 key path: videos/{org_id}/{coach_id}/{student_id}/{timestamp}_{video_id}.mp4';
COMMENT ON COLUMN videos.student_ids IS 'Array of student IDs featured in the video';
COMMENT ON COLUMN videos.upload_status IS 'Track upload progress: pending, uploading, uploaded, failed';
COMMENT ON COLUMN videos.upload_progress IS 'Upload progress percentage (0-100)'; 