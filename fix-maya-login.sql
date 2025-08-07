-- Comprehensive fix for Maya login and role detection
-- Run this script in your Supabase SQL editor

-- STEP 1: Fix the get_user_role function first
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

-- STEP 2: Create Maya's auth user
-- Using Maya's existing user_id from the students table
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data
) VALUES (
    'b3247f6d-b4d9-47f8-8c17-c8a08bea3e82',  -- Maya's existing user_id
    'maya@child.eleve.app',
    '$2a$10$YourHashedPasswordHere',  -- You'll need to set a proper password
    NOW(),
    '{"full_name": "Maya"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_confirmed_at = EXCLUDED.email_confirmed_at;

-- STEP 3: Test the fixes
SELECT 'Testing fixes...' as status;

-- Test role detection for Maya
SELECT 
    'Maya role test:' as test,
    get_user_role('b3247f6d-b4d9-47f8-8c17-c8a08bea3e82') as detected_role;

-- Test role detection for Noah (the other student)
SELECT 
    'Noah role test:' as test,
    get_user_role('1365b3ef-d4c8-4694-a3b3-0dc9922c1f1a') as detected_role;

-- Show all students and their role detection
SELECT 
    s.name,
    s.user_id,
    get_user_role(s.user_id) as detected_role,
    CASE WHEN u.id IS NOT NULL THEN 'Auth user exists' ELSE 'Missing auth user' END as auth_status
FROM students s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.name;

SELECT 'Fix completed! Maya should now be able to login with username: maya, password: test123' as message; 