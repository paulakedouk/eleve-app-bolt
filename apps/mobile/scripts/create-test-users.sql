-- Create Test Users for Development
-- STEP 1: First create these users in Supabase Dashboard > Authentication > Users
-- 
-- User 1: coach@test.com, password: test123456, user_id: 00000000-0000-0000-0000-000000000002
-- User 2: parent@test.com, password: test123456, user_id: 00000000-0000-0000-0000-000000000003
-- User 3: student@test.com, password: test123456, user_id: 00000000-0000-0000-0000-000000000004
--
-- STEP 2: Then run this SQL script

-- Alternative approach: Create with existing auth users if they exist
-- First, let's check what auth users exist
SELECT 'Current auth users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Create test organization with the first existing auth user as owner
-- If no users exist, you'll need to create them first
INSERT INTO organizations (id, name, owner_id, subscription_plan) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Test Skate School',
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'coach@test.com' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
  ),
  'free'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001');

-- Create test business/coach profile
INSERT INTO profiles (id, email, full_name, role, organization_id) 
SELECT 
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'coach@test.com' LIMIT 1),
    '00000000-0000-0000-0000-000000000002'
  ),
  'coach@test.com',
  'Test Coach',
  'business',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'coach@test.com');

-- Create test parent profile
INSERT INTO profiles (id, email, full_name, role, organization_id) 
SELECT 
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'parent@test.com' LIMIT 1),
    '00000000-0000-0000-0000-000000000003'
  ),
  'parent@test.com',
  'Test Parent',
  'parent',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'parent@test.com');

-- Create test students
INSERT INTO students (id, name, age, level, coach_id, organization_id) 
SELECT * FROM (
  VALUES 
    (
      '00000000-0000-0000-0000-000000000004',
      'Alex Johnson',
      12,
      'Beginner'::skill_level,
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      '00000000-0000-0000-0000-000000000001'
    ),
    (
      '00000000-0000-0000-0000-000000000005',
      'Emma Davis',
      14,
      'Intermediate'::skill_level,
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      '00000000-0000-0000-0000-000000000001'
    ),
    (
      '00000000-0000-0000-0000-000000000006',
      'Jake Wilson',
      16,
      'Advanced'::skill_level,
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      '00000000-0000-0000-0000-000000000001'
    )
) AS v(id, name, age, level, coach_id, organization_id)
WHERE NOT EXISTS (SELECT 1 FROM students WHERE students.id = v.id);

-- Create parent-children relationships (only if parent_children table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_children') THEN
    INSERT INTO parent_children (parent_id, student_id) 
    SELECT * FROM (
      VALUES 
        (
          COALESCE(
            (SELECT id FROM profiles WHERE email = 'parent@test.com' LIMIT 1),
            '00000000-0000-0000-0000-000000000003'
          ), 
          '00000000-0000-0000-0000-000000000004'
        ),
        (
          COALESCE(
            (SELECT id FROM profiles WHERE email = 'parent@test.com' LIMIT 1),
            '00000000-0000-0000-0000-000000000003'
          ), 
          '00000000-0000-0000-0000-000000000005'
        )
    ) AS v(parent_id, student_id)
    WHERE NOT EXISTS (SELECT 1 FROM parent_children WHERE parent_children.parent_id = v.parent_id AND parent_children.student_id = v.student_id);
  END IF;
END $$;

-- Create some test sessions
INSERT INTO sessions (id, title, coach_id, is_active, organization_id) 
SELECT * FROM (
  VALUES 
    (
      '00000000-0000-0000-0000-000000000007',
      'Morning Skate Session',
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      true,
      '00000000-0000-0000-0000-000000000001'
    ),
    (
      '00000000-0000-0000-0000-000000000008',
      'Afternoon Tricks Practice',
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      false,
      '00000000-0000-0000-0000-000000000001'
    )
) AS v(id, title, coach_id, is_active, organization_id)
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE sessions.id = v.id);

-- Add students to sessions (only if session_students table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_students') THEN
    INSERT INTO session_students (session_id, student_id) 
    SELECT * FROM (
      VALUES 
        ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004'),
        ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005'),
        ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006')
    ) AS v(session_id, student_id)
    WHERE NOT EXISTS (SELECT 1 FROM session_students WHERE session_students.session_id = v.session_id AND session_students.student_id = v.student_id);
  END IF;
END $$;

-- Create test videos
INSERT INTO videos (id, session_id, coach_id, upload_status, organization_id) 
SELECT * FROM (
  VALUES 
    (
      '00000000-0000-0000-0000-000000000009',
      '00000000-0000-0000-0000-000000000007',
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      'uploaded'::upload_status,
      '00000000-0000-0000-0000-000000000001'
    ),
    (
      '00000000-0000-0000-0000-000000000010',
      '00000000-0000-0000-0000-000000000008',
      COALESCE(
        (SELECT id FROM profiles WHERE email = 'coach@test.com' LIMIT 1),
        '00000000-0000-0000-0000-000000000002'
      ),
      'uploaded'::upload_status,
      '00000000-0000-0000-0000-000000000001'
    )
) AS v(id, session_id, coach_id, upload_status, organization_id)
WHERE NOT EXISTS (SELECT 1 FROM videos WHERE videos.id = v.id);

-- Check what we created
SELECT 'Test data created successfully!' as message;
SELECT 'Organizations:' as table_name, COUNT(*) as count FROM organizations;
SELECT 'Profiles:' as table_name, COUNT(*) as count FROM profiles;
SELECT 'Students:' as table_name, COUNT(*) as count FROM students;
SELECT 'Sessions:' as table_name, COUNT(*) as count FROM sessions;
SELECT 'Videos:' as table_name, COUNT(*) as count FROM videos;

-- Show the test users that should be created in Supabase Auth Dashboard
SELECT '=== IMPORTANT: CREATE THESE USERS IN SUPABASE DASHBOARD FIRST ===' as instruction;
SELECT 'Go to: Supabase Dashboard > Authentication > Users > Add User' as step_1;
SELECT 'User 1 - Email: coach@test.com, Password: test123456' as user_1;
SELECT 'User 2 - Email: parent@test.com, Password: test123456' as user_2;
SELECT 'User 3 - Email: student@test.com, Password: test123456' as user_3;
SELECT 'Then run this SQL script again to create the database records' as step_2; 