-- Test Business Signup Flow
-- This script tests the business signup flow after the migration fix

-- Test the helper functions
SELECT 'Testing helper functions...' AS test_phase;

-- Test get_user_role function (should return 'business' for unknown users)
SELECT get_user_role('00000000-0000-0000-0000-000000000000'::UUID) AS test_role;

-- Test get_user_organization function (should return NULL for unknown users)
SELECT get_user_organization('00000000-0000-0000-0000-000000000000'::UUID) AS test_org;

-- Test organizations table structure
SELECT 'Testing organizations table structure...' AS test_phase;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Test that required tables exist
SELECT 'Testing required tables exist...' AS test_phase;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'admins', 'coaches', 'parents', 'partners')
ORDER BY table_name;

-- Test that the trigger function exists
SELECT 'Testing trigger function exists...' AS test_phase;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- Test that the trigger exists
SELECT 'Testing trigger exists...' AS test_phase;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test RLS policies
SELECT 'Testing RLS policies...' AS test_phase;
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('admins', 'coaches', 'parents', 'partners')
ORDER BY tablename, policyname;

SELECT 'All tests completed!' AS result; 