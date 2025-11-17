# Fixing Firebase 400 Error (identitytoolkit.googleapis.com)

The 400 Bad Request error from `identitytoolkit.googleapis.com` is a Firebase Authentication API error. Here's how to fix it:

## Common Causes and Solutions

### 1. Check Authorized Domains in Firebase Console

The most common cause is that `localhost` is not in the authorized domains list.

**Steps to fix:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`dorm-b8213`)
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Make sure these domains are listed:
   - `localhost`
   - `127.0.0.1`
   - Your production domain (if deployed)
5. If `localhost` is missing, click **Add domain** and add it
6. Save the changes

### 2. Check API Key Restrictions

Your API key might have restrictions that block localhost.

**Steps to fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`dorm-b8213`)
3. Go to **APIs & Services** → **Credentials**
4. Find your API key (starts with `AIzaSyCP9i2Rcrq...`)
5. Click on it to edit
6. Under **Application restrictions**, check:
   - If set to **HTTP referrers**, make sure `localhost:3000/*` is included
   - If set to **None**, that's fine for development
   - If set to **IP addresses**, you need to add your IP or change to **None** for development
7. Under **API restrictions**, make sure these APIs are enabled:
   - Identity Toolkit API
   - Firebase Authentication API
8. Click **Save**

### 3. Verify Email/Password Authentication is Enabled

Make sure Email/Password authentication is enabled in Firebase.

**Steps to verify:**
1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Make sure **Email/Password** is enabled
3. If not, click on it and toggle **Enable** to ON
4. Click **Save**

### 4. Check Browser Console for Detailed Error

Open browser DevTools (F12) and check the Console tab for more detailed error messages. The error might give you more specific information about what's wrong.

### 5. Restart Development Server

After making changes in Firebase Console:
1. Stop your development server (Ctrl+C)
2. Clear browser cache
3. Restart the server: `npm run dev`
4. Try again

## Quick Test

After making these changes, try:
1. Go to `http://localhost:3000/auth/signup`
2. Create a new account
3. Check the browser console - the 400 error should be gone

## Still Having Issues?

If the error persists:
1. Check the Network tab in DevTools to see the exact request that's failing
2. Verify your `.env.local` file has the correct values
3. Make sure you're using the correct Firebase project
4. Try creating a new Firebase project and updating your `.env.local` with new credentials

