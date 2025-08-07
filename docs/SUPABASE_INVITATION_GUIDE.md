# Supabase Coach Invitation System Guide

## Overview

Your Eleve app now uses Supabase's built-in invitation system to send coach invitations. This provides several benefits:

- ✅ **Automatic email delivery** using Supabase's email infrastructure
- ✅ **Email delivery tracking** through Supabase auth tables
- ✅ **Custom email templates** configured in your Supabase dashboard
- ✅ **Built-in security** with proper token handling
- ✅ **Acceptance tracking** when coaches accept invitations

## How It Works

### 1. **Email Template Configuration**
Your "Invite user" email template (shown in your screenshot) is automatically used when invitations are sent.

**Template Variables Available:**
- `{{ .SiteURL }}` - Your app's URL
- `{{ .ConfirmationURL }}` - The invitation acceptance link
- `{{ .Email }}` - Recipient's email
- `{{ .Data.full_name }}` - Coach's name
- `{{ .Data.organization_name }}` - Organization name
- `{{ .Data.invitation_type }}` - Type of invitation (coach)

### 2. **Database Schema**

The `invitations` table now includes:
```sql
- email (TEXT) - Coach's email
- role (TEXT) - 'coach'
- organization_id (UUID) - Your organization
- auth_user_id (UUID) - Links to Supabase auth.users
- status (TEXT) - 'pending', 'accepted', 'declined'
- created_at (TIMESTAMP) - When invitation was created
```

### 3. **Email Delivery Status**

You can check if emails were sent and accepted:

```typescript
import { checkInvitationStatus } from '../services/adminService';

const status = await checkInvitationStatus('coach@example.com');
console.log('Email sent:', status.emailSent);
console.log('Email accepted:', status.emailAccepted);
console.log('Invited at:', status.invitedAt);
console.log('Confirmed at:', status.confirmedAt);
```

## Setup Instructions

### 1. **Run Database Migration**
Execute the `supabase-invitation-tracking.sql` file in your Supabase SQL Editor:

```sql
-- This adds auth_user_id tracking and helper functions
ALTER TABLE invitations 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### 2. **Configure Email Template**
In your Supabase Dashboard:
1. Go to Authentication → Email Templates
2. Select "Invite user" template
3. Customize the subject and body
4. Use template variables for personalization

### 3. **Set Environment Variables**
Add to your `.env` file:
```bash
EXPO_PUBLIC_SITE_URL=https://yourdomain.com
```

## Email Delivery Tracking

### **Check Individual Invitation Status**
```typescript
const status = await checkInvitationStatus('coach@example.com');
```

### **Get All Invitations with Status**
```typescript
const invitations = await getPendingInvitations(organizationId);
// Returns invitations with emailSent and emailConfirmed flags
```

### **Database Query for Email Status**
```sql
-- Check specific email status
SELECT * FROM check_invitation_status('coach@example.com');

-- Get all invitation details for organization
SELECT * FROM get_invitation_details('your-org-uuid');
```

## Invitation Flow

### **1. Admin Sends Invitation**
```typescript
// In InviteCoachScreen.tsx
const result = await createCoachInvitation(
  coachName,
  coachEmail,
  organizationId
);
```

### **2. Supabase Sends Email**
- Uses your configured email template
- Creates record in `auth.users` table
- Sets `invited_at` timestamp
- Generates secure invitation token

### **3. Coach Receives Email**
- Professional email with your branding
- Contains secure invitation link
- Links to your coach acceptance page

### **4. Coach Accepts Invitation**
- Clicks link in email
- Redirected to your app
- Creates account with pre-filled organization info
- Sets `email_confirmed_at` timestamp

## Monitoring Email Delivery

### **In Supabase Dashboard**
1. Go to Authentication → Users
2. Look for users with `invited_at` but no `email_confirmed_at`
3. These are pending invitations

### **In Your App**
```typescript
// Get invitation summary
const { data } = await supabase
  .rpc('get_invitation_details', { org_id: organizationId });

data.forEach(inv => {
  console.log(`${inv.email}: ${inv.auth_status}`);
  // Possible statuses: 'pending', 'accepted', 'not_sent'
});
```

## Troubleshooting

### **Email Not Delivered**
1. Check Supabase logs in Dashboard → Logs
2. Verify SMTP settings in Authentication → Settings
3. Check spam/junk folders
4. Verify email template syntax

### **Invitation Status Shows 'not_sent'**
- The `auth.admin.inviteUserByEmail()` call failed
- Check console logs for error details
- Verify user permissions and API access

### **Coach Can't Accept Invitation**
1. Check if invitation link is correct
2. Verify expiration (7 days default)
3. Check if email was already confirmed
4. Test with fresh invitation

## Example Email Template

Here's a sample "Invite user" template:

```html
<h2>You're invited to coach on Eleve! 🛹</h2>

<p>Hi {{ .Data.full_name }}!</p>

<p>You've been invited to join <strong>{{ .Data.organization_name }}</strong> as a coach on Eleve.</p>

<p><a href="{{ .ConfirmationURL }}">Accept Invitation & Get Started</a></p>

<p>This invitation expires in 7 days.</p>
```

## API Reference

### **createCoachInvitation()**
```typescript
const result = await createCoachInvitation(
  coachName: string,
  coachEmail: string, 
  organizationId: string
);
// Returns: { success: boolean, message: string, invitationId?: string }
```

### **checkInvitationStatus()**
```typescript
const status = await checkInvitationStatus(email: string);
// Returns: { emailSent: boolean, emailAccepted: boolean, invitedAt?: string, confirmedAt?: string }
```

### **getPendingInvitations()**
```typescript
const invitations = await getPendingInvitations(organizationId: string);
// Returns: PendingInvitation[] with email delivery status
```

---

## Benefits of This System

1. **Reliable Email Delivery**: Uses Supabase's email infrastructure
2. **Professional Emails**: Custom branded templates
3. **Security**: Secure token handling and expiration
4. **Tracking**: Full visibility into email delivery and acceptance
5. **Scalability**: Handles high volume of invitations
6. **Compliance**: Built-in unsubscribe and email best practices

Your coach invitation system is now production-ready with enterprise-grade email delivery! 🚀 