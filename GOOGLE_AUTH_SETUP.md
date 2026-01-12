# Google Login Integration Plan

Integrating Google Login into this project is straightforward because we are already using **Supabase**. Supabase handles the complex OAuth flow, so we only need to provide the credentials and add a simple function call in our code.

## 📋 Step-by-Step Implementation Guide

### Phase 1: Google Cloud Console Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Trust Project").
3. Search for **"APIs & Services"** > **"OAuth consent screen"**.
   - Select **External**.
   - Fill in the App Name (e.g., "Trust App") and User support email.
   - Add your developer contact info and save.
4. Go to **"Credentials"** > **"Create Credentials"** > **"OAuth client ID"**.
   - Select **Web application**.
   - **Important**: We will add the redirect URI in Phase 2.
   - Click **Create**.
   - Copy the **Client ID** and **Client Secret**.

### Phase 2: Supabase Dashboard Configuration
1. Go to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project.
3. Go to **Authentication** > **Providers** > **Google**.
4. Toggle **Enable Google Provider**.
5. Paste the **Client ID** and **Client Secret** you copied from Google.
6. Look for the **Callback URL (Redirect URI)** provided in the Google provider settings. It looks like `https://[PROJECT-ID].supabase.co/auth/v1/callback`.
7. **Copy this URL** and go back to Google Cloud Console (Credentials page).
8. Add this URL to **"Authorized redirect URIs"** and save.

### Phase 3: Code Integration (I will handle this part)
1. **Update Auth Context**: Add a `signInWithGoogle` method to our authentication logic.
2. **Update UI**: Add a "Sign in with Google" button to the login page.
3. **Handle Redirects**: Ensure the app correctly handles the user returning from Google.

## 🚀 Easy Connection Method

The easiest way to connect is using the `supabase.auth.signInWithOAuth` method.

```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`,
  }
})
```

## ✅ What's Next?
I will now proceed to implement the code changes in your project so that once you add the credentials to Supabase, it will work instantly!
