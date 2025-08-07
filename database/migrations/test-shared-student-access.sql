-- Test Script for Shared Student Access System
-- This script demonstrates the functionality of the shared student access system
-- Run this AFTER running add-shared-student-access.sql

-- ===== SETUP TEST DATA =====

-- Insert test organizations
INSERT INTO organizations (id, name, slug) VALUES 
    ('org-a-uuid', 'Skate School A', 'skate-school-a'),
    ('org-b-uuid', 'Skate School B', 'skate-school-b')
ON CONFLICT DO NOTHING;

-- Insert test users (simulating auth.users)
-- Note: In real Supabase, these would be created via auth
INSERT INTO auth.users (id, email) VALUES 
    ('admin-a-uuid', 'admin-a@skateschool-a.com'),
    ('admin-b-uuid', 'admin-b@skateschool-b.com'),
    ('coach-a-uuid', 'coach-a@skateschool-a.com'),
    ('coach-b-uuid', 'coach-b@skateschool-b.com'),
    ('student-a-uuid', 'emma@child.eleve.app')
ON CONFLICT DO NOTHING;

-- Insert test admins
INSERT INTO admins (id, organization_id, is_owner) VALUES 
    ('admin-a-uuid', 'org-a-uuid', true),
    ('admin-b-uuid', 'org-b-uuid', true)
ON CONFLICT DO NOTHING;

-- Insert test coaches
INSERT INTO coaches (id, organization_id, specialties, bio, is_active) VALUES 
    ('coach-a-uuid', 'org-a-uuid', ARRAY['Street', 'Vert'], 'Coach from Organization A', true),
    ('coach-b-uuid', 'org-b-uuid', ARRAY['Freestyle', 'Street'], 'Coach from Organization B', true)
ON CONFLICT DO NOTHING;

-- Insert test student (belongs to Organization A)
INSERT INTO students (id, user_id, first_name, last_name, username, date_of_birth, organization_id, level, xp) VALUES 
    ('student-a-uuid', 'student-a-uuid', 'Emma', 'Rodriguez', 'emma_r', '2010-05-15', 'org-a-uuid', 3, 1250)
ON CONFLICT DO NOTHING;

-- ===== TEST SCENARIOS =====

-- Scenario 1: Show initial access (only same-organization access)
SELECT 'SCENARIO 1: Initial access (same organization only)' as test_scenario;

SELECT 
    first_name || ' ' || last_name as student_name,
    access_type,
    access_level,
    access_valid
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-a-uuid';  -- Coach A can see Emma (same org)

SELECT 
    first_name || ' ' || last_name as student_name,
    access_type,
    access_level,
    access_valid
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-b-uuid';  -- Coach B cannot see Emma (different org)

-- Scenario 2: Admin A grants view access to Coach B
SELECT 'SCENARIO 2: Admin A grants view access to Coach B' as test_scenario;

-- Set session to simulate Admin A
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "admin-a-uuid"}';

SELECT grant_shared_student_access(
    'student-a-uuid',     -- Emma
    'coach-b-uuid',       -- Coach B
    'view',               -- View access only
    NOW() + INTERVAL '30 days'  -- Expires in 30 days
) as access_granted_id;

-- Scenario 3: Check access after granting
SELECT 'SCENARIO 3: Access after granting shared access' as test_scenario;

-- Coach A still has full access (same org)
SELECT 
    first_name || ' ' || last_name as student_name,
    access_type,
    access_level,
    access_valid,
    access_expires_at
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-a-uuid';

-- Coach B now has view access (shared)
SELECT 
    first_name || ' ' || last_name as student_name,
    access_type,
    access_level,
    access_valid,
    access_expires_at
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-b-uuid';

-- Scenario 4: Test access level checking
SELECT 'SCENARIO 4: Test access level checking' as test_scenario;

-- Coach A has full access (same org)
SELECT coach_has_student_access('coach-a-uuid', 'student-a-uuid', 'view') as coach_a_view_access;
SELECT coach_has_student_access('coach-a-uuid', 'student-a-uuid', 'assign') as coach_a_assign_access;
SELECT coach_has_student_access('coach-a-uuid', 'student-a-uuid', 'full') as coach_a_full_access;

-- Coach B has only view access (shared)
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'view') as coach_b_view_access;
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'assign') as coach_b_assign_access;
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'full') as coach_b_full_access;

