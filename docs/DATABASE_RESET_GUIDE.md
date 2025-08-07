# Database Clean Reset Guide

## Overview

This guide explains how to reset your Supabase database to a clean, simplified schema that matches your business requirements. The new schema is designed to be flat, understandable, and focused on real-world usage.

## Before You Begin

⚠️ **WARNING**: This process will **DELETE ALL EXISTING DATA** in your database. Make sure you have backups if needed.

## Step 1: Reset the Database

1. Open your Supabase SQL Editor
2. Run the script: `supabase-clean-reset.sql`
3. This will:
   - Drop all existing tables and data
   - Delete all users from auth.users
   - Clear storage buckets
   - Create the new simplified schema

## Step 2: Create Test Data (Optional)

To verify everything works, run the test data script:

1. Run the script: `scripts/create-test-data-clean.sql`
2. This creates:
   - One test organization: "Elite Skateboarding Academy"
   - Sample admin, coach, and parent users
   - Two test students (one approved, one not)
   - Sample relationships and invitations

## New Schema Structure

### Core Tables

#### 1. `organizations`
- **Purpose**: Represents skateboarding organizations/businesses
- **Key Fields**:
  - `slug`: Used for custom login URLs (`tryeleve.com/{slug}/login`)
  - `name`: Organization display name

#### 2. `profiles`
- **Purpose**: All user profiles (admin, coach, parent, student)
- **Key Fields**:
  - `role`: One of 'admin', 'coach', 'parent', 'student'
  - `email`: Required for all users
  - `full_name`: Required for all users

#### 3. `organization_admins`
- **Purpose**: Links admins to organizations (many-to-many)
- **Business Logic**: Admins can manage multiple organizations
- **Key Fields**:
  - `is_owner`: Marks the admin who created the organization

#### 4. `organization_members`
- **Purpose**: Links coaches and parents to organizations (one-to-many)
- **Business Logic**: Coaches and parents can only belong to one organization
- **Key Fields**:
  - `role`: Either 'coach' or 'parent'
  - Unique constraint on `user_id` ensures one organization per user

#### 5. `students`
- **Purpose**: Student profiles with login credentials
- **Key Fields**:
  - `username`: Unique within organization for login
  - `passcode`: Simple passcode for student login
  - `approved_by_admin`: Boolean flag for admin approval
  - Unique constraint on `(username, organization_id)`

#### 6. `student_parents`
- **Purpose**: Links students to parents (many-to-many)
- **Business Logic**: Students can have multiple parents

#### 7. `student_coach_assignments`
- **Purpose**: Links students to coaches (many-to-many)
- **Business Logic**: Coaches only see assigned students
- **Key Fields**:
  - `assigned_by`: Tracks which admin made the assignment

#### 8. `invitations`
- **Purpose**: Manages coach and parent invitations
- **Key Fields**:
  - `status`: 'pending', 'accepted', 'declined'
  - `token`: Unique token for invitation links
  - `expires_at`: Invitation expiry date

## Business Logic Implementation

### User Roles and Access

1. **Admins**:
   - Can manage multiple organizations
   - Create and manage coaches and parents
   - Approve students
   - Assign coaches to students

2. **Coaches**:
   - Belong to one organization
   - Only see students assigned to them
   - Can see students even before admin approval (but flagged as not approved)

3. **Parents**:
   - Belong to one organization
   - Can manage their own students
   - Add new students to their profile

4. **Students**:
   - Login with username + passcode at `tryeleve.com/{org-slug}/login`
   - Can have multiple parents
   - Must be approved by admin

### Login System

#### Admin, Coach, Parent Login
- **URL**: `/organization/login`
- **Method**: Email + password
- **Authentication**: Standard Supabase Auth

#### Student Login
- **URL**: `tryeleve.com/{organization-slug}/login`
- **Method**: Username + passcode
- **Authentication**: Custom logic needed (query students table)

### Key Constraints

1. **Username Uniqueness**: `UNIQUE(username, organization_id)` on students table
2. **One Organization per Member**: `UNIQUE(user_id, organization_id)` on organization_members
3. **Role Separation**: Each user has exactly one role
4. **Admin Multi-Organization**: Admins can manage multiple organizations via organization_admins table

## Row Level Security (RLS)

The schema includes comprehensive RLS policies:

- **Users can always see their own profile**
- **Organization members can see other members' profiles**
- **Admins can manage their organizations**
- **Coaches can only see assigned students**
- **Parents can only manage their own students**

## Example Queries

### Get organization by slug
```sql
SELECT * FROM organizations WHERE slug = 'elite-skateboarding';
```

### Get all students for a coach
```sql
SELECT s.* FROM students s
JOIN student_coach_assignments sca ON s.id = sca.student_id
WHERE sca.coach_id = 'coach-user-id';
```

### Get all students for a parent
```sql
SELECT s.* FROM students s
JOIN student_parents sp ON s.id = sp.student_id
WHERE sp.parent_id = 'parent-user-id';
```

### Check if student login is valid
```sql
SELECT * FROM students 
WHERE username = 'alex' 
AND passcode = '1234' 
AND organization_id = 'org-id';
```

### Get pending invitations for an organization
```sql
SELECT * FROM invitations 
WHERE organization_id = 'org-id' 
AND status = 'pending' 
AND expires_at > NOW();
```

## Migration from Old Schema

The reset script handles the migration by:

1. **Dropping all old tables**: Removes complex legacy structures
2. **Simplifying user roles**: Reduces from 5 roles to 4
3. **Flattening relationships**: Removes unnecessary join tables
4. **Consolidating login methods**: Separates email/password from username/passcode
5. **Improving constraints**: Adds proper unique constraints and foreign keys

## Testing the New Schema

After running the reset and test data scripts:

1. **Verify organizations**: Check that "Elite Skateboarding Academy" exists
2. **Test user creation**: Ensure profiles are created automatically
3. **Check relationships**: Verify parent-student and coach-student links
4. **Test constraints**: Try to violate unique constraints
5. **Verify RLS**: Test that users can only see appropriate data

## Next Steps

1. **Update your application code** to use the new table structure
2. **Implement student login logic** for username/passcode authentication
3. **Update invitation flow** to use the new invitations table
4. **Modify UI** to reflect the simplified user roles
5. **Test thoroughly** with the new schema before going live

## Support

If you encounter issues:
1. Check that you ran the reset script completely
2. Verify that RLS policies are working correctly
3. Ensure your application code is updated to use the new table names
4. Test with the provided test data first 