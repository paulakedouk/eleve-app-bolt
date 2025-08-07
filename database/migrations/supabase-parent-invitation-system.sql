-- Parent Invitation System for Supabase
-- Run this script in your Supabase SQL Editor

-- Create RPC function to send parent invitations
-- This function creates an invitation record and returns the invitation details
CREATE OR REPLACE FUNCTION send_parent_invitation(
    parent_name TEXT,
    parent_email TEXT,
    org_id UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_id UUID;
    invitation_code TEXT;
    organization_name TEXT;
    result JSON;
BEGIN
    -- Get organization name
    SELECT name INTO organization_name 
    FROM organizations 
    WHERE id = org_id;
    
    IF organization_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Organization not found'
        );
    END IF;

    -- Check if parent email already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE email = parent_email) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'A user with this email already exists'
        );
    END IF;

    -- Check if there's already a pending invitation for this email
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE email = parent_email 
        AND status = 'pending' 
        AND expires_at > NOW()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'An invitation for this email is already pending'
        );
    END IF;

    -- Generate a unique invitation code
    invitation_code := encode(gen_random_bytes(16), 'base64');
    -- Make it URL-safe
    invitation_code := replace(replace(invitation_code, '+', '-'), '/', '_');
    invitation_code := rtrim(invitation_code, '=');

    -- Create invitation record
    INSERT INTO invitations (
        code,
        email,
        role,
        organization_id,
        invited_by,
        status,
        expires_at
    ) VALUES (
        invitation_code,
        parent_email,
        'parent',
        org_id,
        auth.uid(),
        'pending',
        NOW() + INTERVAL '7 days'
    ) RETURNING id INTO invitation_id;

    -- Return success response
    result := json_build_object(
        'success', true,
        'message', 'Parent invitation created successfully',
        'invitation_id', invitation_id,
        'invitation_code', invitation_code,
        'organization_name', organization_name,
        'parent_email', parent_email,
        'parent_name', parent_name
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error creating parent invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate parent invitation and complete onboarding
CREATE OR REPLACE FUNCTION accept_parent_invitation(
    invitation_code TEXT,
    parent_password TEXT,
    parent_username TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    parent_user_id UUID;
    result JSON;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM invitations
    WHERE code = invitation_code
    AND status = 'pending'
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invitation code'
        );
    END IF;

    -- Check if role is parent
    IF invitation_record.role != 'parent' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'This invitation is not for a parent account'
        );
    END IF;

    -- Create the parent user account
    INSERT INTO auth.users (
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        role,
        aud
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        invitation_record.email,
        crypt(parent_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        json_build_object(
            'role', 'parent',
            'invitation_accepted', true,
            'username', parent_username
        ),
        'authenticated',
        'authenticated'
    ) RETURNING id INTO parent_user_id;

    -- Create profile for the parent
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role,
        organization_id,
        username
    ) VALUES (
        parent_user_id,
        invitation_record.email,
        COALESCE(parent_username, split_part(invitation_record.email, '@', 1)),
        'parent',
        invitation_record.organization_id,
        parent_username
    );

    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_record.id;

    -- Return success response
    result := json_build_object(
        'success', true,
        'message', 'Parent invitation accepted successfully',
        'parent_user_id', parent_user_id,
        'organization_id', invitation_record.organization_id
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error accepting parent invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create parent onboarding token (for secure links)
CREATE OR REPLACE FUNCTION create_parent_onboarding_token(
    parent_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    token_value TEXT;
    result JSON;
BEGIN
    -- Generate secure token
    token_value := encode(gen_random_bytes(32), 'base64');
    token_value := replace(replace(token_value, '+', '-'), '/', '_');
    token_value := rtrim(token_value, '=');

    -- Check if parent_onboarding_tokens table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'parent_onboarding_tokens'
    ) THEN
        -- Insert token
        INSERT INTO parent_onboarding_tokens (
            parent_id,
            token,
            expires_at
        ) VALUES (
            parent_user_id,
            token_value,
            NOW() + INTERVAL '7 days'
        );
    END IF;

    result := json_build_object(
        'success', true,
        'token', token_value,
        'expires_at', NOW() + INTERVAL '7 days'
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error creating parent onboarding token: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION send_parent_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_parent_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION create_parent_onboarding_token TO authenticated;

-- Success message
SELECT 'Parent invitation system created successfully!' AS message; 