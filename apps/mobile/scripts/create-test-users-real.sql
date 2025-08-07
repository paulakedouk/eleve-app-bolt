-- Create Test Users with REAL UUIDs from Supabase
-- Use the actual UUIDs from your auth.users table

-- First, let's see what users we have
SELECT 'Current auth users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Create test organization using the parent user as owner
-- Parent: 78d73d6a-08a8-4b84-8f70-ef0eded17da3
-- Student: ab5c0003-c277-4bdb-aa4d-bcafc1161ee6

INSERT INTO organizations (id, name, owner_id, subscription_plan) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Skate School',
  '78d73d6a-08a8-4b84-8f70-ef0eded17da3', -- parent@test.com
  'free'
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Create coach profile (we'll use the parent as coach for now, or create a separate one)
INSERT INTO profiles (id, email, full_name, role, organization_id) 
VALUES (
  '78d73d6a-08a8-4b84-8f70-ef0eded17da3',
  'parent@test.com',
  'Test Parent/Coach',
  'business', -- Parent can also be coach for testing
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id;

-- Create student profile
INSERT INTO profiles (id, email, full_name, role, organization_id) 
VALUES (
  'ab5c0003-c277-4bdb-aa4d-bcafc1161ee6',
  'student@test.com',
  'Test Student',
  'student',
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id;

-- Create test students in the students table
INSERT INTO students (id, name, age, level, coach_id, organization_id) 
VALUES 
  (
    '22222222-2222-2222-2222-222222222222',
    'Alex Johnson',
    12,
    'Beginner',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3', -- parent as coach
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'Emma Davis',
    14,
    'Intermediate',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3', -- parent as coach
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    'Jake Wilson (Student User)',
    16,
    'Advanced',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3', -- parent as coach
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  level = EXCLUDED.level;

-- Create parent-children relationships if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_children') THEN
    INSERT INTO parent_children (parent_id, student_id) 
    VALUES 
      ('78d73d6a-08a8-4b84-8f70-ef0eded17da3', '22222222-2222-2222-2222-222222222222'), -- Alex
      ('78d73d6a-08a8-4b84-8f70-ef0eded17da3', '22222222-2222-2222-2222-222222222223')  -- Emma
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create test sessions (using correct column names: environment, environment_name)
INSERT INTO sessions (id, environment, environment_name, coach_id, is_active, organization_id) 
VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    'Outdoor',
    'Morning Skate Session',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3',
    true,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'Indoor',
    'Afternoon Tricks Practice',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3',
    false,
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO UPDATE SET 
  environment_name = EXCLUDED.environment_name,
  is_active = EXCLUDED.is_active;

-- Add students to sessions if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_students') THEN
    INSERT INTO session_students (session_id, student_id) 
    VALUES 
      ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
      ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223'),
      ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222224')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create test videos (with required video_url)
INSERT INTO videos (id, session_id, coach_id, video_url, trick_name, landed, upload_status) 
VALUES 
  (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3',
    'https://example.com/test-video-1.mp4',
    'Kickflip Attempt',
    true,
    'uploaded'
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    '33333333-3333-3333-3333-333333333334',
    '78d73d6a-08a8-4b84-8f70-ef0eded17da3',
    'https://example.com/test-video-2.mp4',
    'Heelflip Practice',
    false,
    'uploaded'
  )
ON CONFLICT (id) DO UPDATE SET 
  upload_status = EXCLUDED.upload_status;

-- Check what we created
SELECT 'Test data created successfully with REAL UUIDs!' as message;
SELECT 'Organizations:' as table_name, COUNT(*) as count FROM organizations;
SELECT 'Profiles:' as table_name, COUNT(*) as count FROM profiles;
SELECT 'Students:' as table_name, COUNT(*) as count FROM students;
SELECT 'Sessions:' as table_name, COUNT(*) as count FROM sessions WHERE organization_id = '11111111-1111-1111-1111-111111111111';
SELECT 'Videos:' as table_name, COUNT(*) as count FROM videos WHERE coach_id = '78d73d6a-08a8-4b84-8f70-ef0eded17da3';

-- Show what we can test now
SELECT '=== TEST CREDENTIALS ===' as info;
SELECT 'Parent Login: parent@test.com / test123456' as parent_login;
SELECT 'Student Login: student@test.com / test123456' as student_login;
SELECT 'Parent should see 2 children: Alex Johnson (12) and Emma Davis (14)' as parent_data;
SELECT 'Student user Jake Wilson (16) should see sessions and videos' as student_data; 