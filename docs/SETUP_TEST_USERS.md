# 🔧 Setup Test Users in Supabase

Follow these steps to create test users that will work with the Student and Parent portals.

## Step 1: Create Auth Users in Supabase Dashboard

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. **Click "Add User"** for each of these accounts:

### User 1: Test Coach
- **Email**: `coach@test.com`
- **Password**: `test123456`
- **Auto Confirm**: ✅ Yes
- **Send Email**: ❌ No

### User 2: Test Parent
- **Email**: `parent@test.com`  
- **Password**: `test123456`
- **Auto Confirm**: ✅ Yes
- **Send Email**: ❌ No

### User 3: Test Student
- **Email**: `student@test.com`
- **Password**: `test123456`
- **Auto Confirm**: ✅ Yes
- **Send Email**: ❌ No

## Step 2: Run the SQL Script

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/create-test-users.sql`
3. **Click "Run"** to execute the script

The script will:
- Create a test organization
- Create profiles for each user
- Create 3 test students
- Create parent-child relationships
- Create test sessions and videos

## Step 3: Test the App

Now you can test the app with these credentials:

### Login Testing
- **Tap "Already have an account?"** on welcome screen
- **Use any of the test emails above** with password `test123456`

### Portal Testing
- **Tap "Student Portal"** - should show student dashboard
- **Tap "Parent Portal"** - should show parent dashboard with children

## 🎯 Expected Results

After setup:
- **Student Portal**: Should show student dashboard with sessions
- **Parent Portal**: Should show 2 children (Alex Johnson, Emma Davis)
- **Coach Dashboard**: Should show organization with 3 students
- **No more "Not authenticated" errors**

## 🐛 Troubleshooting

If you still get errors:
1. **Check Supabase logs** for detailed error messages
2. **Verify all 3 auth users were created** in Authentication tab
3. **Check that the SQL script ran without errors**
4. **Try refreshing the app** (press `r` in terminal)

## 📱 Quick Test Commands

```bash
# Refresh the app
r

# Open debugger if needed
j

# Check logs in terminal for any remaining errors
``` 