-- Add parent_id column to students table for simplified parent-student relationship
-- This replaces the need for the parent_children junction table

-- Step 1: Add parent_id column to students table
ALTER TABLE students 
ADD COLUMN parent_id UUID REFERENCES auth.users(id);

-- Step 2: Migrate existing data from parent_children to students.parent_id
UPDATE students 
SET parent_id = pc.parent_id 
FROM parent_children pc 
WHERE students.id = pc.student_id;

-- Step 3: Add index for performance
CREATE INDEX idx_students_parent_id ON students(parent_id);

-- Step 4: Add RLS policy for parents to see their students
CREATE POLICY "Parents can view their own students" ON students
FOR SELECT USING (parent_id = auth.uid());

-- Step 5: Add RLS policy for parents to update their students
CREATE POLICY "Parents can update their own students" ON students
FOR UPDATE USING (parent_id = auth.uid());

-- Note: We keep the parent_children table for now in case we need to rollback
-- It can be dropped later after confirming everything works:
-- DROP TABLE parent_children;

-- Step 6: Update any existing RLS policies that might conflict
-- (This ensures the new policies take precedence) 