# Fix Data Display Issue on Vercel/Production

## Problem
Data displays on localhost but not on Vercel/other production platforms.

## Root Cause
Missing environment variables in production that are required for Supabase connection.

## Solution

### 1. Environment Variables Setup

Add these environment variables to your production platform (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zkezubbjstrixkpqjias.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUzMTYsImV4cCI6MjA4MzM3MTMxNn0.MgNnEbpZ-WM_W7ehpQtlBEnKYYMbFMhhvPDOTUo8jR4
```

### 2. For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add the two variables above:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy your application

### 3. For Other Platforms

**Netlify:**
- Go to Site settings → Build & deploy → Environment
- Add the environment variables
- Trigger a new deployment

**AWS Amplify:**
- Go to App settings → Environment variables
- Add the environment variables
- Redeploy

**Docker/Custom hosting:**
- Create `.env` file in production with the variables
- Ensure the file is mounted correctly in your container

### 4. Verification

After deployment, check the browser console for:
- ✅ No Supabase configuration warnings
- ✅ Successful database connections
- ✅ Data loading properly

### 5. Common Issues & Fixes

#### Issue: Still no data after adding env vars
**Fix:** Ensure environment variables are prefixed with `NEXT_PUBLIC_` for client-side access

#### Issue: CORS errors
**Fix:** Add your production domain to Supabase CORS settings:
1. Go to Supabase Dashboard → Project Settings → API
2. Add your production URL to "Additional Redirect URLs"

#### Issue: Authentication issues
**Fix:** Update auth redirect URLs in Supabase:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add your production domain to Site URL and Redirect URLs

### 6. Local Development

Ensure your `.env.local` file contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://zkezubbjstrixkpqjias.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUzMTYsImV4cCI6MjA4MzM3MTMxNn0.MgNnEbpZ-WM_W7ehpQtlBEnKYYMbFMhhvPDOTUo8jR4
```

### 7. Testing Connection

Add this debug code temporarily to verify connection:

```javascript
// Add to your component
useEffect(() => {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('Supabase configured:', isSupabaseConfigured());
}, []);
```

This will help you verify that the environment variables are loaded correctly in production.
