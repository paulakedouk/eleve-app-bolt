-- Fix get_user_organization function to resolve ambiguous column reference
-- This fixes additional "column reference user_id is ambiguous" errors in child account authentication

-- Fix get_user_organization function with explicit table references
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admins WHERE admins.id = user_id) THEN
        RETURN (SELECT organization_id FROM admins WHERE admins.id = user_id);
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE coaches.id = user_id) THEN
        RETURN (SELECT organization_id FROM coaches WHERE coaches.id = user_id);
    ELSIF EXISTS (SELECT 1 FROM parents WHERE parents.id = user_id) THEN
        RETURN (SELECT organization_id FROM parents WHERE parents.id = user_id);
    ELSIF EXISTS (SELECT 1 FROM students WHERE students.id = user_id) THEN
        RETURN (SELECT organization_id FROM students WHERE students.id = user_id);
    ELSIF EXISTS (SELECT 1 FROM partners WHERE partners.id = user_id) THEN
        RETURN (SELECT organization_id FROM partners WHERE partners.id = user_id);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'get_user_organization function updated - ambiguous user_id fixed' AS message; 