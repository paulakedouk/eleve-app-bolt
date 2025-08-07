-- Family Onboarding System Database Extensions
-- Run this after the main supabase-setup.sql and supabase-student-parent-extensions.sql

-- Create enum for approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Create family_approvals table for managing family onboarding
CREATE TABLE family_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Business admin who created the parent
    status approval_status DEFAULT 'pending',
    children_data JSONB NOT NULL, -- Array of child information submitted by parent
    parent_notes TEXT, -- Additional notes from parent
    admin_notes TEXT, -- Notes from admin during approval
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parent_onboarding_tokens table for secure parent signup links
CREATE TABLE parent_onboarding_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_login_tokens table for student account setup
CREATE TABLE student_login_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add username support to profiles table
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;

-- Add username support to students table (for student login)
ALTER TABLE students ADD COLUMN username TEXT UNIQUE;

-- Create indexes for better performance
CREATE INDEX idx_family_approvals_parent_id ON family_approvals(parent_id);
CREATE INDEX idx_family_approvals_organization_id ON family_approvals(organization_id);
CREATE INDEX idx_family_approvals_status ON family_approvals(status);
CREATE INDEX idx_family_approvals_submitted_by ON family_approvals(submitted_by);
CREATE INDEX idx_parent_onboarding_tokens_parent_id ON parent_onboarding_tokens(parent_id);
CREATE INDEX idx_parent_onboarding_tokens_token ON parent_onboarding_tokens(token);
CREATE INDEX idx_student_login_tokens_student_id ON student_login_tokens(student_id);
CREATE INDEX idx_student_login_tokens_token ON student_login_tokens(token);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_students_username ON students(username);

-- Enable RLS on new tables
ALTER TABLE family_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_login_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family_approvals
CREATE POLICY "Parents can view their own approvals" ON family_approvals
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Business admins can view approvals for their organization" ON family_approvals
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

CREATE POLICY "Business admins can create approvals for their organization" ON family_approvals
    FOR INSERT WITH CHECK (
        submitted_by = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

CREATE POLICY "Business admins can update approvals for their organization" ON family_approvals
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

-- Create RLS policies for parent_onboarding_tokens
CREATE POLICY "Parents can view their own onboarding tokens" ON parent_onboarding_tokens
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "System can manage onboarding tokens" ON parent_onboarding_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for student_login_tokens
CREATE POLICY "Parents can view tokens for their children" ON student_login_tokens
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "System can manage student login tokens" ON student_login_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at triggers for new tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON family_approvals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to create parent onboarding token
CREATE OR REPLACE FUNCTION create_parent_onboarding_token(parent_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    token_value TEXT;
BEGIN
    token_value := generate_secure_token();
    
    INSERT INTO parent_onboarding_tokens (parent_id, token, expires_at)
    VALUES (parent_user_id, token_value, NOW() + INTERVAL '7 days');
    
    RETURN token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create student login token
CREATE OR REPLACE FUNCTION create_student_login_token(student_id UUID, parent_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    token_value TEXT;
BEGIN
    token_value := generate_secure_token();
    
    INSERT INTO student_login_tokens (student_id, parent_id, token, expires_at)
    VALUES (student_id, parent_user_id, token_value, NOW() + INTERVAL '7 days');
    
    RETURN token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use onboarding token
CREATE OR REPLACE FUNCTION validate_onboarding_token(token_value TEXT)
RETURNS UUID AS $$
DECLARE
    parent_user_id UUID;
BEGIN
    SELECT parent_id INTO parent_user_id 
    FROM parent_onboarding_tokens 
    WHERE token = token_value 
    AND expires_at > NOW() 
    AND used_at IS NULL;
    
    IF parent_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    -- Mark token as used
    UPDATE parent_onboarding_tokens 
    SET used_at = NOW() 
    WHERE token = token_value;
    
    RETURN parent_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use student login token
CREATE OR REPLACE FUNCTION validate_student_login_token(token_value TEXT)
RETURNS TABLE(student_id UUID, parent_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT slt.student_id, slt.parent_id
    FROM student_login_tokens slt
    WHERE slt.token = token_value 
    AND slt.expires_at > NOW() 
    AND slt.used_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    -- Mark token as used
    UPDATE student_login_tokens 
    SET used_at = NOW() 
    WHERE token = token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification triggers for approval status changes
CREATE OR REPLACE FUNCTION notify_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify parent when status changes
    IF OLD.status != NEW.status THEN
        INSERT INTO notifications (recipient_id, type, title, message, data)
        VALUES (
            NEW.parent_id,
            'progress_update',
            CASE 
                WHEN NEW.status = 'approved' THEN 'Family Application Approved!'
                WHEN NEW.status = 'rejected' THEN 'Family Application Update'
                ELSE 'Family Application Status Changed'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your family application has been approved. You will receive an email shortly with next steps.'
                WHEN NEW.status = 'rejected' THEN 'Your family application requires additional information. Please contact your coach.'
                ELSE 'Your family application status has been updated.'
            END,
            jsonb_build_object(
                'approval_id', NEW.id,
                'status', NEW.status,
                'approved_by', NEW.approved_by
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_status_notification
    AFTER UPDATE ON family_approvals
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_approval_status_change();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON family_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parent_onboarding_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_login_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION generate_secure_token() TO authenticated;
GRANT EXECUTE ON FUNCTION create_parent_onboarding_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_student_login_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_onboarding_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_student_login_token(TEXT) TO authenticated;

-- Success message
SELECT 'Family onboarding system created successfully!' AS message; 