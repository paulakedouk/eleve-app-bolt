-- Fix Coaches RLS Policy: Allow admins to view coaches in their organization
-- Date: 2025-01-20

-- Add policy to allow admins to view coaches in their organization
CREATE POLICY "Admins can view organization coaches" ON coaches
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM admins WHERE id = auth.uid()
  )
);

-- Add policy to allow admins to view coach_student_assignments
CREATE POLICY "Admins can view organization coach assignments" ON coach_student_assignments
FOR SELECT USING (
  coach_id IN (
    SELECT c.id FROM coaches c
    JOIN admins a ON c.organization_id = a.organization_id
    WHERE a.id = auth.uid()
  )
);

-- Also add INSERT/UPDATE policies for admins to manage coach assignments
CREATE POLICY "Admins can manage organization coach assignments" ON coach_student_assignments
FOR ALL USING (
  coach_id IN (
    SELECT c.id FROM coaches c
    JOIN admins a ON c.organization_id = a.organization_id
    WHERE a.id = auth.uid()
  )
);

-- Add policy to allow admins to view students in their organization (needed for assignments)
CREATE POLICY "Admins can view organization students" ON students
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM admins WHERE id = auth.uid()
  )
); 