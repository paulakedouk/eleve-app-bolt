-- Test Data Script for Clean Schema
-- Run this AFTER running supabase-clean-reset.sql
-- This creates sample data to verify the new schema is working

-- 1. Create test organization
INSERT INTO organizations (id, name, slug) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Elite Skateboarding Academy', 'elite-skateboarding');

-- 2. Create test admin user (manually - normally done through auth signup)
-- First, insert into auth.users (this would normally be done by Supabase auth)
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@eliteskating.com',
    '$2a$10$dummy.encrypted.password.hash',
    NOW(),
    '{"full_name": "Sarah Johnson", "role": "admin"}'::jsonb
);

-- The profile will be created automatically by the trigger
-- But let's also add the admin relationship
INSERT INTO organization_admins (admin_id, organization_id, is_owner) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', true);

-- 3. Create test coach user
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'coach@eliteskating.com',
    '$2a$10$dummy.encrypted.password.hash',
    NOW(),
    '{"full_name": "Mike Torres", "role": "coach"}'::jsonb
);

-- Add coach to organization
INSERT INTO organization_members (user_id, organization_id, role) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'coach');

-- 4. Create test parent user
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'parent@eliteskating.com',
    '$2a$10$dummy.encrypted.password.hash',
    NOW(),
    '{"full_name": "Jessica Martinez", "role": "parent"}'::jsonb
);

-- Add parent to organization
INSERT INTO organization_members (user_id, organization_id, role) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'parent');

-- 5. Create test students
INSERT INTO students (
    id, 
    name, 
    username, 
    passcode, 
    age, 
    organization_id, 
    approved_by_admin
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Alex Martinez',
    'alex',
    '1234',
    12,
    '550e8400-e29b-41d4-a716-446655440000',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Emma Smith',
    'emma',
    '5678',
    14,
    '550e8400-e29b-41d4-a716-446655440000',
    false  -- Not approved yet
);

-- 6. Create student-parent relationships
INSERT INTO student_parents (student_id, parent_id) VALUES 
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003');

-- 7. Create coach assignments
INSERT INTO student_coach_assignments (student_id, coach_id, assigned_by) VALUES 
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001');

-- 8. Create test invitations
INSERT INTO invitations (
    email, 
    role, 
    organization_id, 
    invited_by, 
    token, 
    status
) VALUES 
(
    'newcoach@example.com',
    'coach',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'invite-token-123',
    'pending'
),
(
    'newparent@example.com',
    'parent',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'invite-token-456',
    'pending'
);

-- 9. Verify the data was created correctly
SELECT 'Test data created successfully!' AS message;

-- Show summary of created data
SELECT 
    'Organizations' AS table_name,
    COUNT(*) AS count
FROM organizations
UNION ALL
SELECT 
    'Profiles' AS table_name,
    COUNT(*) AS count
FROM profiles
UNION ALL
SELECT 
    'Organization Admins' AS table_name,
    COUNT(*) AS count
FROM organization_admins
UNION ALL
SELECT 
    'Organization Members' AS table_name,
    COUNT(*) AS count
FROM organization_members
UNION ALL
SELECT 
    'Students' AS table_name,
    COUNT(*) AS count
FROM students
UNION ALL
SELECT 
    'Student Parents' AS table_name,
    COUNT(*) AS count
FROM student_parents
UNION ALL
SELECT 
    'Student Coach Assignments' AS table_name,
    COUNT(*) AS count
FROM student_coach_assignments
UNION ALL
SELECT 
    'Invitations' AS table_name,
    COUNT(*) AS count
FROM invitations;

-- Display test data for verification
SELECT 
    o.name AS organization_name,
    p.full_name AS admin_name,
    p.email AS admin_email
FROM organizations o
JOIN organization_admins oa ON o.id = oa.organization_id
JOIN profiles p ON oa.admin_id = p.id
WHERE oa.is_owner = true;

SELECT 
    s.name AS student_name,
    s.username AS student_username,
    s.approved_by_admin AS is_approved,
    p.full_name AS parent_name,
    c.full_name AS coach_name
FROM students s
LEFT JOIN student_parents sp ON s.id = sp.student_id
LEFT JOIN profiles p ON sp.parent_id = p.id
LEFT JOIN student_coach_assignments sca ON s.id = sca.student_id
LEFT JOIN profiles c ON sca.coach_id = c.id
ORDER BY s.name; 