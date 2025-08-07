-- Fix get_user_role function to resolve ambiguous column reference
-- This fixes the "column reference user_id is ambiguous" error on mobile

-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- Create the corrected get_user_role function with explicit table references
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Check role-specific tables with explicit table.column references
    IF EXISTS (SELECT 1 FROM admins WHERE admins.id = user_id) THEN
        RETURN 'admin';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE coaches.id = user_id) THEN
        RETURN 'coach';
    ELSIF EXISTS (SELECT 1 FROM parents WHERE parents.id = user_id) THEN
        RETURN 'parent';
    ELSIF EXISTS (SELECT 1 FROM students WHERE students.id = user_id) THEN
        RETURN 'student';
    ELSIF EXISTS (SELECT 1 FROM partners WHERE partners.id = user_id) THEN
        RETURN 'partner';
    ELSE
        RETURN 'business'; -- Default for users not in any role table
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'get_user_role function updated successfully' AS message; 