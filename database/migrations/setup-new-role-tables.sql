-- Setup Script: Create Role-Specific Tables (Post-Profiles Deletion)
-- This script sets up the new role-specific tables and functions
-- Use this INSTEAD of migration-from-existing-database.sql since profiles table is deleted

-- ===== STEP 1: CREATE NEW ROLE-SPECIFIC TABLES =====

-- Update organizations table structure if needed
ALTER TABLE organizations DROP COLUMN IF EXISTS owner_id;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique constraint on slug for organizations
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Admins table - organization management
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches table - coaching-specific data
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

-- Parents table - parent-specific data
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

-- Partners table - business partners (if needed)
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

-- ===== STEP 2: CREATE RELATIONSHIP TABLES =====

-- Parent-Student relationships (replace parent_children if it exists)
CREATE TABLE IF NOT EXISTS parent_student_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Coach-Student assignments
CREATE TABLE IF NOT EXISTS coach_student_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coach_id, student_id)
);

-- ===== STEP 3: CREATE HELPER FUNCTIONS =====

-- Function to get user role (WITHOUT profiles table fallback)
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
        RETURN 'business'; -- Default for users not in any role table
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's organization (WITHOUT profiles table fallback)
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

-- ===== STEP 4: CREATE INDEXES =====

-- Role-specific indexes
CREATE INDEX IF NOT EXISTS idx_admins_organization_id ON admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_coaches_organization_id ON coaches(organization_id);
CREATE INDEX IF NOT EXISTS idx_parents_organization_id ON parents(organization_id);
CREATE INDEX IF NOT EXISTS idx_partners_organization_id ON partners(organization_id);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_parent_student_parent_id ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student_id ON parent_student_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_student_coach_id ON coach_student_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_student_student_id ON coach_student_assignments(student_id);

-- ===== STEP 5: ENABLE RLS =====

-- Enable RLS on new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_student_assignments ENABLE ROW LEVEL SECURITY;

-- ===== STEP 6: CREATE RLS POLICIES =====

-- Admins policies
CREATE POLICY "Admins can view their own data" ON admins
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can update their own data" ON admins
    FOR UPDATE USING (id = auth.uid());

-- Coaches policies
CREATE POLICY "Coaches can view their own data" ON coaches
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Coaches can update their own data" ON coaches
    FOR UPDATE USING (id = auth.uid());

-- Parents policies
CREATE POLICY "Parents can view their own data" ON parents
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Parents can update their own data" ON parents
    FOR UPDATE USING (id = auth.uid());

-- Partners policies
CREATE POLICY "Partners can view their own data" ON partners
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Partners can update their own data" ON partners
    FOR UPDATE USING (id = auth.uid());

-- Parent-Student relationships policies
CREATE POLICY "Parents can view their children" ON parent_student_relationships
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can manage their children relationships" ON parent_student_relationships
    FOR ALL USING (parent_id = auth.uid());

-- Coach-Student assignments policies
CREATE POLICY "Coaches can view their assignments" ON coach_student_assignments
    FOR SELECT USING (coach_id = auth.uid());

-- ===== STEP 7: VERIFICATION =====

-- Check that tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admins', 'coaches', 'parents', 'partners', 'parent_student_relationships', 'coach_student_assignments')
ORDER BY table_name;

-- Check that functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_role', 'get_user_organization', 'get_user_info')
ORDER BY routine_name;

-- Test the functions (if you have users in auth.users)
SELECT 
    'Testing get_user_role function' as test,
    get_user_role(id) as role
FROM auth.users 
LIMIT 3;

SELECT 'Setup complete! Role-specific tables and functions are ready.' AS message; 