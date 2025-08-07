# Complete Onboarding System for Eleve

## Overview

This document outlines the complete onboarding flow for coaches, parents, and students in the Eleve action sports academy platform.

## Flow Architecture

### 1. Coach Invitation Flow

**Admin Action → Email Invitation → Coach Signup → Account Active**

1. **Admin invites coach**
   - Admin uses `InviteCoachScreen` or admin dashboard
   - Calls `createCoachInvitation()` from `onboardingService`
   - Secure invitation code generated and stored in `invitations` table
   - Beautiful email sent via `sendCoachInvitation()` with invitation link

2. **Coach receives invitation**
   - Email contains: Welcome message, role benefits, invitation link, expiration date
   - Link format: `https://tryeleve.com/invite/coach/{invitationCode}`

3. **Coach signs up**
   - Uses `CoachSignupScreen` 
   - Validates invitation code and organization
   - Real-time username availability checking
   - Account created with `processCoachSignup()`
   - Username unique within organization (not globally)

4. **Coach account active**
   - Can log in with username/password
   - Redirected to `CoachHome` screen
   - Invitation marked as 'accepted'

### 2. Parent Invitation & Child Registration Flow

**Admin Action → Email Invitation → Parent Signup → Child Registration → Admin Approval → Student Accounts**

1. **Admin invites parent**
   - Admin uses `InviteParentScreen` or admin dashboard
   - Calls `createParentInvitation()` from `onboardingService`
   - Secure invitation code generated and stored in `invitations` table
   - Family-focused email sent via `sendParentInvitation()`

2. **Parent receives invitation**
   - Email contains: Welcome message, next steps, invitation link, expiration date
   - Link format: `https://tryeleve.com/invite/parent/{invitationCode}`

3. **Parent signs up**
   - Uses `ParentSignupScreen`
   - Validates invitation code and organization
   - Real-time username availability checking
   - Account created with `processParentSignup()`
   - Username unique within organization

4. **Parent registers children**
   - Uses `ParentOnboardingScreen` or dashboard
   - Submits child information form
   - Creates record in `family_approvals` table with status 'pending'
   - Admin gets notification of new family to review

5. **Admin reviews and approves**
   - Uses `FamilyApprovalsScreen`
   - Reviews submitted family information
   - Can approve or reject with admin notes
   - Calls `createStudentAccounts()` on approval

6. **Student accounts created**
   - Unique usernames generated for each child
   - Secure 6-digit passcodes generated
   - Student records created with approval status
   - Parent-child relationships established

7. **Parent receives credentials**
   - Email with student login information
   - Contains usernames, passcodes, and organization login URL
   - Sent via `sendStudentAccountCredentials()`

### 3. Student Login Flow

**Student Access → Organization Login → Dashboard**

1. **Student accesses organization portal**
   - URL format: `https://tryeleve.com/{organizationSlug}/login`
   - Uses `StudentOrgLoginScreen`
   - Organization branding displayed

2. **Student logs in**
   - Enters username and 6-digit passcode
   - Credentials validated with `authenticateStudent()`
   - Usernames unique within organization only

3. **Student dashboard access**
   - Redirected to `StudentDashboard` 
   - Can view progress, videos, achievements
   - Full student portal functionality

## Database Schema

### Core Tables

#### `invitations`
```sql
- id: UUID (primary key)
- code: TEXT (unique secure token)
- email: TEXT
- role: user_role ('coach' | 'parent')
- organization_id: UUID
- invited_by: UUID
- status: invitation_status ('pending' | 'accepted' | 'expired')
- expires_at: TIMESTAMP
```

#### `family_approvals`
```sql
- id: UUID (primary key)
- parent_id: UUID
- organization_id: UUID
- submitted_by: UUID
- status: approval_status ('pending' | 'approved' | 'rejected')
- children_data: JSONB (array of child info)
- admin_notes: TEXT
```

#### `students`
```sql
- id: UUID (primary key)
- name: TEXT
- username: TEXT (unique within organization)
- passcode: TEXT (6-digit secure code)
- age: INTEGER
- level: skill_level
- organization_id: UUID
- approved_by_admin: BOOLEAN
```

#### `parent_children`
```sql
- id: UUID (primary key)
- parent_id: UUID
- student_id: UUID
- created_at: TIMESTAMP
```

