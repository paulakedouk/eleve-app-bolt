# Shared Student Access System

This guide explains the new cross-organizational student sharing feature that allows external coaches to view or track student progress across different organizations.

## Overview

The shared student access system enables:
- **Cross-organizational collaboration**: Coaches from different organizations can work with students
- **Granular access control**: Three levels of access (view, assign, full)
- **Temporary access**: Optional expiration dates for time-limited access
- **Admin control**: Only admins can grant/revoke access to their organization's students
- **Audit tracking**: Full history of who granted access and when

## Database Schema

### `shared_student_access` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `student_id` | UUID | Student being shared (FK to students.id) |
| `coach_id` | UUID | Coach receiving access (FK to coaches.id) |
| `granted_by` | UUID | Admin who granted access (FK to admins.id, nullable) |
| `access_level` | ENUM | Level of access: 'view', 'assign', 'full' |
| `created_at` | TIMESTAMP | When access was granted |
| `expires_at` | TIMESTAMP | Optional expiration date |

### `accessible_students_for_coach` View

Returns all students accessible by each coach with access details:
- Students from the same organization (full access)
- Students shared via `shared_student_access` (specified access level)

## Access Levels

### `view` (Default)
- Read-only access to student profile and progress
- Can view videos and session history
- Cannot assign tasks or modify data

### `assign`
- All `view` permissions
- Can assign tasks and goals to the student
- Can create session plans

### `full`
- All `assign` permissions
- Can modify student profile (limited)
- Can manage student's training data

## Usage Examples

### 1. Grant Access to External Coach

```sql
-- Admin from Organization A grants view access to a coach from Organization B
SELECT grant_shared_student_access(
    'student-uuid-here',           -- Student ID
    'external-coach-uuid-here',    -- Coach ID
    'view',                        -- Access level
    NOW() + INTERVAL '30 days'     -- Expires in 30 days (optional)
);
```

### 2. Check Coach Access to Student

```sql
-- Check if a coach has 'assign' level access to a student
SELECT coach_has_student_access(
    'coach-uuid-here',
    'student-uuid-here',
    'assign'
);
```

### 3. Get All Accessible Students for a Coach

```sql
-- Get all students accessible by a specific coach
SELECT 
    student_id,
    first_name,
    last_name,
    access_type,  -- 'organization' or 'shared'
    access_level, -- 'view', 'assign', or 'full'
    access_expires_at
FROM accessible_students_for_coach 
WHERE coach_id = 'coach-uuid-here'
AND access_valid = true;
```

### 4. Revoke Access

```sql
-- Admin revokes access
SELECT revoke_shared_student_access(
    'student-uuid-here',
    'coach-uuid-here'
);
```

### 5. Clean Up Expired Access

```sql
-- Remove all expired access records (run via cron job)
SELECT cleanup_expired_shared_access();
```

## Frontend Integration

### TypeScript Interfaces

```typescript
interface SharedStudentAccess {
  id: string;
  student_id: string;
  coach_id: string;
  granted_by?: string;
  access_level: 'view' | 'assign' | 'full';
  created_at: string;
  expires_at?: string;
}

interface AccessibleStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  username: string;
  access_type: 'organization' | 'shared';
  access_level: 'view' | 'assign' | 'full';
  access_valid: boolean;
  access_expires_at?: string;
}
```

### Example React Hook

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@shared/supabaseClient';

export function useAccessibleStudents(coachId: string) {
  const [students, setStudents] = useState<AccessibleStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessibleStudents = async () => {
      const { data, error } = await supabase
        .from('accessible_students_for_coach')
        .select('*')
        .eq('coach_id', coachId)
        .eq('access_valid', true);

      if (error) {
        console.error('Error fetching accessible students:', error);
      } else {
        setStudents(data || []);
      }
      setLoading(false);
    };

    fetchAccessibleStudents();
  }, [coachId]);

  return { students, loading };
}
```

### Admin Functions for Granting Access

```typescript
export async function grantStudentAccess(
  studentId: string,
  coachId: string,
  accessLevel: 'view' | 'assign' | 'full' = 'view',
  expiresInDays?: number
) {
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase.rpc('grant_shared_student_access', {
    p_student_id: studentId,
    p_coach_id: coachId,
    p_access_level: accessLevel,
    p_expires_at: expiresAt
  });

  if (error) throw error;
  return data;
}

export async function revokeStudentAccess(studentId: string, coachId: string) {
  const { data, error } = await supabase.rpc('revoke_shared_student_access', {
    p_student_id: studentId,
    p_coach_id: coachId
  });

  if (error) throw error;
  return data;
}
```

## Security Features

### Row Level Security (RLS)
- **Admins**: Can manage shared access for students in their organization
- **Coaches**: Can view their own shared access records
- **System**: Service role can manage all records

### Access Control
- Only admins can grant/revoke access to students in their organization
- Coaches cannot grant access to students they don't own
- Automatic expiration handling prevents stale access

### Audit Trail
- All access grants are tracked with `granted_by` admin
- Creation timestamps for all access records
- Optional expiration dates for temporary access

## Best Practices

1. **Use specific access levels**: Grant the minimum required access level
2. **Set expiration dates**: For temporary collaborations, always set an expiration
3. **Regular cleanup**: Run `cleanup_expired_shared_access()` daily via cron
4. **Monitor access**: Regularly review granted access in admin dashboards
5. **Revoke promptly**: Remove access when collaboration ends

## API Endpoints to Implement

Consider implementing these REST endpoints for the frontend:

- `POST /api/admin/students/{id}/share` - Grant access
- `DELETE /api/admin/students/{id}/share/{coachId}` - Revoke access
- `GET /api/admin/students/{id}/shared-access` - List current access
- `GET /api/coach/accessible-students` - Get coach's accessible students
- `GET /api/coach/students/{id}/access-level` - Check specific access level

## Migration Instructions

1. Run the migration file: `database/migrations/add-shared-student-access.sql`
2. Update your frontend permissions logic to use the new access system
3. Add UI components for admins to manage shared access
4. Update coach dashboards to show accessible students from both sources
5. Set up a cron job to run `cleanup_expired_shared_access()` daily

## Troubleshooting

### Common Issues

**Access not working after granting:**
- Check if the access has expired (`expires_at`)
- Verify the coach and student IDs are correct
- Ensure the admin granting access belongs to the student's organization

**Performance issues:**
- The view uses indexes on `coach_id`, `student_id`, and `expires_at`
- Consider adding additional indexes if querying by other columns frequently

**RLS policy conflicts:**
- Ensure the requesting user has the correct role
- Check that the user belongs to the expected organization

## Example User Flow

1. **Admin from Organization A** wants to share student "Emma" with **Coach from Organization B**
2. Admin navigates to Emma's profile → "Share Access" tab
3. Admin searches for the external coach by email/name
4. Admin selects access level ('view') and expiration (30 days)
5. System creates record in `shared_student_access`
6. External coach now sees Emma in their accessible students list
7. External coach can view Emma's progress within the granted permissions
8. After 30 days, access automatically expires and is cleaned up

This system provides a secure, flexible way to enable cross-organizational collaboration while maintaining proper access controls and audit trails. 