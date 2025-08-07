-- Family Approvals Table for Parent Registration Workflow
-- Run this in your Supabase SQL Editor

-- Create enum for approval status
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create family_approvals table
CREATE TABLE IF NOT EXISTS family_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_code TEXT NOT NULL REFERENCES invitations(code) ON DELETE CASCADE,
    parent_email TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_username TEXT,
    parent_password_hash TEXT NOT NULL,
    children_data JSONB NOT NULL, -- Array of child information
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status approval_status DEFAULT 'pending',
    admin_notes TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_approvals_status ON family_approvals(status);
CREATE INDEX IF NOT EXISTS idx_family_approvals_organization ON family_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_family_approvals_parent_email ON family_approvals(parent_email);
CREATE INDEX IF NOT EXISTS idx_family_approvals_invitation_code ON family_approvals(invitation_code);

-- Enable RLS
ALTER TABLE family_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies for family_approvals
CREATE POLICY "Family approvals are viewable by organization admins" ON family_approvals
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

CREATE POLICY "Family approvals can be created by anyone with valid invitation" ON family_approvals
    FOR INSERT WITH CHECK (true); -- We'll validate invitation in the function

CREATE POLICY "Family approvals can be updated by organization admins" ON family_approvals
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

-- Add updated_at trigger
CREATE TRIGGER set_family_approvals_updated_at 
    BEFORE UPDATE ON family_approvals 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create function to process family approval
CREATE OR REPLACE FUNCTION process_family_approval(
    approval_id UUID,
    approval_status TEXT,
    admin_notes_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    approval_record RECORD;
    result JSON;
BEGIN
    -- Get approval record
    SELECT * INTO approval_record
    FROM family_approvals
    WHERE id = approval_id
    AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Approval not found or already processed'
        );
    END IF;

    -- Update approval status
    UPDATE family_approvals 
    SET 
        status = approval_status::approval_status,
        admin_notes = admin_notes_text,
        approved_by = auth.uid(),
        approved_at = CASE WHEN approval_status = 'approved' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = approval_id;

    IF approval_status = 'approved' THEN
        -- Update invitation status
        UPDATE invitations 
        SET status = 'accepted', updated_at = NOW()
        WHERE code = approval_record.invitation_code;
        
        -- Note: Account creation will be handled by the admin interface
        -- The approved registration data is stored in the family_approvals table
    END IF;

    result := json_build_object(
        'success', true,
        'message', 'Family approval processed successfully',
        'status', approval_status,
        'approval_id', approval_id
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error processing family approval: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON family_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION process_family_approval TO authenticated;

SELECT 'Family approvals table and functions created successfully!' AS message; 