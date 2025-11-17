# Firebase Setup Guide - Step by Step

## Quick Checklist

- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Created Firestore database
- [ ] Enabled Storage
- [ ] Got Firebase config values
- [ ] Created `.env.local` file
- [ ] Set up Firestore security rules
- [ ] Set up Storage security rules

## Detailed Steps

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: `dorm-connect` (or any name you prefer)
4. Click "Continue"
5. Disable Google Analytics (optional, to keep it simple)
6. Click "Create project"
7. Wait for project creation, then click "Continue"

### 2. Enable Authentication

1. In the left sidebar, click "Authentication"
2. Click "Get started"
3. Click on "Sign-in method" tab
4. Click on "Email/Password"
5. Toggle "Enable" to ON
6. Click "Save"

### 3. Create Firestore Database

1. In the left sidebar, click "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Click "Next"
5. Choose a location (e.g., `europe-west1` for Lithuania/Europe)
6. Click "Enable"
7. Wait for database creation

### 4. Enable Storage

1. In the left sidebar, click "Storage"
2. Click "Get started"
3. Select "Start in test mode"
4. Click "Next"
5. Choose the same location as Firestore
6. Click "Done"

### 5. Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview" in the left sidebar
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`)
4. Register app:
   - App nickname: `Dorm Connect` (or any name)
   - Firebase Hosting: Leave unchecked (we're using Next.js)
5. Click "Register app"
6. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

7. Copy these values - you'll need them for `.env.local`

### 6. Create `.env.local` File

Create a file named `.env.local` in the root directory of your project with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (from apiKey)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Replace all values with your actual Firebase config values.

### 7. Set Up Firestore Security Rules

1. Go to Firestore Database → Rules tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any user profile, but only edit their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat messages - authenticated users can read and create
    // Reactions can be updated by any authenticated user
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      // Allow update for message content only if user is the message creator
      // Allow update for reactions by any authenticated user
      allow update: if request.auth != null && (
        // User can update their own message content
        (request.auth.uid == resource.data.userId && 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['message', 'edited', 'editedAt', 'deleted'])) ||
        // Any authenticated user can update reactions
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']))
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Direct messages - users can only read their own conversations
    match /directMessages/{messageId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.fromUserId || 
         request.auth.uid == resource.data.toUserId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.fromUserId;
    }
    
    // Events - anyone can read, authenticated users can create/update
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
  }
}
```

3. Click "Publish"

### 8. Set Up Storage Security Rules

1. Go to Storage → Rules tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can only upload to their own folder
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Next Steps

After completing all steps:
1. Run `npm run dev` to start the development server
2. Open http://localhost:3000
3. Test the app by signing up and creating a profile

