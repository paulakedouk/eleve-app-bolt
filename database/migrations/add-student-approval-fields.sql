-- Add approval and active status fields to students table
-- Run this in your Supabase SQL Editor

-- Add is_approved and is_active columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_is_approved ON students(is_approved);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- Update existing students to be approved and active by default
UPDATE students 
SET is_approved = true, is_active = true 
WHERE is_approved IS NULL OR is_active IS NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN students.is_approved IS 'Whether the student account has been approved by an admin';
COMMENT ON COLUMN students.is_active IS 'Whether the student account is currently active';

SELECT 'Student approval fields added successfully!' AS message; 