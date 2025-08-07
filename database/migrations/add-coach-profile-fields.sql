-- Add Coach Profile Fields Migration
-- This migration adds the missing fields to the coaches table for proper profile data storage

-- ===== STEP 1: ADD NEW COLUMNS TO COACHES TABLE =====

-- Add full_name column
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add email column 
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add date_of_birth column
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add phone_number column
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add profile_completed column to track completion status
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add profile_completed_at timestamp
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- ===== STEP 2: ADD CONSTRAINTS AND VALIDATIONS =====

-- Add unique constraint on email within organization
-- (A coach's email should be unique within their organization)
CREATE UNIQUE INDEX IF NOT EXISTS coaches_email_org_unique 
ON coaches (email, organization_id) 
WHERE email IS NOT NULL;

-- Add check constraint for valid email format (optional but recommended)
ALTER TABLE coaches 
ADD CONSTRAINT coaches_email_format_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add check constraint for date_of_birth (must be reasonable age range)
ALTER TABLE coaches 
ADD CONSTRAINT coaches_age_check 
CHECK (date_of_birth IS NULL OR (
    date_of_birth >= '1920-01-01' AND 
    date_of_birth <= CURRENT_DATE - INTERVAL '16 years'
));

-- ===== STEP 3: UPDATE EXISTING RECORDS =====

-- For existing coaches, try to populate email from auth.users if possible
-- This helps maintain data consistency for coaches created before this migration
UPDATE coaches 
SET email = au.email,
    full_name = COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au 
WHERE coaches.id = au.id 
AND coaches.email IS NULL;

-- ===== STEP 4: CREATE HELPER FUNCTION FOR COMPLETE PROFILE =====

-- Function to update coach profile with all required information
CREATE OR REPLACE FUNCTION complete_coach_profile(
    coach_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_date_of_birth DATE,
    p_phone_number TEXT,
    p_specialties TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    -- Update the coach record with profile information
    UPDATE coaches 
    SET 
        full_name = p_full_name,
        email = p_email,
        date_of_birth = p_date_of_birth,
        phone_number = p_phone_number,
        specialties = p_specialties,
        profile_completed = TRUE,
        profile_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = coach_user_id;
    
    -- Check if update was successful
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if coach profile is complete
CREATE OR REPLACE FUNCTION is_coach_profile_complete(coach_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT profile_completed 
         FROM coaches 
         WHERE id = coach_user_id), 
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coach profile data
CREATE OR REPLACE FUNCTION get_coach_profile(coach_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    date_of_birth DATE,
    phone_number TEXT,
    specialties TEXT[],
    organization_id UUID,
    profile_completed BOOLEAN,
    profile_completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.full_name,
        c.email,
        c.date_of_birth,
        c.phone_number,
        c.specialties,
        c.organization_id,
        c.profile_completed,
        c.profile_completed_at
    FROM coaches c
    WHERE c.id = coach_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== STEP 5: UPDATE RLS POLICIES =====

-- Update existing RLS policies to handle new columns (if RLS is enabled)
-- The existing policies should automatically cover the new columns, but let's make sure

-- Drop and recreate the coaches select policy to include new fields
DROP POLICY IF EXISTS "Coaches can view their own data" ON coaches;
CREATE POLICY "Coaches can view their own data" ON coaches
    FOR SELECT USING (id = auth.uid());

-- Drop and recreate coaches update policy  
DROP POLICY IF EXISTS "Coaches can update their own data" ON coaches;
CREATE POLICY "Coaches can update their own data" ON coaches
    FOR UPDATE USING (id = auth.uid());

-- Allow organization admins to view coach profiles
DROP POLICY IF EXISTS "Organization admins can view coaches" ON coaches;
CREATE POLICY "Organization admins can view coaches" ON coaches
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM admins 
            WHERE id = auth.uid()
        )
    );

-- ===== STEP 6: VERIFICATION AND CLEANUP =====

-- Verify the new columns were added correctly
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'coaches'
AND column_name IN ('full_name', 'email', 'date_of_birth', 'phone_number', 'profile_completed', 'profile_completed_at')
ORDER BY column_name;

-- Display success message
SELECT 'Coach profile fields added successfully! New columns: full_name, email, date_of_birth, phone_number, profile_completed, profile_completed_at' AS migration_status;

-- Show sample of updated table structure
SELECT 
    id,
    full_name,
    email,
    date_of_birth,
    phone_number,
    specialties,
    profile_completed,
    organization_id
FROM coaches 
LIMIT 3; 