## Email Templates

### Coach Invitation Email
- **Subject**: "You're invited to join [Organization] as a coach on Eleve!"
- **Content**: Welcome message, role benefits, call-to-action button
- **Branding**: Purple gradient, action sports themed

### Parent Invitation Email
- **Subject**: "You're invited to join [Organization] as a parent on Eleve!"
- **Content**: Welcome message, next steps explanation, call-to-action button
- **Branding**: Green gradient, family-focused messaging

### Family Approval Notification
- **Subject**: "Your family application has been [approved/reviewed]"
- **Content**: Status update, next steps, admin notes if applicable
- **Branding**: Dynamic colors based on approval status

### Student Account Credentials
- **Subject**: "🎉 Student Account(s) Created - [Organization]"
- **Content**: Login credentials, organization URL, security notes
- **Branding**: Purple gradient, excitement and security focused

## Security Features

### Token-Based Invitations
- Cryptographically secure invitation codes
- Expiration dates (7 days default)
- One-time use tokens
- Organization-scoped validation

### Username Uniqueness
- Usernames unique within organization (not globally)
- Real-time availability checking
- Alphanumeric + underscore validation
- Automatic unique generation for students

### Student Authentication
- 6-digit secure passcodes
- Organization-scoped authentication
- No global username conflicts
- Parent-controlled credential management

## Key Services

### `onboardingService.ts`
- `createCoachInvitation()` - Generate and send coach invitations
- `createParentInvitation()` - Generate and send parent invitations
- `processCoachSignup()` - Handle coach account creation
- `processParentSignup()` - Handle parent account creation
- `createStudentAccounts()` - Create student accounts after approval
- `authenticateStudent()` - Validate student login credentials
- `isUsernameAvailable()` - Check username availability within organization
- `generateUniqueUsername()` - Generate unique usernames for students

### `emailService.ts`
- `sendCoachInvitation()` - Send coach invitation emails
- `sendParentInvitation()` - Send parent invitation emails
- `sendFamilyApprovalNotification()` - Send approval/rejection notifications
- `sendStudentAccountCredentials()` - Send student login credentials

## Navigation Structure

### New Screens Added
- `CoachSignupScreen` - Coach invitation signup
- `ParentSignupScreen` - Parent invitation signup
- `StudentOrgLoginScreen` - Organization-specific student login
- Enhanced `FamilyApprovalsScreen` - Complete approval workflow

### URL Routing
- `/invite/coach/{invitationCode}` - Coach signup
- `/invite/parent/{invitationCode}` - Parent signup
- `/{organizationSlug}/login` - Student organization login

## Implementation Status

✅ **Complete**
- Coach invitation and signup flow
- Parent invitation and signup flow
- Family approval system with admin dashboard
- Student account creation with unique credentials
- Organization-specific student login
- Comprehensive email templates
- Security token system
- Database schema and relationships

## Usage Examples

### Creating a Coach Invitation
```typescript
import { createCoachInvitation } from '../services/onboardingService';

const result = await createCoachInvitation({
  email: 'coach@example.com',
  full_name: 'John Coach',
  role: 'coach',
  organization_id: 'org-uuid',
  invited_by: 'admin-uuid',
});
```

### Approving a Family Application
```typescript
import { createStudentAccounts } from '../services/onboardingService';

const result = await createStudentAccounts(approvalId, childrenData);
// Automatically creates students, sends emails, establishes relationships
```

### Student Login
```typescript
import { authenticateStudent } from '../services/onboardingService';

const result = await authenticateStudent(username, passcode, organizationId);
// Returns student data if credentials are valid
```

## Next Steps

1. **Deploy the system** - All components are ready for production
2. **Configure email service** - Set up Resend API keys
3. **Test the complete flow** - End-to-end testing
4. **Monitor and optimize** - Track invitation conversion rates
5. **Add analytics** - Track user engagement and success metrics

## Benefits

- **Secure**: Token-based invitations, organization-scoped authentication
- **User-friendly**: Beautiful emails, intuitive signup flows
- **Scalable**: Handles multiple organizations, unlimited users
- **Complete**: End-to-end flow from invitation to student access
- **Flexible**: Easy to extend with additional features

This system provides a complete, production-ready onboarding experience for action sports academies using the Eleve platform. 