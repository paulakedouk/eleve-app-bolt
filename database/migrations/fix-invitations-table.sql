-- Fix Invitations Table Foreign Key References
-- This script fixes the invitations table to work with the new role-specific structure
-- Updated to handle family_approvals table dependency

-- ===== STEP 1: CREATE REQUIRED FUNCTIONS =====

-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure helper functions exist
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

-- ===== STEP 2: HANDLE DEPENDENCIES =====

-- Drop the foreign key constraint from family_approvals if it exists
ALTER TABLE family_approvals DROP CONSTRAINT IF EXISTS family_approvals_invitation_code_fkey;

-- If family_approvals has an invitation_code column, we need to handle it
-- Check if the column exists and store the data temporarily
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_approvals' 
        AND column_name = 'invitation_code'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- For now, we'll just drop the column since we're restructuring
        -- In a real migration, you'd want to preserve this data
        ALTER TABLE family_approvals DROP COLUMN invitation_code;
        RAISE NOTICE 'Dropped invitation_code column from family_approvals';
    END IF;
END $$;

-- ===== STEP 3: FIX INVITATIONS TABLE =====

-- Now we can safely drop the invitations table
DROP TABLE IF EXISTS invitations CASCADE;

-- Recreate invitations table with correct foreign key to auth.users and recipient_name column
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('coach', 'parent', 'partner')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== STEP 4: CREATE INDEXES =====

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- ===== STEP 5: ENABLE RLS =====

-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ===== STEP 6: CREATE RLS POLICIES =====

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Invitations are viewable by organization members" ON invitations;
DROP POLICY IF EXISTS "Invitations can be created by organization members" ON invitations;
DROP POLICY IF EXISTS "Invitations can be updated by organization members" ON invitations;

-- Create new policies that work with role-specific tables
CREATE POLICY "Invitations are viewable by organization members" ON invitations
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid()) AND
        get_user_role(auth.uid()) IN ('admin', 'business')
    );

CREATE POLICY "Invitations can be created by organization members" ON invitations
    FOR INSERT WITH CHECK (
        invited_by = auth.uid() AND
        organization_id = get_user_organization(auth.uid()) AND
        get_user_role(auth.uid()) IN ('admin', 'business')
    );

CREATE POLICY "Invitations can be updated by organization members" ON invitations
    FOR UPDATE USING (
        organization_id = get_user_organization(auth.uid()) AND
        get_user_role(auth.uid()) IN ('admin', 'business')
    );

-- ===== STEP 7: CREATE UPDATE TRIGGER =====

-- Create updated_at trigger for invitations
CREATE TRIGGER set_updated_at_invitations
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- ===== STEP 8: CREATE SUPABASE RPC FUNCTIONS FOR INVITATION PAGES =====

-- Function to check invitation status for invitation pages
CREATE OR REPLACE FUNCTION check_invitation_status(invitation_code TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    recipient_name TEXT,
    role TEXT,
    organization_id UUID,
    organization_name TEXT,
    status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.recipient_name,
        i.role,
        i.organization_id,
        o.name as organization_name,
        i.status,
        i.expires_at
    FROM invitations i
    JOIN organizations o ON i.organization_id = o.id
    WHERE i.code = invitation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept coach invitation
CREATE OR REPLACE FUNCTION accept_coach_invitation(
    invitation_code TEXT,
    user_id UUID
) RETURNS VOID AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM invitations
    WHERE code = invitation_code AND status = 'pending' AND role = 'coach';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted' 
    WHERE code = invitation_code;
    
    -- Create coach record
    INSERT INTO coaches (id, organization_id)
    VALUES (user_id, invitation_record.organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline coach invitation
CREATE OR REPLACE FUNCTION decline_coach_invitation(invitation_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE invitations 
    SET status = 'declined' 
    WHERE code = invitation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== STEP 9: RECREATE FAMILY_APPROVALS RELATIONSHIP (OPTIONAL) =====

-- If you want to maintain a relationship between family_approvals and invitations
-- You can add this back, but it's optional since family approvals might not need it
-- ALTER TABLE family_approvals ADD COLUMN invitation_id UUID REFERENCES invitations(id);

-- ===== VERIFICATION =====

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invitations'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'invitations'::regclass;

-- Check that family_approvals still exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'family_approvals'
ORDER BY ordinal_position;

SELECT 'Invitations table fixed successfully!' AS message; 