# Firestore Security Rules Update

## Important: Update Your Firebase Rules

You need to update your Firestore security rules in Firebase Console to allow emoji reactions. 

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the `chatMessages` rules section with:

```javascript
// Chat messages - authenticated users can read and create
// Reactions can be updated by any authenticated user
match /chatMessages/{messageId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  // Allow update if:
  // 1. User is updating only reactions (any authenticated user)
  // 2. User is the message creator and updating message content
  allow update: if request.auth != null && (
    // Any authenticated user can update reactions
    (!resource.data.diff(request.resource.data).affectedKeys().hasAny(['message', 'edited', 'editedAt', 'deleted', 'userPhoto', 'userName', 'userId', 'dormId', 'replyTo', 'replyToMessage'])) ||
    // Or user is the message creator
    request.auth.uid == resource.data.userId
  );
  allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

5. Click **Publish**

This allows:
- Any authenticated user to update reactions on any message
- Only the message creator to update message content (text, edit status, deletion)
- Only the message creator to delete their own messages

## Changes Made

1. ✅ Fixed Firebase permissions error for reactions
2. ✅ Fixed emoji reactions display - reactions now show after selection
3. ✅ Fixed profile redirect issue - removed duplicate AuthProvider wrapper
4. ✅ Made group avatar (dorm logo) clickable in chat header
5. ✅ Added consistent back button (arrow icon) across all pages

