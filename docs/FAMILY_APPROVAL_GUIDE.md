# Family Approval System Guide

This guide explains how to use the family approval system in Eleve, including the `approveFamilyRequest` Supabase Edge Function.

## Overview

The family approval system allows parents to register their children's accounts, which then require admin approval before the accounts become active. This ensures proper oversight and control over student registrations.

## Workflow

1. **Parent Registration**: Parents submit family registration requests via the invitation system
2. **Admin Review**: Admins review pending family approvals in the admin dashboard
3. **Approval Process**: Admins approve requests using the `approveFamilyRequest` Edge Function
4. **Account Creation**: Student accounts are automatically created and activated
5. **Email Notification**: Parents receive email confirmation with login details

## Database Schema

### family_approvals Table
- `id`: UUID primary key
- `parent_email`: Parent's email address
- `parent_name`: Parent's full name
- `children_data`: JSONB array containing child information
- `organization_id`: Organization the family is joining
- `status`: Approval status ('pending', 'approved', 'rejected', 'expired')
- `approved_by`: Admin user ID who approved the request
- `approved_at`: Timestamp of approval
- `submitted_at`: Timestamp of initial submission

### children_data Structure
```json
[
  {
    "name": "John Doe",
    "age": 12,
    "level": "Beginner",
    "notes": "Excited to learn skateboarding",
    "profile_image": "optional_image_url"
  }
]
```

## Edge Function: approveFamilyRequest

### Endpoint
`POST /functions/v1/approve-family-request`

### Request Format
```json
{
  "id": "family-approval-uuid",
  "adminId": "admin-user-uuid"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Family approval processed successfully! Created 2 student accounts.",
  "data": {
    "approvalId": "family-approval-uuid",
    "parentEmail": "parent@example.com",
    "parentName": "Jane Doe",
    "studentsCreated": [
      {
        "name": "John Doe",
        "username": "johndoe",
        "studentId": "student-uuid-1"
      },
      {
        "name": "Mary Doe", 
        "username": "marydoe",
        "studentId": "student-uuid-2"
      }
    ],
    "totalStudentsCreated": 2
  }
}
```

### What the Function Does

1. **Validates Request**: Checks for required fields and valid family approval ID
2. **Loads Family Approval**: Retrieves the pending family approval record
3. **Parses Children Data**: Extracts child information from JSONB array
4. **Creates Student Accounts**: For each child:
   - Generates unique username based on name
   - Creates auth.users record with email `{username}@child.eleve.app`
   - Creates profiles record with role 'student'
   - Creates students record with approval and active status
5. **Updates Approval Status**: Marks family approval as 'approved'
6. **Sends Email Notification**: Notifies parent of successful approval via Resend

### Generated Student Credentials

- **Email**: `{username}@child.eleve.app` (e.g., `johndoe@child.eleve.app`)
- **Username**: Sanitized version of child's name (e.g., `johndoe`)
- **Password**: `{ChildNameNoSpaces}123!` (e.g., `JohnDoe123!`)

## Usage Examples

### From Admin Dashboard (JavaScript)
```javascript
async function approveFamilyRequest(familyApprovalId, adminId) {
  try {
    const response = await fetch('/functions/v1/approve-family-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseToken}`
      },
      body: JSON.stringify({
        id: familyApprovalId,
        adminId: adminId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Family approved successfully!', result.data);
      // Refresh admin dashboard
      refreshPendingApprovals();
    } else {
      console.error('Approval failed:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### From Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveFamilyRequest(familyApprovalId: string, adminId: string) {
  const { data, error } = await supabase.functions.invoke('approve-family-request', {
    body: {
      id: familyApprovalId,
      adminId: adminId
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data.success) {
    console.log('Students created:', data.data.studentsCreated);
  }
}
```

## Required Database Migrations

Before using this function, run these migrations:

1. **Add approval fields to students table**:
```sql
-- Add approval and active status fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_students_is_approved ON students(is_approved);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
```

2. **Make coach_id nullable**:
```sql
-- Allow students to exist without assigned coaches initially
ALTER TABLE students 
ALTER COLUMN coach_id DROP NOT NULL;
```

## Environment Variables

Ensure these environment variables are set in your Supabase project:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `RESEND_API_KEY`: Resend.com API key for email notifications
- `FROM_EMAIL`: Email address to send notifications from
- `FROM_NAME`: Name to appear in email notifications
- `SITE_URL`: Base URL for your application (for email links)

## Error Handling

The function includes comprehensive error handling:

- **Validation Errors**: Missing required fields, invalid approval IDs
- **Database Errors**: Failed to create accounts, constraint violations  
- **Auth Errors**: Username conflicts, password requirements
- **Email Errors**: Resend API failures (non-blocking)

## Security Considerations

- Uses Supabase service role key for privileged operations
- Validates admin permissions through adminId parameter
- Generates secure passwords for student accounts
- Ensures unique usernames across the platform
- Maintains data integrity with transactional operations

## Monitoring and Logging

The function provides detailed logging for:
- Request validation
- Account creation progress
- Error conditions
- Email delivery status

Check Supabase Edge Function logs for detailed execution information. 