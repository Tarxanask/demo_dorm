# Kaunas Dorm Connect - Progressive Web App

A Progressive Web App (PWA) that connects residents from Kaunas dormitories (KTU, LSMU, Solo Society, VMU Dorms, and Other Dorms). The app enables residents to organize events, chat with each other, and find friends across different dormitories.

## Features

- 🔐 **Authentication**: Sign up and login with email/password
- 👤 **User Profiles**: Create profiles with photo, hobbies, name, and faculty
- 🏠 **Dorm Management**: View all 5 dormitories with member counts
- 💬 **Chat System**: 
  - Dorm-wide group chats (like WhatsApp/Messenger)
  - Direct messaging between users
  - Reply to messages functionality
- 📅 **Events System**:
  - Create events with date, time, participants limit
  - View all events by dorm
  - Join/leave events
  - See event participants
  - Warning if event host is not a resident
- 👥 **Member Directory**: Browse all members of each dorm
- 📱 **PWA**: Installable on mobile and desktop devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Backend**: Firebase (Free Tier)
  - Authentication
  - Firestore Database
  - Storage (for profile pictures)
- **PWA**: next-pwa
- **Styling**: CSS Modules with global styles

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase config and create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your `.env.local` file with Firebase credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Firestore Collections

The app uses the following Firestore collections:

- `users`: User profiles
  - `uid`, `email`, `displayName`, `photoURL`, `dorm`, `faculty`, `hobbies`, `createdAt`

- `chatMessages`: Dorm chat messages
  - `dormId`, `userId`, `userName`, `userPhoto`, `message`, `replyTo`, `replyToMessage`, `timestamp`

- `directMessages`: Direct messages between users
  - `fromUserId`, `toUserId`, `message`, `fromUserName`, `fromUserPhoto`, `timestamp`

- `events`: Events created by users
  - `dormId`, `hostId`, `hostName`, `hostPhoto`, `isHostResident`, `title`, `description`, `date`, `time`, `desiredParticipants`, `maxParticipants`, `residentsOnly`, `participants`, `createdAt`

## Firebase Security Rules

Make sure to set up proper Firestore security rules. Here's a basic example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any user profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat messages
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Direct messages
    match /directMessages/{messageId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.fromUserId || 
         request.auth.uid == resource.data.toUserId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.fromUserId;
    }
    
    // Events
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

## Building for Production

```bash
npm run build
npm start
```

## PWA Icons

You'll need to add PWA icons to the `public` folder:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

You can create these using any image editor or online tool. The icons will be used when users install the app on their devices.

## PWA Installation

The app is a Progressive Web App and can be installed on:
- **Mobile**: Add to home screen from browser menu
- **Desktop**: Install prompt will appear in supported browsers

## Firebase Free Tier Limits

The app is designed to work within Firebase's free tier limits:
- **Authentication**: 50,000 MAU (Monthly Active Users)
- **Firestore**: 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day
- **Storage**: 5 GB storage, 1 GB/day downloads

For most dormitory use cases, this should be sufficient. Monitor usage in Firebase Console.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── home/              # Main dashboard
│   ├── dorm/              # Dorm pages
│   ├── profile/           # User profile pages
│   ├── chat/              # Chat pages
│   ├── events/            # Event pages
│   └── layout.tsx         # Root layout
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── firebase/              # Firebase configuration
│   ├── config.ts          # Firebase setup
│   └── types.ts           # TypeScript types
├── public/                # Static files
│   └── manifest.json      # PWA manifest
└── package.json
```

## License

MIT

