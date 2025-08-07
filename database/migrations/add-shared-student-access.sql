-- Migration: Add Shared Student Access for Cross-Organizational Collaboration
-- This allows external coaches (from different organizations) to view or track student progress
-- Date: 2024-12-29

-- ===== CREATE SHARED STUDENT ACCESS TABLE =====

-- Create enum for access levels
CREATE TYPE access_level AS ENUM ('view', 'assign', 'full');

-- Create shared_student_access table
CREATE TABLE shared_student_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    access_level access_level DEFAULT 'view' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure unique combination of student and coach
    UNIQUE(student_id, coach_id),
    
    -- Ensure expires_at is in the future if set
    CONSTRAINT expires_at_future CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Add comments for documentation
COMMENT ON TABLE shared_student_access IS 'Grants external coaches access to students from different organizations';
COMMENT ON COLUMN shared_student_access.student_id IS 'Student being shared';
COMMENT ON COLUMN shared_student_access.coach_id IS 'Coach receiving access';
COMMENT ON COLUMN shared_student_access.granted_by IS 'Admin who granted the access (nullable for system grants)';
COMMENT ON COLUMN shared_student_access.access_level IS 'Level of access: view (read-only), assign (can assign tasks), full (complete access)';
COMMENT ON COLUMN shared_student_access.expires_at IS 'Optional expiration timestamp for temporary access';

-- Create index for performance
CREATE INDEX idx_shared_student_access_coach_id ON shared_student_access(coach_id);
CREATE INDEX idx_shared_student_access_student_id ON shared_student_access(student_id);
CREATE INDEX idx_shared_student_access_expires_at ON shared_student_access(expires_at) WHERE expires_at IS NOT NULL;

-- ===== CREATE ACCESSIBLE STUDENTS VIEW =====

-- Create view that returns all students accessible by a coach
CREATE OR REPLACE VIEW accessible_students_for_coach AS
SELECT DISTINCT
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.username,
    s.date_of_birth,
    s.level,
    s.xp,
    s.organization_id,
    s.created_at as student_created_at,
    c.id as coach_id,
    c.organization_id as coach_organization_id,
    -- Access information
    CASE 
        WHEN s.organization_id = c.organization_id THEN 'organization'
        ELSE 'shared'
    END as access_type,
    CASE 
        WHEN s.organization_id = c.organization_id THEN 'full'
        ELSE COALESCE(ssa.access_level::text, 'view')
    END as access_level,
    ssa.granted_by,
    ssa.created_at as access_granted_at,
    ssa.expires_at as access_expires_at,
    -- Check if access is currently valid
    CASE 
        WHEN s.organization_id = c.organization_id THEN true
        WHEN ssa.expires_at IS NULL THEN true
        WHEN ssa.expires_at > NOW() THEN true
        ELSE false
    END as access_valid
FROM 
    students s
    CROSS JOIN coaches c
WHERE 
    -- Same organization access
    s.organization_id = c.organization_id
    OR
    -- Shared access that is not expired
    EXISTS (
        SELECT 1 
        FROM shared_student_access ssa2 
        WHERE ssa2.student_id = s.id 
        AND ssa2.coach_id = c.id
        AND (ssa2.expires_at IS NULL OR ssa2.expires_at > NOW())
    )
-- Left join to get shared access details when applicable
LEFT JOIN shared_student_access ssa ON (
    ssa.student_id = s.id 
    AND ssa.coach_id = c.id
    AND (ssa.expires_at IS NULL OR ssa.expires_at > NOW())
);

-- Add comment for the view
COMMENT ON VIEW accessible_students_for_coach IS 'Returns all students accessible by each coach through organization membership or shared access';

-- ===== ENABLE ROW LEVEL SECURITY =====

-- Enable RLS on the new table
ALTER TABLE shared_student_access ENABLE ROW LEVEL SECURITY;

-- ===== CREATE RLS POLICIES =====

-- Policy: Admins can manage shared access for their organization's students
CREATE POLICY "Admins can manage shared access for org students" ON shared_student_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins a 
            JOIN students s ON s.organization_id = a.organization_id
            WHERE a.id = auth.uid() 
            AND s.id = shared_student_access.student_id
        )
    );

-- Policy: Coaches can view their own shared access records
CREATE POLICY "Coaches can view their shared access" ON shared_student_access
    FOR SELECT USING (
        coach_id = auth.uid()
    );

