# Fix Firebase Unauthorized Domain Error

## Problem
When deploying to Vercel, you get the error:
```
firebase: Error (auth/unauthorized domain)
```

This happens because Firebase Authentication only allows requests from domains that are explicitly authorized in your Firebase project settings.

## Solution

### Step 1: Get Your Vercel Domain
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Copy your production domain (e.g., `your-app-name.vercel.app`)
5. Also copy any preview domains if you want to test on preview deployments

### Step 2: Add Domain to Firebase
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain:
   - `your-app-name.vercel.app` (production)
   - `*.vercel.app` (for preview deployments - optional)
6. Click **Add**

### Step 3: Verify
1. Wait a few minutes for changes to propagate
2. Try logging in with Google on your Vercel deployment
3. It should work now!

## Important Notes

- **localhost** is automatically authorized for development
- You need to add **each domain** separately
- Changes may take a few minutes to take effect
- If you have a custom domain, add that too

## Common Domains to Add

- `your-app-name.vercel.app` (production)
- `your-custom-domain.com` (if you have one)
- `*.vercel.app` (for preview deployments - wildcard)

## Troubleshooting

If it still doesn't work:
1. Clear your browser cache
2. Wait 5-10 minutes for Firebase to update
3. Check that you added the exact domain (including subdomain)
4. Make sure you're using the correct Firebase project

