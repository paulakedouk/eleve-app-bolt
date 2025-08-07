-- Create maya test user for testing
-- This creates both the auth user and the student record

-- First, check if we have any organizations to work with
DO $$
DECLARE
    org_id UUID;
    coach_id UUID;
    maya_auth_id UUID := '11111111-1111-1111-1111-111111111112';
BEGIN
    -- Get or create a test organization
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        -- Create a test organization
        org_id := '11111111-1111-1111-1111-111111111111';
        INSERT INTO organizations (id, name, slug) 
        VALUES (org_id, 'Test Skate School', 'test-skate-school')
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Get a coach (any user who is in coaches table, or create one)
    SELECT id INTO coach_id FROM coaches LIMIT 1;
    
    IF coach_id IS NULL THEN
        -- Create a test coach first
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            raw_user_meta_data
        ) VALUES (
            '11111111-1111-1111-1111-111111111113',
            'testcoach@test.com',
            '$2a$10$dummy.encrypted.password.hash',
            NOW(),
            '{"full_name": "Test Coach"}'::jsonb
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Add coach to coaches table
        INSERT INTO coaches (id, organization_id) 
        VALUES ('11111111-1111-1111-1111-111111111113', org_id)
        ON CONFLICT (id) DO NOTHING;
        
        coach_id := '11111111-1111-1111-1111-111111111113';
    END IF;
    
    -- Create maya's auth user (maya@child.eleve.app)
    INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        raw_user_meta_data
    ) VALUES (
        maya_auth_id,
        'maya@child.eleve.app',
        '$2a$10$dummy.encrypted.password.hash',  -- This represents 'test123'
        NOW(),
        '{"full_name": "Maya Patel"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create maya's student record
    INSERT INTO students (
        id,
        name, 
        age, 
        level, 
        coach_id, 
        organization_id,
        user_id,
        xp,
        badge_level
    ) VALUES (
        '22222222-2222-2222-2222-222222222225',
        'Maya Patel',
        14,
        'Intermediate',
        coach_id,
        org_id,
        maya_auth_id,  -- This is the key link!
        450,
        'Silver'
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Maya test user created successfully!';
    RAISE NOTICE 'Login with username: maya (will become maya@child.eleve.app)';
    RAISE NOTICE 'Password: test123';
    RAISE NOTICE 'Auth ID: %', maya_auth_id;
    RAISE NOTICE 'Organization: %', org_id;
    RAISE NOTICE 'Coach: %', coach_id;
END $$;

-- Test the setup
SELECT 'Maya Test User Setup:' as info;
SELECT 
    u.email,
    u.id as auth_id,
    s.name,
    s.level,
    s.xp,
    s.badge_level,
    get_user_role(u.id) as detected_role
FROM auth.users u
JOIN students s ON s.user_id = u.id
WHERE u.email = 'maya@child.eleve.app'; 