-- Make coach_id nullable in students table to allow students without assigned coaches
-- Run this in your Supabase SQL Editor

-- Remove NOT NULL constraint from coach_id in students table
ALTER TABLE students 
ALTER COLUMN coach_id DROP NOT NULL;

-- Update the constraint comment
COMMENT ON COLUMN students.coach_id IS 'Coach assigned to this student (nullable - students can exist without coaches initially)';

SELECT 'Student coach_id field made nullable successfully!' AS message; 