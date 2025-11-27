# Firebase Cloud Messaging Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for Dormzy to enable background push notifications.

## 📋 Prerequisites

- Firebase Project already created
- Firebase Admin SDK installed (`npm install firebase-admin`)
- Access to Firebase Console

## 🔧 Setup Steps

### Step 1: Get FCM VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dorm-b8213**
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Under "Web Push certificates" section, look for the "Server API Key" and VAPID Key
5. If no VAPID key exists, click "Generate Key Pair"
6. Copy the **VAPID Key** (looks like: `BHP...`)

### Step 2: Get Firebase Admin SDK Credentials

1. In Firebase Console, go to **Project Settings** → **Service Accounts** tab
2. Click **Generate New Private Key**
3. A JSON file will download with your credentials
4. Open the file and find these values:
   - `project_id`
   - `client_email`
   - `private_key`

### Step 3: Update Environment Variables

Edit `.env.local` and add:

```dotenv
# Firebase Messaging - Get from Cloud Messaging tab
NEXT_PUBLIC_FCM_VAPID_KEY=YOUR_VAPID_KEY_HERE

# Firebase Admin SDK - Get from Service Accounts tab
FIREBASE_PROJECT_ID=dorm-b8213
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@dorm-b8213.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv....\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important:** 
- For `FIREBASE_PRIVATE_KEY`, make sure to keep the `\n` characters in the key
- On Windows, PowerShell will handle newlines automatically

### Step 4: Update Firestore Security Rules (Optional)

Add these rules to allow storing FCM tokens:

```firestore
// Allow users to read/write their own tokens
match /userTokens/{document=**} {
  allow read, write: if request.auth != null;
}

// Allow service worker to update tokens
match /userTokens/{uid} {
  allow write: if request.auth.uid == uid;
  allow read: if request.auth != null;
}
```

## 🧪 Testing Notifications

### On Desktop Browser:
1. Open your app
2. You should see an install prompt at the bottom
3. Click **Install** to add to home screen
4. Grant notification permission when prompted
5. Create an event or message from another account
6. You should receive a notification even when the tab is not in focus

### On Mobile (PWA):
1. Open app in Chrome or Firefox
2. Click menu (three dots) → **Install app**
3. Grant notification permission
4. Install the PWA to home screen
5. Create event from another account
6. **You should receive notifications even with the app closed!**

## 📊 How Notifications Work

1. **User Installation**: App requests notification permission
2. **Token Generation**: Browser generates unique FCM token
3. **Token Storage**: Token is saved to Firestore in `userTokens` collection
4. **Event Trigger**: When someone creates event/message, backend queries tokens
5. **Notification Sending**: API endpoint sends notifications to all tokens via Firebase Admin SDK
6. **Delivery**: Notifications appear on user devices even if app is closed

## 🐛 Troubleshooting

### Notifications Not Appearing
- Check browser console for errors (F12 → Console)
- Verify notification permission is "Allow" (not "Block")
- Check that FCM tokens are being saved to Firestore
- Verify VAPID key is correctly configured

### Getting Errors About Missing Credentials
- Ensure all three Firebase Admin SDK environment variables are set
- Check that `FIREBASE_PRIVATE_KEY` has proper `\n` characters

### Service Worker Issues
- Clear browser cache: Settings → Clear cache
- Re-register service worker by refreshing page multiple times
- Check `public/sw.js` exists and is valid

## 📱 Mobile Installation Steps

### Android Chrome:
1. Open Dormzy in Chrome
2. Tap menu (three dots) → **Install app**
3. Tap **Install**
4. Grant notification permission
5. App will appear on home screen

### iOS Safari:
1. Open Dormzy in Safari
2. Tap Share (bottom center)
3. Select **Add to Home Screen**
4. Name it "Dormzy"
5. Tap **Add**
6. App will appear on home screen

## 📝 Database Structure

FCM tokens are stored in Firestore at:
```
/userTokens/{userId}/
  - fcmToken: string (unique device token)
  - updatedAt: timestamp
  - platform: "web"
  - dorm: string (optional, for filtering)
```

## ✅ Verification

To verify notifications are working:

1. Open Firestore → userTokens collection
2. You should see documents with FCM tokens
3. Check that timestamps update when you log in

## 🚀 Going to Production

1. Update all three Firebase Admin SDK env variables in Vercel
2. Test on deployed URL before going live
3. Monitor Firebase Console → Cloud Messaging for delivery stats
4. Check Firestore → userTokens for token storage

---

**For more information**, visit:
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [PWA Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
