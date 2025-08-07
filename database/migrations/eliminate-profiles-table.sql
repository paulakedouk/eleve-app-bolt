-- Option 1: Eliminate Profiles Table (Recommended)
-- This script removes the profiles table and updates functions

-- ===== STEP 1: UPDATE HELPER FUNCTIONS =====

-- Updated get_user_role function (without profiles table)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Check role-specific tables only
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN 'admin';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN 'coach';
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN 'parent';
    ELSIF EXISTS (SELECT 1 FROM partners WHERE id = user_id) THEN
        RETURN 'partner';
    ELSE
        RETURN 'business'; -- Default for users not in any role table
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Updated get_user_organization function (without profiles table)
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Check role-specific tables only
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM admins WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM coaches WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM parents WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM partners WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM partners WHERE id = user_id);
    ELSE
        RETURN NULL; -- User not in any organization
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's basic info (from auth.users)
CREATE OR REPLACE FUNCTION get_user_info(user_id UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.raw_user_meta_data->>'avatar_url' as avatar_url,
        get_user_role(u.id) as role,
        get_user_organization(u.id) as organization_id
    FROM auth.users u
    WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 2: VERIFICATION QUERIES =====

-- Test the new functions
SELECT 'Testing functions without profiles table...' AS message;

-- Test get_user_info function
SELECT * FROM get_user_info(
    (SELECT id FROM auth.users LIMIT 1)
);

-- Check role distribution
SELECT 
    get_user_role(id) as role,
    COUNT(*) as count
FROM auth.users
GROUP BY get_user_role(id);

-- ===== STEP 3: WHAT TO DO WITH PROFILES TABLE =====

-- Option A: Keep profiles table for now (backward compatibility)
SELECT 'Keeping profiles table for backward compatibility' AS message;

-- Option B: Drop profiles table (clean architecture)
-- UNCOMMENT THESE LINES TO DROP THE TABLE:
-- 
-- DROP TABLE IF EXISTS profiles CASCADE;
-- SELECT 'Profiles table dropped - using auth.users + role tables only' AS message;

-- ===== STEP 4: UPDATE YOUR APPLICATION CODE =====

/*
BEFORE (with profiles table):
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

AFTER (without profiles table):
// Get basic user info
const { data: user } = await supabase.auth.getUser();

// Get role-specific data
const role = await supabase.rpc('get_user_role', { user_id: userId });
switch (role) {
  case 'admin':
    const adminData = await supabase.from('admins').select('*').eq('id', userId);
    break;
  case 'coach':
    const coachData = await supabase.from('coaches').select('*').eq('id', userId);
    break;
  // ... etc
}
*/

-- ===== VERIFICATION: WHAT DATA IS ACTUALLY SHARED? =====

-- Check what data would be lost if we drop profiles
SELECT 
    'Data in profiles table:' as info,
    COUNT(*) as total_profiles
FROM profiles;

-- Check if we have any profiles data that's not in auth.users
SELECT 
    'Users in auth.users:' as info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- Check what columns profiles has that auth.users doesn't
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name NOT IN ('id', 'email', 'created_at', 'updated_at');

-- Success message
SELECT 'Analysis complete! Check the results to decide on profiles table.' AS message; 