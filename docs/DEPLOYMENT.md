# Eleve App - Vercel Deployment Guide

## 🚀 Quick Deployment

### 1. Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings:**
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps`

### 2. Environment Variables

Add these environment variables in Vercel:

```
EXPO_PUBLIC_SUPABASE_URL=https://noaeiuejccwfabjhjndy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Custom Domain Setup

1. **In Vercel Dashboard** → **Project Settings** → **Domains**
2. **Add your domain**: `tryeleve.com`
3. **Add subdomain**: `www.tryeleve.com`
4. **Update DNS settings** in your domain registrar (GoDaddy, etc.)

### 4. Configure Supabase

1. **Go to Supabase Dashboard** → **Authentication** → **Settings**
2. **Update Site URL**: `https://tryeleve.com`
3. **Add Redirect URLs**:
   - `https://tryeleve.com`
   - `https://tryeleve.com/auth/callback`
   - `https://www.tryeleve.com`
   - `https://your-app.vercel.app` (temporary Vercel URL)

## 📱 Features on Web

- ✅ **Full app functionality** in browser
- ✅ **Responsive design** works on all devices
- ✅ **Email verification** works properly
- ✅ **Supabase authentication** 
- ✅ **Student management**
- ✅ **Session tracking**
- ⚠️ **Camera functionality** (limited to web camera API)

## 🔧 Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start web development server
npm run web

# Build for production
npm run build

# Test production build locally
npx serve dist
```

## 🌐 Domain Configuration

Once deployed, students can access your app at:
- **https://tryeleve.com** (your custom domain)
- **https://your-app.vercel.app** (Vercel subdomain)

## 🔐 Authentication Flow

1. **User signs up** → Gets email verification
2. **Clicks email link** → Redirects to `https://tryeleve.com`
3. **Email verified** → Can access app immediately
4. **No app download required** → Works in any browser

## 📞 Support

- **Web app works** on desktop and mobile browsers
- **Camera features** use browser's camera API
- **All other features** work identically to mobile app
- **Progressive Web App** (PWA) support for mobile-like experience

## 🚀 Next Steps

1. **Deploy to Vercel** (5 minutes)
2. **Configure custom domain** (10 minutes)  
3. **Update Supabase settings** (2 minutes)
4. **Test signup flow** (1 minute)
5. **Share with students** ✅

Your coaching app will be accessible from any browser! 🎉 