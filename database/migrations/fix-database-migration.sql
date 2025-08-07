-- Fix Database Migration Issues
-- This script fixes the issues with the role-specific tables migration

-- ===== STEP 1: UPDATE ORGANIZATIONS TABLE =====
-- Add slug column if it doesn't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique constraint on slug
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_slug_unique') THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Generate slugs for existing organizations without slugs
UPDATE organizations 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ===== STEP 2: UPDATE TRIGGER FUNCTION =====
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new trigger function for role-specific tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    org_id UUID;
BEGIN
    -- Get role from user metadata
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- Default to 'business' if no role specified
    IF user_role IS NULL THEN
        user_role := 'business';
    END IF;
    
    -- For business users, we don't create a record yet - let the application handle it
    -- after organization creation
    IF user_role = 'business' THEN
        RETURN NEW;
    END IF;
    
    -- For other roles, create appropriate role-specific record
    -- Note: organization_id should be provided via metadata for non-business users
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    
    IF user_role = 'admin' THEN
        INSERT INTO public.admins (id, organization_id, is_owner)
        VALUES (NEW.id, org_id, false);
    ELSIF user_role = 'coach' THEN
        INSERT INTO public.coaches (id, organization_id)
        VALUES (NEW.id, org_id);
    ELSIF user_role = 'parent' THEN
        INSERT INTO public.parents (id, organization_id)
        VALUES (NEW.id, org_id);
    ELSIF user_role = 'partner' THEN
        INSERT INTO public.partners (id, organization_id)
        VALUES (NEW.id, org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== STEP 3: ENSURE ALL TABLES EXIST =====
-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coaches table if it doesn't exist
CREATE TABLE IF NOT EXISTS coaches (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    specialties TEXT[] DEFAULT '{}',
    certification_level TEXT,
    bio TEXT,
    hourly_rate DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parents table if it doesn't exist
CREATE TABLE IF NOT EXISTS parents (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_number TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    billing_address JSONB,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partners table if it doesn't exist
CREATE TABLE IF NOT EXISTS partners (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name TEXT,
    partnership_type TEXT,
    contact_info JSONB,
    agreement_details JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== STEP 4: ENSURE HELPER FUNCTIONS EXIST =====
-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN 'admin';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN 'coach';
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN 'parent';
    ELSIF EXISTS (SELECT 1 FROM partners WHERE id = user_id) THEN
        RETURN 'partner';
    ELSE
        RETURN 'business';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM admins WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM coaches WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM parents WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM partners WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM partners WHERE id = user_id);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's basic info
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

-- ===== STEP 5: ENABLE RLS ON TABLES =====
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- ===== STEP 6: CREATE RLS POLICIES =====
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view their own data" ON admins;
DROP POLICY IF EXISTS "Admins can update their own data" ON admins;
DROP POLICY IF EXISTS "Coaches can view their own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can update their own data" ON coaches;
DROP POLICY IF EXISTS "Parents can view their own data" ON parents;
DROP POLICY IF EXISTS "Parents can update their own data" ON parents;
DROP POLICY IF EXISTS "Partners can view their own data" ON partners;
DROP POLICY IF EXISTS "Partners can update their own data" ON partners;

-- Create new policies
CREATE POLICY "Admins can view their own data" ON admins
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can update their own data" ON admins
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Coaches can view their own data" ON coaches
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Coaches can update their own data" ON coaches
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Parents can view their own data" ON parents
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Parents can update their own data" ON parents
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Partners can view their own data" ON partners
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Partners can update their own data" ON partners
    FOR UPDATE USING (id = auth.uid());

-- ===== STEP 7: CREATE INDEXES =====
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_organization_id ON admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_coaches_organization_id ON coaches(organization_id);
CREATE INDEX IF NOT EXISTS idx_parents_organization_id ON parents(organization_id);
CREATE INDEX IF NOT EXISTS idx_partners_organization_id ON partners(organization_id);

-- ===== VERIFICATION =====
SELECT 'Database migration fix completed successfully!' AS message;

-- Show table counts
SELECT 
    'organizations' as table_name,
    COUNT(*) as count
FROM organizations
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