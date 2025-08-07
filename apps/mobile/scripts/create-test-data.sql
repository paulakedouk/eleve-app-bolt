-- Create Test Data for Eleve App
-- Run this after running all the setup scripts
-- This creates a complete test environment for development

-- First, ensure we have all the required tables and extensions
-- (This assumes you've already run supabase-setup.sql, supabase-student-parent-extensions.sql, and supabase-family-onboarding.sql)

-- Create test business user (Coach)
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    encrypted_password,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    'b1234567-1234-1234-1234-123456789012',
    'coach@tryeleve.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Coach Johnson", "role": "business"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test business organization
INSERT INTO organizations (
    id,
    name,
    owner_id,
    subscription_plan,
    created_at,
    updated_at
) VALUES (
    'org12345-1234-1234-1234-123456789012',
    'Elite Skate Academy',
    'b1234567-1234-1234-1234-123456789012',
    'pro',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create business profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    'b1234567-1234-1234-1234-123456789012',
    'coach@tryeleve.com',
    'Coach Johnson',
    'business',
    'org12345-1234-1234-1234-123456789012',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test parent users
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    encrypted_password,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES 
(
    'p1234567-1234-1234-1234-123456789012',
    'parent1@example.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Sarah Johnson", "role": "parent"}'::jsonb,
    NOW(),
    NOW()
),
(
    'p2345678-1234-1234-1234-123456789012',
    'parent2@example.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Mike Thompson", "role": "parent"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create parent profiles
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    username,
    created_at,
    updated_at
) VALUES 
(
    'p1234567-1234-1234-1234-123456789012',
    'parent1@example.com',
    'Sarah Johnson',
    'parent',
    'org12345-1234-1234-1234-123456789012',
    'sarah_johnson',
    NOW(),
    NOW()
),
(
    'p2345678-1234-1234-1234-123456789012',
    'parent2@example.com',
    'Mike Thompson',
    'parent',
    'org12345-1234-1234-1234-123456789012',
    'mike_thompson',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test student users
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    encrypted_password,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES 
(
    's1234567-1234-1234-1234-123456789012',
    'student1@example.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Alex Johnson", "role": "student"}'::jsonb,
    NOW(),
    NOW()
),
(
    's2345678-1234-1234-1234-123456789012',
    'student2@example.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Emma Thompson", "role": "student"}'::jsonb,
    NOW(),
    NOW()
),
(
    's3456789-1234-1234-1234-123456789012',
    'student3@example.com',
    NOW(),
    '$2a$10$example.encrypted.password.hash',
    '{"full_name": "Jake Wilson", "role": "student"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test students
INSERT INTO students (
    id,
    name,
    level,
    age,
    coach_id,
    organization_id,
    user_id,
    xp_points,
    total_videos,
    landed_tricks,
    session_count,
    created_at,
    updated_at
) VALUES 
(
    'st123456-1234-1234-1234-123456789012',
    'Alex Johnson',
    'Intermediate',
    14,
    'b1234567-1234-1234-1234-123456789012',
    'org12345-1234-1234-1234-123456789012',
    's1234567-1234-1234-1234-123456789012',
    250,
    45,
    32,
    12,
    NOW(),
    NOW()
),
(
    'st234567-1234-1234-1234-123456789012',
    'Emma Thompson',
    'Advanced',
    16,
    'b1234567-1234-1234-1234-123456789012',
    'org12345-1234-1234-1234-123456789012',
    's2345678-1234-1234-1234-123456789012',
    480,
    78,
    65,
    20,
    NOW(),
    NOW()
),
(
    'st345678-1234-1234-1234-123456789012',
    'Jake Wilson',
    'Beginner',
    12,
    'b1234567-1234-1234-1234-123456789012',
    'org12345-1234-1234-1234-123456789012',
    's3456789-1234-1234-1234-123456789012',
    120,
    28,
    15,
    8,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create parent-child relationships
INSERT INTO parent_children (
    id,
    parent_id,
    student_id,
    created_at
) VALUES 
(
    'pc123456-1234-1234-1234-123456789012',
    'p1234567-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    NOW()
),
(
    'pc234567-1234-1234-1234-123456789012',
    'p2345678-1234-1234-1234-123456789012',
    'st234567-1234-1234-1234-123456789012',
    NOW()
),
(
    'pc345678-1234-1234-1234-123456789012',
    'p2345678-1234-1234-1234-123456789012',
    'st345678-1234-1234-1234-123456789012',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test badges
INSERT INTO badges (
    id,
    name,
    description,
    type,
    icon,
    requirements,
    xp_reward,
    organization_id,
    created_at,
    updated_at
) VALUES 
(
    'badge001-1234-1234-1234-123456789012',
    'First Kickflip',
    'Successfully landed your first kickflip!',
    'trick_mastery',
    'award',
    '{"trick": "kickflip", "landings": 1}',
    50,
    'org12345-1234-1234-1234-123456789012',
    NOW(),
    NOW()
),
(
    'badge002-1234-1234-1234-123456789012',
    '5 Sessions',
    'Attended 5 coaching sessions',
    'participation',
    'calendar',
    '{"sessions": 5}',
    25,
    'org12345-1234-1234-1234-123456789012',
    NOW(),
    NOW()
),
(
    'badge003-1234-1234-1234-123456789012',
    '50 Tricks',
    'Landed 50 tricks total',
    'consistency',
    'target',
    '{"total_tricks": 50}',
    100,
    'org12345-1234-1234-1234-123456789012',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create student badges (earned badges)
INSERT INTO student_badges (
    id,
    student_id,
    badge_id,
    earned_at
) VALUES 
(
    'sb123456-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    'badge001-1234-1234-1234-123456789012',
    NOW() - INTERVAL '2 days'
),
(
    'sb234567-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    'badge002-1234-1234-1234-123456789012',
    NOW() - INTERVAL '1 day'
),
(
    'sb345678-1234-1234-1234-123456789012',
    'st234567-1234-1234-1234-123456789012',
    'badge003-1234-1234-1234-123456789012',
    NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Create test achievements
INSERT INTO achievements (
    id,
    student_id,
    category,
    title,
    description,
    xp_earned,
    unlocked_at
) VALUES 
(
    'ach12345-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    'tricks',
    'Kickflip Master',
    'Landed 10 kickflips in a row',
    75,
    NOW() - INTERVAL '1 day'
),
(
    'ach23456-1234-1234-1234-123456789012',
    'st234567-1234-1234-1234-123456789012',
    'consistency',
    'Regular Rider',
    'Attended sessions for 4 weeks straight',
    100,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Create test notifications for parents
INSERT INTO notifications (
    id,
    recipient_id,
    type,
    title,
    message,
    data,
    read,
    created_at
) VALUES 
(
    'not12345-1234-1234-1234-123456789012',
    'p1234567-1234-1234-1234-123456789012',
    'badge_earned',
    'New Badge Earned!',
    'Alex earned the "First Kickflip" badge! 🛹',
    '{"badge_name": "First Kickflip", "child_name": "Alex"}',
    false,
    NOW() - INTERVAL '1 hour'
),
(
    'not23456-1234-1234-1234-123456789012',
    'p1234567-1234-1234-1234-123456789012',
    'session_summary',
    'Session Complete',
    'Alex completed a 60-minute session at Main Ramp with 75% success rate.',
    '{"session_id": "123", "environment": "Main Ramp", "success_rate": 75}',
    false,
    NOW() - INTERVAL '2 hours'
),
(
    'not34567-1234-1234-1234-123456789012',
    'p2345678-1234-1234-1234-123456789012',
    'progress_update',
    'Progress Milestone',
    'Emma has landed 50 tricks this month! Keep up the great work!',
    '{"milestone": "50_tricks", "child_name": "Emma"}',
    true,
    NOW() - INTERVAL '1 day'
),
(
    'not45678-1234-1234-1234-123456789012',
    'p2345678-1234-1234-1234-123456789012',
    'new_video',
    'New Video Available',
    'A new video of Jake practicing ollies is available for review.',
    '{"video_id": "456", "child_name": "Jake", "trick_name": "Ollie"}',
    true,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Create trick progress data
INSERT INTO trick_progress (
    id,
    student_id,
    trick_name,
    attempts,
    landings,
    success_rate,
    first_attempt_date,
    first_landing_date,
    last_attempt_date
) VALUES 
(
    'tp123456-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    'Kickflip',
    45,
    32,
    71,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '1 day'
),
(
    'tp234567-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    'Heelflip',
    25,
    15,
    60,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 days'
),
(
    'tp345678-1234-1234-1234-123456789012',
    'st234567-1234-1234-1234-123456789012',
    'Kickflip',
    80,
    65,
    81,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Create test sessions
INSERT INTO sessions (
    id,
    environment,
    environment_name,
    coach_id,
    organization_id,
    start_time,
    end_time,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'ses12345-1234-1234-1234-123456789012',
    'main_ramp',
    'Main Ramp',
    'b1234567-1234-1234-1234-123456789012',
    'org12345-1234-1234-1234-123456789012',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour'
),
(
    'ses23456-1234-1234-1234-123456789012',
    'street_course',
    'Street Course',
    'b1234567-1234-1234-1234-123456789012',
    'org12345-1234-1234-1234-123456789012',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '45 minutes',
    false,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Create session participants
INSERT INTO session_students (
    id,
    session_id,
    student_id,
    created_at
) VALUES 
(
    'ss123456-1234-1234-1234-123456789012',
    'ses12345-1234-1234-1234-123456789012',
    'st123456-1234-1234-1234-123456789012',
    NOW() - INTERVAL '1 day'
),
(
    'ss234567-1234-1234-1234-123456789012',
    'ses12345-1234-1234-1234-123456789012',
    'st234567-1234-1234-1234-123456789012',
    NOW() - INTERVAL '1 day'
),
(
    'ss345678-1234-1234-1234-123456789012',
    'ses23456-1234-1234-1234-123456789012',
    'st345678-1234-1234-1234-123456789012',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Update RLS policies to be more permissive for testing
-- This is for development only - tighten these in production

-- Allow all authenticated users to access test data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE trick_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_students DISABLE ROW LEVEL SECURITY;

-- For family_approvals table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'family_approvals') THEN
        EXECUTE 'ALTER TABLE family_approvals DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Create a function to reset test data
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void AS $$
BEGIN
    -- Clear existing test data
    DELETE FROM session_students WHERE session_id IN ('ses12345-1234-1234-1234-123456789012', 'ses23456-1234-1234-1234-123456789012');
    DELETE FROM sessions WHERE id IN ('ses12345-1234-1234-1234-123456789012', 'ses23456-1234-1234-1234-123456789012');
    DELETE FROM trick_progress WHERE student_id IN ('st123456-1234-1234-1234-123456789012', 'st234567-1234-1234-1234-123456789012', 'st345678-1234-1234-1234-123456789012');
    DELETE FROM notifications WHERE recipient_id IN ('p1234567-1234-1234-1234-123456789012', 'p2345678-1234-1234-1234-123456789012');
    DELETE FROM achievements WHERE student_id IN ('st123456-1234-1234-1234-123456789012', 'st234567-1234-1234-1234-123456789012', 'st345678-1234-1234-1234-123456789012');
    DELETE FROM student_badges WHERE student_id IN ('st123456-1234-1234-1234-123456789012', 'st234567-1234-1234-1234-123456789012', 'st345678-1234-1234-1234-123456789012');
    DELETE FROM badges WHERE organization_id = 'org12345-1234-1234-1234-123456789012';
    DELETE FROM parent_children WHERE parent_id IN ('p1234567-1234-1234-1234-123456789012', 'p2345678-1234-1234-1234-123456789012');
    DELETE FROM students WHERE organization_id = 'org12345-1234-1234-1234-123456789012';
    DELETE FROM profiles WHERE organization_id = 'org12345-1234-1234-1234-123456789012';
    DELETE FROM organizations WHERE id = 'org12345-1234-1234-1234-123456789012';
    DELETE FROM auth.users WHERE id IN ('b1234567-1234-1234-1234-123456789012', 'p1234567-1234-1234-1234-123456789012', 'p2345678-1234-1234-1234-123456789012', 's1234567-1234-1234-1234-123456789012', 's2345678-1234-1234-1234-123456789012', 's3456789-1234-1234-1234-123456789012');
    
    RAISE NOTICE 'Test data has been reset successfully!';
END;
$$ LANGUAGE plpgsql;

-- Test login credentials:
-- Business/Coach: coach@tryeleve.com / password123
-- Parent 1: parent1@example.com / password123 (child: Alex Johnson)
-- Parent 2: parent2@example.com / password123 (children: Emma Thompson, Jake Wilson)
-- Student 1: student1@example.com / password123 (Alex Johnson)
-- Student 2: student2@example.com / password123 (Emma Thompson)
-- Student 3: student3@example.com / password123 (Jake Wilson)

SELECT 'Test data created successfully!' as message;
SELECT 'Business User: coach@tryeleve.com' as login_info;
SELECT 'Parent Users: parent1@example.com, parent2@example.com' as parent_info;
SELECT 'Student Users: student1@example.com, student2@example.com, student3@example.com' as student_info; 