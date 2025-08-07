-- Fix get_user_role function to properly detect students
-- Run this in your Supabase SQL editor

-- Drop and recreate the function with correct student detection
DROP FUNCTION IF EXISTS get_user_role(UUID);

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
    ELSIF EXISTS (SELECT 1 FROM students WHERE students.user_id = user_id) THEN
        RETURN 'student';
    ELSIF EXISTS (SELECT 1 FROM partners WHERE partners.id = user_id) THEN
        RETURN 'partner';
    ELSE
        RETURN 'business'; -- Default for users not in any role table
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the function with existing students
SELECT 'Testing role detection...' as status;

-- Test with Maya's user_id
SELECT 
    'Maya role test:' as test,
    get_user_role('b3247f6d-b4d9-47f8-8c17-c8a08bea3e82') as detected_role;

-- Test with Noah's user_id  
SELECT 
    'Noah role test:' as test,
    get_user_role('1365b3ef-d4c8-4694-a3b3-0dc9922c1f1a') as detected_role;

-- Show all students and check if they have auth users
SELECT 
    s.name,
    s.user_id,
    get_user_role(s.user_id) as detected_role,
    CASE WHEN u.id IS NOT NULL THEN 'Has auth user' ELSE 'Missing auth user' END as auth_status
FROM students s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.name;

SELECT 'Role function fixed! Now create auth user for Maya manually in Supabase Dashboard.' as next_step; 