-- Fix RLS Policies for Role-Specific Tables
-- This script adds the missing INSERT policies that are causing the signup failures

-- Fix admins table policies
DROP POLICY IF EXISTS "Admins can insert their own data" ON admins;
DROP POLICY IF EXISTS "Authenticated users can create admin records" ON admins;

-- Allow users to create their own admin record during signup
CREATE POLICY "Users can create their own admin record" ON admins
    FOR INSERT WITH CHECK (id = auth.uid());

-- Also allow admins to insert other admin records (for invitations)
CREATE POLICY "Admins can create other admin records" ON admins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() 
            AND is_owner = true
        )
    );

-- Fix coaches table policies
DROP POLICY IF EXISTS "Coaches can insert their own data" ON coaches;
DROP POLICY IF EXISTS "Admins can create coach records" ON coaches;

CREATE POLICY "Users can create their own coach record" ON coaches
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can create coach records" ON coaches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() 
            AND organization_id = NEW.organization_id
        )
    );

-- Fix parents table policies  
DROP POLICY IF EXISTS "Parents can insert their own data" ON parents;
DROP POLICY IF EXISTS "Admins can create parent records" ON parents;

CREATE POLICY "Users can create their own parent record" ON parents
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can create parent records" ON parents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() 
            AND organization_id = NEW.organization_id
        )
    );

-- Also ensure organizations table has proper policies
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow organization owners and admins to update their organizations
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;

CREATE POLICY "Admins can update their organizations" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() 
            AND organization_id = organizations.id
            AND is_owner = true
        )
    );

-- Allow anyone to view organizations (needed for signup and general access)
DROP POLICY IF EXISTS "Organizations are publicly viewable" ON organizations;

CREATE POLICY "Organizations are publicly viewable" ON organizations
    FOR SELECT USING (true);

SELECT 'RLS policies fixed - business signup should work now!' AS result; 