# Create Coach Account - Step by Step

## 🚀 Quick Setup (5 minutes)

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and login
2. Select your Eleve project
3. Navigate to **Authentication** → **Users**

### Step 2: Create Auth User
1. Click **"Add user"** 
2. Fill in:
   - **Email**: `coach@eliteskating.com`
   - **Password**: `CoachTest123!`
   - **Confirm Password**: `CoachTest123!`
   - **Email Confirmed**: ✅ **Check this box**
   - **Email Confirm Sent**: ✅ **Check this box**
3. Click **"Create user"**
4. **📝 Copy the User ID** that appears (looks like: `a1b2c3d4-...`)

### Step 3: Create Organization  
1. Navigate to **Database** → **SQL Editor**
2. Run this query:
```sql
INSERT INTO organizations (name, owner_id, subscription_plan)
VALUES ('Elite Skating Academy', '00000000-0000-0000-0000-000000000000', 'free')
ON CONFLICT (name) DO NOTHING;
```

### Step 4: Create Profile
1. In **SQL Editor**, run this query (replace `YOUR_USER_ID` with the ID from Step 2):
```sql
INSERT INTO profiles (id, email, full_name, role, organization_id)
VALUES (
    'YOUR_USER_ID_FROM_STEP_2', 
    'coach@eliteskating.com',
    'Elite Skating Coach',
    'coach',
    (SELECT id FROM organizations WHERE name = 'Elite Skating Academy')
);
```

### Step 5: Create Test Students
1. Run this query to create demo students:
```sql
INSERT INTO students (name, age, level, coach_id, organization_id, username) VALUES
('Alex Johnson', 14, 'Intermediate', 'YOUR_USER_ID_FROM_STEP_2', (SELECT id FROM organizations WHERE name = 'Elite Skating Academy'), 'alex.johnson'),
('Maria Rodriguez', 12, 'Beginner', 'YOUR_USER_ID_FROM_STEP_2', (SELECT id FROM organizations WHERE name = 'Elite Skating Academy'), 'maria.rodriguez'),
('Jamie Chen', 16, 'Advanced', 'YOUR_USER_ID_FROM_STEP_2', (SELECT id FROM organizations WHERE name = 'Elite Skating Academy'), 'jamie.chen'),
('Taylor Swift', 13, 'Beginner', 'YOUR_USER_ID_FROM_STEP_2', (SELECT id FROM organizations WHERE name = 'Elite Skating Academy'), 'taylor.swift');
```

### Step 6: Verify Setup
1. Run this verification query:
```sql
SELECT 
    p.email,
    p.full_name,
    p.role,
    o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.email = 'coach@eliteskating.com';
```

## ✅ Ready to Login!

Now you can login with:
- **Email**: `coach@eliteskating.com`  
- **Password**: `CoachTest123!`
- **Toggle to**: Admin/Coach mode

The app will navigate you to `CoachHomeScreen` where you can test the recording features!

## 🎬 Demo Flow After Login
1. **CoachHomeScreen** → Two main options
2. **"Record a Quick Video"** → Camera opens instantly  
3. **"Start a Session"** → Structured session setup
4. **Select students** → Choose from your 4 test students
5. **Record and review** → Full recording workflow
6. **Save videos** → With metadata and notes 