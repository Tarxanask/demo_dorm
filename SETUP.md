# Setup Instructions

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enable the following services:

### Authentication
1. Go to Authentication → Sign-in method
2. Enable "Email/Password"
3. Click "Save"

### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in **test mode** (we'll add security rules later)
4. Choose a location (preferably close to your users)

### Storage
1. Go to Storage
2. Click "Get started"
3. Start in **test mode**
4. Choose the same location as Firestore

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app (you can name it "Dorm Connect")
5. Copy the Firebase configuration object

## Step 4: Create Environment File

Create a file named `.env.local` in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace all the values with your actual Firebase configuration values.

## Step 5: Set Up Firestore Security Rules

1. Go to Firestore Database → Rules
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
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
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

## Step 6: Set Up Storage Security Rules

1. Go to Storage → Rules
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
    
    // Event images - authenticated users can upload
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

## Step 7: Create PWA Icons

Create two icon files in the `public` folder:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

You can use any image editor or online tool to create these. They should represent your app (e.g., a dormitory icon or logo).

## Step 8: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 9: Test the App

1. Sign up with a test email
2. Create your profile
3. Create a test event
4. Send a test message in chat

## Troubleshooting

### "Cannot find module" errors
- Make sure you've run `npm install`
- Check that all dependencies in `package.json` are installed

### Firebase connection errors
- Verify your `.env.local` file has correct values
- Make sure Firebase services are enabled in the console
- Check that your Firestore database is created

### Authentication not working
- Verify Email/Password is enabled in Firebase Authentication
- Check browser console for error messages

### Storage upload errors
- Verify Storage is enabled
- Check Storage security rules
- Make sure the file size is reasonable (< 5MB for free tier)

## Next Steps

- Customize the dorm information in `app/dorm/[id]/page.tsx`
- Add more facilities or update dorm locations
- Customize the UI colors and styling
- Add more features as needed