-- Policy: System can manage all records (for functions/triggers)
CREATE POLICY "System can manage shared access" ON shared_student_access
    FOR ALL USING (
        current_setting('role') = 'service_role'
    );

-- ===== CREATE HELPER FUNCTIONS =====

-- Function to check if a coach has access to a student
CREATE OR REPLACE FUNCTION coach_has_student_access(
    p_coach_id UUID,
    p_student_id UUID,
    p_required_access_level access_level DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    coach_org_id UUID;
    student_org_id UUID;
    shared_access_level access_level;
    access_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get organization IDs
    SELECT organization_id INTO coach_org_id FROM coaches WHERE id = p_coach_id;
    SELECT organization_id INTO student_org_id FROM students WHERE id = p_student_id;
    
    -- Same organization = full access
    IF coach_org_id = student_org_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check shared access
    SELECT access_level, expires_at 
    INTO shared_access_level, access_expires
    FROM shared_student_access 
    WHERE coach_id = p_coach_id 
    AND student_id = p_student_id;
    
    -- No shared access found
    IF shared_access_level IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if access is expired
    IF access_expires IS NOT NULL AND access_expires <= NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check access level hierarchy: view < assign < full
    IF p_required_access_level = 'view' THEN
        RETURN TRUE; -- Any access level includes view
    ELSIF p_required_access_level = 'assign' THEN
        RETURN shared_access_level IN ('assign', 'full');
    ELSIF p_required_access_level = 'full' THEN
        RETURN shared_access_level = 'full';
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant shared access (can only be called by admins)
CREATE OR REPLACE FUNCTION grant_shared_student_access(
    p_student_id UUID,
    p_coach_id UUID,
    p_access_level access_level DEFAULT 'view',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_user_role TEXT;
    student_org_id UUID;
    admin_org_id UUID;
    access_id UUID;
BEGIN
    -- Check if current user is admin
    current_user_role := get_user_role(auth.uid());
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can grant shared student access';
    END IF;
    
    -- Check if admin belongs to student's organization
    SELECT organization_id INTO student_org_id FROM students WHERE id = p_student_id;
    SELECT organization_id INTO admin_org_id FROM admins WHERE id = auth.uid();
    
    IF student_org_id != admin_org_id THEN
        RAISE EXCEPTION 'Admin can only grant access to students in their organization';
    END IF;
    
    -- Insert or update shared access
    INSERT INTO shared_student_access (student_id, coach_id, granted_by, access_level, expires_at)
    VALUES (p_student_id, p_coach_id, auth.uid(), p_access_level, p_expires_at)
    ON CONFLICT (student_id, coach_id) 
    DO UPDATE SET 
        access_level = EXCLUDED.access_level,
        expires_at = EXCLUDED.expires_at,
        granted_by = EXCLUDED.granted_by
    RETURNING id INTO access_id;
    
    RETURN access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke shared access
CREATE OR REPLACE FUNCTION revoke_shared_student_access(
    p_student_id UUID,
    p_coach_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    student_org_id UUID;
    admin_org_id UUID;
BEGIN
    -- Check if current user is admin
    current_user_role := get_user_role(auth.uid());
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can revoke shared student access';
    END IF;
    
    -- Check if admin belongs to student's organization
    SELECT organization_id INTO student_org_id FROM students WHERE id = p_student_id;
    SELECT organization_id INTO admin_org_id FROM admins WHERE id = auth.uid();
    
    IF student_org_id != admin_org_id THEN
        RAISE EXCEPTION 'Admin can only revoke access to students in their organization';
    END IF;
    
    -- Delete the shared access record
    DELETE FROM shared_student_access 
    WHERE student_id = p_student_id AND coach_id = p_coach_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== CREATE CLEANUP FUNCTION FOR EXPIRED ACCESS =====

-- Function to clean up expired access records (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_shared_access()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shared_student_access 
    WHERE expires_at IS NOT NULL AND expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== GRANT PERMISSIONS =====

-- Grant necessary permissions to authenticated users
GRANT SELECT ON accessible_students_for_coach TO authenticated;
GRANT EXECUTE ON FUNCTION coach_has_student_access(UUID, UUID, access_level) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_shared_student_access(UUID, UUID, access_level, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_shared_student_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_shared_access() TO service_role;

-- Migration completed successfully
SELECT 'Migration completed: shared_student_access table and accessible_students_for_coach view created' as status; 