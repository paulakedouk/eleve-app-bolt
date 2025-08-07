-- Migration Strategy: From Single Profiles Table to Separate Role Tables
-- Execute these steps in order to safely migrate your database

-- ===== STEP 1: CREATE NEW TABLES =====

-- Create the new role-specific tables (from database-redesign-proposal.sql)
-- Run the full database-redesign-proposal.sql first

-- ===== STEP 2: MIGRATE EXISTING DATA =====

-- Migrate admins
INSERT INTO admins (id, organization_id, is_owner, created_at, updated_at)
SELECT 
    p.id,
    p.organization_id,
    CASE WHEN o.owner_id = p.id THEN TRUE ELSE FALSE END,
    p.created_at,
    p.updated_at
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE p.role = 'admin';

-- Migrate coaches
INSERT INTO coaches (id, organization_id, is_active, created_at, updated_at)
SELECT 
    p.id,
    p.organization_id,
    TRUE, -- Default to active
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'coach';

-- Migrate parents
INSERT INTO parents (id, organization_id, created_at, updated_at)
SELECT 
    p.id,
    p.organization_id,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.role = 'parent';

-- Update profiles table to keep only shared data
-- Remove role-specific columns (will be done later)

-- ===== STEP 3: MIGRATE STUDENT DATA =====

-- The students table already exists, but we need to ensure it matches the new structure
-- If your current students table has user_id references, we need to break those

-- Check current students table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students';

-- If students table has user_id, we'll need to update relationships
-- This depends on your current implementation

-- ===== STEP 4: UPDATE RELATIONSHIPS =====

-- Migrate parent-student relationships
-- This depends on your current parent_children table structure
INSERT INTO parent_student_relationships (parent_id, student_id, created_at)
SELECT 
    pc.parent_id,
    pc.student_id,
    pc.created_at
FROM parent_children pc
WHERE EXISTS (SELECT 1 FROM parents WHERE id = pc.parent_id);

-- ===== STEP 5: UPDATE APPLICATION CODE =====

-- Update your services to use the new table structure
-- Key changes needed:

/*
BEFORE (current approach):
- Query profiles table with role filter
- Handle nullable role-specific fields
- Complex role-based logic

AFTER (new approach):
- Query specific role tables
- Type-safe role-specific fields
- Clear role-based logic
*/

-- ===== STEP 6: UPDATE RLS POLICIES =====

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create new policies for role-specific tables
-- Admins
CREATE POLICY "Admins can view their own data" ON admins
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can update their own data" ON admins
    FOR UPDATE USING (id = auth.uid());

-- Coaches
CREATE POLICY "Coaches can view their own data" ON coaches
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Coaches can update their own data" ON coaches
    FOR UPDATE USING (id = auth.uid());

-- Parents
CREATE POLICY "Parents can view their own data" ON parents
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Parents can update their own data" ON parents
    FOR UPDATE USING (id = auth.uid());

-- Students (no auth.users reference)
CREATE POLICY "Students can be viewed by organization members" ON students
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid())
    );

-- ===== STEP 7: CLEAN UP OLD STRUCTURE =====

-- Remove role column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Remove other role-specific columns that were moved to dedicated tables
-- (Add specific columns based on your current structure)

-- ===== STEP 8: VERIFICATION =====

-- Verify data integrity
SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'admins' as table_name,
    COUNT(*) as count
FROM admins
UNION ALL
SELECT 
    'coaches' as table_name,
    COUNT(*) as count
FROM coaches
UNION ALL
SELECT 
    'parents' as table_name,
    COUNT(*) as count
FROM parents
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as count
FROM students;

-- Test role detection function
SELECT 
    id,
    email,
    get_user_role(id) as role,
    get_user_organization(id) as organization_id
FROM profiles
LIMIT 10;

-- ===== ROLLBACK PLAN =====

-- If migration fails, you can rollback by:
-- 1. Recreating the old profiles structure
-- 2. Migrating data back from role-specific tables
-- 3. Restoring original RLS policies

-- Keep this rollback script ready:
/*
-- Rollback: Add role column back to profiles
ALTER TABLE profiles ADD COLUMN role TEXT;

-- Migrate data back
UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM admins);
UPDATE profiles SET role = 'coach' WHERE id IN (SELECT id FROM coaches);
UPDATE profiles SET role = 'parent' WHERE id IN (SELECT id FROM parents);

-- Drop new tables (only if rollback is needed)
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS parent_student_relationships CASCADE;
DROP TABLE IF EXISTS coach_student_assignments CASCADE;
*/

-- ===== BENEFITS AFTER MIGRATION =====

/*
✅ IMMEDIATE BENEFITS:
1. Cleaner code - no more role checking everywhere
2. Type safety - role-specific fields are always present
3. Better performance - targeted queries per role
4. Easier maintenance - clear separation of concerns
5. Scalability - easy to add new roles or role-specific features

✅ LONG-TERM BENEFITS:
1. Audit trails - easier to track role-specific changes
2. Permissions - granular role-based access control
3. Reporting - role-specific analytics and insights
4. Integration - easier to integrate with third-party systems
5. Compliance - better data governance and privacy controls
*/ 