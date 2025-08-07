# Elevé Web App - Deployment Guide

## 🚀 Overview

This guide covers deploying the Elevé web application built with Next.js Pages Router. The setup includes:

- **Main Marketing Website**: `tryeleve.com`
- **Landing Page**: Professional skateboarding school platform showcase
- **Header with Authentication**: User login/logout functionality
- **Organization Portals**: Future implementation for `tryeleve.com/<org-name>/login`

## 📁 File Structure

```
apps/web/
├── src/
│   ├── pages/
│   │   ├── index.tsx        # Main landing page
│   │   ├── _app.tsx         # App wrapper
│   │   └── _document.tsx    # HTML document
│   ├── components/
│   │   └── Header.tsx       # Navigation header with auth
│   └── styles/
│       └── globals.css      # Global styles with Tailwind
├── public/                  # Static assets
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## 🛠️ Setup Instructions

### 1. Choose Your Deployment Platform

#### Option A: Vercel (Recommended for Next.js)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and configure:
   - **Framework**: Next.js
   - **Build Command**: `pnpm vercel-build` (automatically detected)
   - **Output Directory**: `apps/web/.next` (configured in vercel.json)
   - **Install Command**: `pnpm install`
   - **Root Directory**: `apps/web`

#### Option B: Netlify
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build Command**: `cd apps/web && pnpm build`
   - **Publish Directory**: `apps/web/.next`
   - **Base Directory**: `apps/web`

#### Option C: Traditional Web Hosting (Static Export)
1. Update `next.config.ts` to add `output: 'export'`
2. Build the project: `cd apps/web && pnpm build`
3. Upload the `apps/web/out` folder contents to your web server

### 2. Configure Environment Variables

Add these environment variables to your deployment platform:

```bash
# For web app (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Note: The app will work without these credentials (auth features disabled)
# but for full functionality, add your real Supabase credentials
```

### 3. Set Up Custom Domain

1. **Purchase Domain**: Get `tryeleve.com` from a domain registrar
2. **Configure DNS**: Point your domain to your deployment platform
3. **SSL Certificate**: Enable HTTPS (usually automatic)

### 4. Configure URL Routing

Create a `_redirects` file (Netlify) or `vercel.json` (Vercel) for proper routing:

#### For Netlify (`public/_redirects`):
```
# Main marketing website
/                    /index.html         200
/login              /login.html         200

# Organization portals
/*/login            /org-login.html     200

# API endpoints (if using serverless functions)
/api/*              /.netlify/functions/:splat  200

# Fallback for SPA
/*                  /index.html         200
```

#### For Vercel (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/index.html"
    },
    {
      "source": "/login",
      "destination": "/login.html"
    },
    {
      "source": "/([^/]+)/login",
      "destination": "/org-login.html"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### 5. Organization Portal Setup

For each organization portal (e.g., `tryeleve.com/example-skate/login`):

1. **Dynamic Routing**: The `org-login.html` template uses JavaScript to:
   - Extract organization slug from URL
   - Load organization-specific branding
   - Handle login for that organization

2. **Organization Configuration**: Update `web/config.js`:
```javascript
organizations: {
  'example-skate': 'Example Skate School',
  'pro-academy': 'Pro Skate Academy',
  'youth-center': 'Youth Skate Center',
}
```

## 🔧 Configuration

### Update Supabase Settings

1. **Go to Supabase Dashboard** → Authentication → Settings
2. **Update Site URL**: `https://tryeleve.com`
3. **Add Redirect URLs**:
   - `https://tryeleve.com`
   - `https://tryeleve.com/login`
   - `https://tryeleve.com/*/login`
   - `https://tryeleve.com/auth/callback`

### Organization Management

To add a new organization:

1. **Create Organization in Database**:
```sql
INSERT INTO organizations (name, slug, owner_id) 
VALUES ('New Skate School', 'new-skate-school', 'owner-user-id');
```

2. **Update Configuration**:
```javascript
// In web/config.js
organizations: {
  'new-skate-school': 'New Skate School',
  // ... other organizations
}
```

## 🎨 Customization

### Branding

Update colors and branding in the HTML files:

```css
/* Update primary colors */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #ffd700;
}
```

### Organization-Specific Branding

Each organization can have custom branding by updating the `org-login.html` template:

```javascript
// Organization-specific customization
const orgBranding = {
  'example-skate': {
    logo: '🛹',
    primaryColor: '#667eea',
    name: 'Example Skate School'
  },
  'pro-academy': {
    logo: '🏆',
    primaryColor: '#f59e0b',
    name: 'Pro Skate Academy'
  }
};
```

## 📱 Mobile App Integration

The updated mobile login screen (`screens/LoginScreen.tsx`) now features:

- **Single input field** for username/email by default
- **User type toggle** (Student/Parent vs Admin/Coach)
- **Simplified flow** for students (username-only option)
- **Admin signup** only for organization admins
- **Modern design** following Airbnb/Pinterest style principles

### Key Features:
- Students can login with just username (if configured)
- Parents and coaches need email + password
- Only admins can access signup functionality
- Role-based navigation after login

## 🔒 Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting on login endpoints
4. **Input Validation**: Sanitize all user inputs
5. **Session Management**: Use secure session handling

## 🚦 Go Live Checklist

- [ ] Domain purchased and configured
- [ ] SSL certificate enabled
- [ ] Environment variables set
- [ ] Supabase redirect URLs updated
- [ ] Organization portals tested
- [ ] Mobile app login tested
- [ ] Admin login functionality verified
- [ ] Error handling implemented
- [ ] Analytics tracking set up (optional)

## 🔧 Development vs Production

### Development
- Use `localhost:3000` for testing
- Local environment variables in `.env`
- Test with example organizations

### Production
- Use your custom domain
- Environment variables in deployment platform
- Real organization data from database

## 📞 Support

For deployment issues or questions:
- Check the deployment platform's documentation
- Review Supabase auth documentation
- Test each login flow thoroughly
- Monitor error logs for issues

## 🎯 Example Organization URLs

Once deployed, your organization portals will be available at:

- Main website: `https://tryeleve.com`
- Admin login: `https://tryeleve.com/login`
- Example Skate School: `https://tryeleve.com/example-skate/login`
- Pro Academy: `https://tryeleve.com/pro-academy/login`
- Youth Center: `https://tryeleve.com/youth-center/login`

Each organization gets their own branded login portal while maintaining the same underlying functionality and security standards.

---

**Ready to launch your skate school platform! 🛹✨** 