-- Fix Organizations Schema Migration
-- This script safely migrates the organizations table from owner_id to the new role-based structure

-- First, check if we need to migrate by seeing if owner_id exists
DO $$
BEGIN
    -- Check if owner_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'owner_id'
    ) THEN
        
        -- If owner_id exists, we need to migrate to the new structure
        RAISE NOTICE 'Migrating organizations table from owner_id to new role-based structure...';
        
        -- Step 1: Add slug column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'slug'
        ) THEN
            ALTER TABLE organizations ADD COLUMN slug TEXT;
            RAISE NOTICE 'Added slug column to organizations table';
        END IF;
        
        -- Step 2: Generate slugs from names for existing organizations
        UPDATE organizations 
        SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL;
        
        -- Step 3: Create admin records for existing organization owners
        INSERT INTO admins (id, organization_id, is_owner, created_at, updated_at)
        SELECT 
            owner_id,
            id,
            true,
            NOW(),
            NOW()
        FROM organizations
        WHERE owner_id IS NOT NULL
        ON CONFLICT (id) DO UPDATE SET
            is_owner = true,
            organization_id = EXCLUDED.organization_id;
        
        RAISE NOTICE 'Created admin records for existing organization owners';
        
        -- Step 4: Drop the owner_id column
        ALTER TABLE organizations DROP COLUMN owner_id;
        RAISE NOTICE 'Dropped owner_id column from organizations table';
        
        -- Step 5: Make slug column NOT NULL and unique
        ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);
        RAISE NOTICE 'Made slug column required and unique';
        
    ELSE
        RAISE NOTICE 'Organizations table already migrated - no changes needed';
    END IF;
END $$;

-- Ensure all required tables exist
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Update the helper functions to work with the new structure
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN 'admin';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN 'coach';
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN 'parent';
    ELSE
        RETURN 'business';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM admins WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM coaches WHERE id = user_id);
    ELSIF EXISTS (SELECT 1 FROM parents WHERE id = user_id) THEN
        RETURN (SELECT organization_id FROM parents WHERE id = user_id);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on role-specific tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can view their own data" ON admins;
DROP POLICY IF EXISTS "Admins can update their own data" ON admins;
DROP POLICY IF EXISTS "Coaches can view their own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can update their own data" ON coaches;
DROP POLICY IF EXISTS "Parents can view their own data" ON parents;
DROP POLICY IF EXISTS "Parents can update their own data" ON parents;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_organization_id ON admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_coaches_organization_id ON coaches(organization_id);
CREATE INDEX IF NOT EXISTS idx_parents_organization_id ON parents(organization_id);

SELECT 'Organizations schema migration completed successfully!' AS result; 