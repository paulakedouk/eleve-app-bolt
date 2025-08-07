-- Create test coach account for Elite Skating
-- Run this step by step in your Supabase SQL Editor

-- Step 1: Create organization first
INSERT INTO organizations (name, owner_id, subscription_plan)
VALUES ('Elite Skating', '00000000-0000-0000-0000-000000000000', 'free')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Get the organization ID (run this to see the org ID)
SELECT id, name FROM organizations WHERE name = 'Elite Skating';

-- Step 3: After creating the auth user through Supabase Dashboard,
-- create the profile (replace USER_ID with actual auth user ID from dashboard)

-- Template for coach profile (update USER_ID after creating auth user):
/*
INSERT INTO profiles (id, email, full_name, role, organization_id)
VALUES (
    'USER_ID_FROM_SUPABASE_AUTH_DASHBOARD', 
    'coach@eliteskating.com',
    'Elite Skating Coach',
    'coach',
    (SELECT id FROM organizations WHERE name = 'Elite Skating')
);
*/

-- Step 4: Verify the setup
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    o.name as organization_name,
    p.created_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.email = 'coach@eliteskating.com';

-- Step 5: Check auth user exists
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'coach@eliteskating.com'; 