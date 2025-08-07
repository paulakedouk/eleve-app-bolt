# Coach Login Troubleshooting Guide

## 🚨 Issue: Coach Login Not Working for `coach@eliteskating.com`

### Problem Analysis

Based on the codebase investigation, there are several potential issues preventing the coach login from working:

## 🔍 Root Cause Analysis

### 1. **Demo Mode vs Production Authentication**
- **Issue**: The mobile app (`screens/LoginScreen.tsx`) has a demo mode bypass for coach@eliteskating.com
- **Code Location**: Lines 48-58 in `screens/LoginScreen.tsx`
- **Problem**: The demo mode shows an alert instead of actually logging in

```typescript
// TEMPORARY: Quick demo bypass for coach testing
if (isAdmin && loginInput === 'coach@eliteskating.com' && password === 'CoachTest123!') {
  Alert.alert(
    'Demo Mode',
    'Using demo mode for testing. In production, this would authenticate with Supabase.',
    [
      {
        text: 'Continue to Demo',
        onPress: () => navigation.navigate('CoachHome'),
      },
    ]
  );
  return;
}
```

### 2. **Database Account Setup**
- **Issue**: The coach account may not be properly created in Supabase
- **Required Steps**: The account needs to be created in both auth.users and profiles tables
- **Documentation**: `CREATE_COACH_ACCOUNT_STEPS.md` contains manual setup steps

### 3. **Environment Configuration**
- **Issue**: Supabase credentials might not be properly configured
- **Files**: `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Code Location**: `lib/supabase.ts` shows debug logging for missing credentials

### 4. **Multiple Login Interfaces**
- **Web Login**: `/web/login.html` (Admin Portal)
- **Organization Login**: `/web/org-login.html` (Student/Parent/Coach Portal)
- **Mobile Login**: `screens/LoginScreen.tsx` (Mobile App)

## 🛠️ Solutions

### Solution 1: Fix Demo Mode (Immediate Fix)
**For Mobile App:**
```typescript
// Remove or comment out the demo mode bypass in screens/LoginScreen.tsx
// Lines 48-58 should be removed or modified to actually authenticate
```

### Solution 2: Verify Database Setup
**Check if coach account exists:**
```sql
-- Run in Supabase SQL Editor
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    o.name as organization_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE u.email = 'coach@eliteskating.com';
```

**If account doesn't exist, create it:**
1. Go to Supabase Dashboard → Authentication → Users
2. Create user with:
   - Email: `coach@eliteskating.com`
   - Password: `CoachTest123!`
   - Email Confirmed: ✅
3. Run SQL to create profile:
```sql
INSERT INTO profiles (id, email, full_name, role, organization_id)
VALUES (
    'USER_ID_FROM_SUPABASE_AUTH', 
    'coach@eliteskating.com',
    'Elite Skating Coach',
    'coach',
    (SELECT id FROM organizations WHERE name = 'Elite Skating Academy')
);
```

### Solution 3: Environment Variables
**Check .env file contains:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Solution 4: Test Different Login Methods

#### Option A: Mobile App
1. Open mobile app
2. Toggle to "Admin/Coach" mode
3. Enter: `coach@eliteskating.com` / `CoachTest123!`

#### Option B: Web Admin Portal
1. Go to `/web/login.html`
2. Enter: `coach@eliteskating.com` / `CoachTest123!`

#### Option C: Organization Portal
1. Go to `/web/org-login.html`
2. Select "Coach" tab
3. Enter: `coach@eliteskating.com` / `CoachTest123!`

## 🔧 Quick Fix Implementation

### Step 1: Remove Demo Mode
```typescript
// In screens/LoginScreen.tsx, replace the demo mode section with:
// Let the normal authentication flow handle the login
```

### Step 2: Test Connection
- Use the `TestSupabaseScreen` component to verify database connection
- Check if Supabase credentials are properly configured

### Step 3: Verify Account
- Run the SQL query above to check if the account exists
- If not, follow the account creation steps

## 📊 Expected Behavior After Fix

1. **Mobile App**: Coach can login and navigate to `CoachHomeScreen`
2. **Web Portal**: Coach can login and access admin dashboard
3. **Organization Portal**: Coach can login and access coach-specific features

## 🚀 Testing Steps

1. **Test 1**: Mobile app login
2. **Test 2**: Web admin login  
3. **Test 3**: Organization portal login
4. **Test 4**: Verify navigation to CoachHomeScreen
5. **Test 5**: Test coach features (recording, sessions, etc.)

## 📞 Support Information

- **Coach Email**: `coach@eliteskating.com`
- **Password**: `CoachTest123!`
- **Organization**: Elite Skating Academy
- **Expected Role**: coach
- **Expected Navigation**: CoachHomeScreen

---

**Last Updated**: December 2024  
**Status**: Investigation Complete - Ready for Implementation