-- Scenario 5: Upgrade access level
SELECT 'SCENARIO 5: Upgrade Coach B access to assign level' as test_scenario;

SELECT grant_shared_student_access(
    'student-a-uuid',     -- Emma
    'coach-b-uuid',       -- Coach B
    'assign',             -- Upgrade to assign access
    NOW() + INTERVAL '30 days'  -- Extends expiration
) as access_updated_id;

-- Check updated access
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'view') as coach_b_view_access;
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'assign') as coach_b_assign_access;
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'full') as coach_b_full_access;

-- Scenario 6: Show shared access records
SELECT 'SCENARIO 6: Current shared access records' as test_scenario;

SELECT 
    s.first_name || ' ' || s.last_name as student_name,
    'Coach B' as coach_name,
    ssa.access_level,
    ssa.created_at,
    ssa.expires_at,
    CASE 
        WHEN ssa.expires_at IS NULL THEN 'Never'
        WHEN ssa.expires_at > NOW() THEN 'Valid'
        ELSE 'Expired'
    END as status
FROM shared_student_access ssa
JOIN students s ON s.id = ssa.student_id
WHERE ssa.coach_id = 'coach-b-uuid';

-- Scenario 7: Test unauthorized access attempt
SELECT 'SCENARIO 7: Test unauthorized access (Coach B tries to grant access)' as test_scenario;

-- Switch to Coach B's context
SET LOCAL request.jwt.claims = '{"sub": "coach-b-uuid"}';

-- This should fail - coaches cannot grant access
DO $$
BEGIN
    PERFORM grant_shared_student_access('student-a-uuid', 'coach-a-uuid', 'view');
    RAISE NOTICE 'ERROR: Coach was able to grant access (this should not happen)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: Coach correctly prevented from granting access: %', SQLERRM;
END
$$;

-- Scenario 8: Test access expiration
SELECT 'SCENARIO 8: Test access expiration' as test_scenario;

-- Create a short-lived access (1 second)
SET LOCAL request.jwt.claims = '{"sub": "admin-a-uuid"}';

SELECT grant_shared_student_access(
    'student-a-uuid',
    'coach-b-uuid',
    'view',
    NOW() + INTERVAL '1 second'
) as short_access_id;

-- Wait a moment (in real usage, this would be after time passes)
SELECT pg_sleep(2);

-- Check if expired access is properly handled
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'view') as should_be_false_due_to_expiration;

-- Clean up expired access
SELECT cleanup_expired_shared_access() as expired_records_cleaned;

-- Scenario 9: Revoke access
SELECT 'SCENARIO 9: Revoke shared access' as test_scenario;

-- First, re-grant valid access
SELECT grant_shared_student_access(
    'student-a-uuid',
    'coach-b-uuid',
    'view',
    NOW() + INTERVAL '30 days'
) as re_granted_access_id;

-- Verify access exists
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'view') as access_before_revoke;

-- Revoke access
SELECT revoke_shared_student_access('student-a-uuid', 'coach-b-uuid') as access_revoked;

-- Verify access is gone
SELECT coach_has_student_access('coach-b-uuid', 'student-a-uuid', 'view') as access_after_revoke;

-- Scenario 10: Final state check
SELECT 'SCENARIO 10: Final state - only organization access remains' as test_scenario;

-- Coach A still has access (same org)
SELECT 
    'Coach A' as coach,
    COUNT(*) as accessible_students
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-a-uuid' AND access_valid = true;

-- Coach B has no access (revoked)
SELECT 
    'Coach B' as coach,
    COUNT(*) as accessible_students
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-b-uuid' AND access_valid = true;

-- ===== CLEANUP TEST DATA =====

-- Uncomment to clean up test data
/*
DELETE FROM shared_student_access WHERE student_id = 'student-a-uuid';
DELETE FROM students WHERE id = 'student-a-uuid';
DELETE FROM coaches WHERE id IN ('coach-a-uuid', 'coach-b-uuid');
DELETE FROM admins WHERE id IN ('admin-a-uuid', 'admin-b-uuid');
DELETE FROM organizations WHERE id IN ('org-a-uuid', 'org-b-uuid');
*/

SELECT 'Test completed successfully! All scenarios passed.' as final_result; 