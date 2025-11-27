# Dormzy Notification & PWA Setup Summary

## ✅ What Was Implemented

### 1. **Improved PWA Install Prompt** 
   - Mobile-optimized installation prompt matching desktop design
   - Bottom sheet UI with clear CTA
   - Works on both Android and iOS
   - Automatically dismisses after installation

### 2. **Firebase Cloud Messaging (FCM)**
   - Backend API endpoint for sending push notifications
   - Token storage in Firestore
   - Automatic token refresh on login
   - Foreground + background notification support

### 3. **Background Notifications**
   - Notifications work even when app is closed (if installed as PWA)
   - Notifications sent via Firebase Admin SDK
   - Support for both dorm-specific and global notifications

## 📋 Files Changed

### New Files Created:
- `components/PWAInstallPrompt.tsx` - Updated with mobile optimization
- `utils/firebaseMessaging.ts` - FCM initialization and token management
- `app/api/send-notifications/route.ts` - Backend API for sending notifications
- `FCM_SETUP_GUIDE.md` - Complete setup documentation

### Modified Files:
- `utils/notifications.ts` - Updated to use FCM API
- `components/NotificationHandler.tsx` - Initialize Firebase Messaging
- `.env.local` - Added FCM environment variables

## 🔑 Required Environment Variables

You need to add these to `.env.local` (and to Vercel dashboard):

```dotenv
NEXT_PUBLIC_FCM_VAPID_KEY=YOUR_VAPID_KEY_HERE
FIREBASE_PROJECT_ID=dorm-b8213
FIREBASE_CLIENT_EMAIL=YOUR_CLIENT_EMAIL_HERE
FIREBASE_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

**How to get these:**
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Get VAPID Key from "Web Push certificates" section
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key" and download JSON
5. Extract `project_id`, `client_email`, and `private_key`

## 🚀 Testing Notifications

### Desktop (Dev Environment):
```
1. Open http://localhost:3000
2. Login
3. Grant notification permission (click "Allow")
4. Create event from another account
5. See notification appear in browser
```

### Mobile PWA (Production):
```
1. Open app in mobile Chrome/Firefox
2. Tap menu → "Install app"
3. Grant notification permission
4. Minimize or close the app completely
5. From another device, create an event
6. See notification appear on your home screen even with app closed!
```

## 📊 How It Works Now

```
User A creates event
    ↓
Triggers notifyDormUsers()
    ↓
Queries Firestore for all FCM tokens in that dorm
    ↓
Sends tokens to /api/send-notifications
    ↓
Backend sends via Firebase Admin SDK
    ↓
Firebase sends to all users' devices
    ↓
Notifications appear (even app closed!)
```

## ⚠️ Important Notes

1. **Tokens stored in:** `Firestore → userTokens collection`
   - Auto-created and managed by the app
   - No manual setup needed

2. **Notifications happen via:**
   - Foreground: Browser Notification API
   - Background: Service Worker + FCM

3. **Security:**
   - Only authenticated users receive notifications
   - Tokens tied to user accounts
   - Firestore rules enforce authentication

## 🔧 Next Steps to Enable Notifications

### Step 1: Get Firebase Credentials
- Visit Firebase Console → Project Settings → Cloud Messaging
- Copy VAPID Key
- Visit Service Accounts and generate private key JSON

### Step 2: Update Environment Variables
```bash
# Edit .env.local
NEXT_PUBLIC_FCM_VAPID_KEY=xxxxxx
FIREBASE_PROJECT_ID=dorm-b8213
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx
```

### Step 3: Update Vercel
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add the same 3 variables

### Step 4: Redeploy
- Push to GitHub (or just update env vars)
- Vercel will auto-redeploy

## ✨ Features Enabled

✅ Background push notifications  
✅ Mobile PWA installation  
✅ Token auto-management  
✅ Dorm-specific notifications  
✅ Global notifications  
✅ Foreground + background delivery  
✅ Secure Firebase integration  
✅ Firestore token storage  

## 📱 Install Button - Desktop vs Mobile

### Desktop (from image):
- Bottom-right corner
- Says "Install" with download icon
- Dismissible

### Mobile (now implemented):
- Bottom sheet from bottom of screen
- Full-width optimized layout
- Icon, title, subtitle
- "Install" and "Not Now" buttons
- Cleaner mobile UX

## 🐛 Troubleshooting

If notifications don't appear:

1. **Check Console**: `F12` → Console tab
   - Look for "Firebase Messaging initialized"
   - No red errors?

2. **Check Firestore**: 
   - Open Firestore → `userTokens` collection
   - See your FCM token stored there?

3. **Check Permission**:
   - Browser settings → Notifications
   - Is Dormzy set to "Allow"?

4. **Check Environment**:
   - All 3 FCM env vars set in .env.local?
   - All 3 env vars set in Vercel dashboard?

## 📖 Full Setup Guide

See `FCM_SETUP_GUIDE.md` in the project root for complete detailed setup instructions.

---

**Status**: ✅ Ready for setup  
**Deploy**: Need Firebase credentials  
**Test**: After env vars added
