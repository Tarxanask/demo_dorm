# ESN Admin Setup Guide

## Setting Up ESN Admins in Firebase

After deploying your app, you need to manually configure ESN admin accounts in Firebase Firestore. Follow these steps:

### Step 1: Create Admin Accounts

1. Have each ESN admin sign up through your app:
   - **ESN VMU Admin**: `esnvmu@email.com` (password: `esnv123`)
   - **ESN KTU Admin**: `esnktu@email.com` (password: `esnk456`)
   - **ESN LSMU Admin**: `esnlsmu@email.com` (password: `esnl789`)

2. Each admin should complete the profile creation process

### Step 2: Configure Admin Permissions in Firestore

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project: `demo_dorm`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Data" tab

3. **Update Each Admin User Document**

For each ESN admin account, you need to add two fields:

#### For ESN VMU Admin (esnvmu@email.com):
1. Find the user document in the `users` collection (search by email)
2. Click on the document
3. Click "Add field" and add:
   - **Field name**: `isESNAdmin`
   - **Type**: boolean
   - **Value**: `true`
4. Click "Add field" again:
   - **Field name**: `esnUniversity`
   - **Type**: string
   - **Value**: `VMU`
5. Click "Update"

#### For ESN KTU Admin (esnktu@email.com):
1. Find the user document in the `users` collection
2. Add field: `isESNAdmin` = `true` (boolean)
3. Add field: `esnUniversity` = `KTU` (string)

#### For ESN LSMU Admin (esnlsmu@email.com):
1. Find the user document in the `users` collection
2. Add field: `isESNAdmin` = `true` (boolean)
3. Add field: `esnUniversity` = `LSMU` (string)

### Step 3: Deploy Firestore Rules and Indexes

Make sure to deploy the updated Firestore rules and create the required composite index:

**Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

**Deploy Firestore indexes:**
```bash
firebase deploy --only firestore:indexes
```

**Deploy Storage rules (for ESN event images):**
```bash
firebase deploy --only storage
```

**Or deploy everything at once:**
```bash
firebase deploy
```

The rules files (`firestore.rules`, `firestore.indexes.json`, `storage.rules`) already include support for:
- Event chat messages
- ESN event queries with composite indexing
- ESN event image uploads

### Step 4: Verify Admin Access

1. Log in as each ESN admin
2. Navigate to the ESN Events page (ESN logo icon in sidebar)
3. Select your university tab (VMU, KTU, or LSMU)
4. You should see a "+ Create ESN Event" button
5. Only admins for that specific university can create events for their section

**Note:** If you see errors about missing indexes, make sure you've deployed the indexes:
```bash
firebase deploy --only firestore:indexes
```

Wait 1-2 minutes for the index to build, then refresh the page.

### Alternative: Using Firebase Admin SDK (Optional)

If you prefer to automate this, you can create a Node.js script:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupESNAdmins() {
  const admins = [
    { email: 'esnvmu@email.com', university: 'VMU' },
    { email: 'esnktu@email.com', university: 'KTU' },
    { email: 'esnlsmu@email.com', university: 'LSMU' }
  ];

  for (const admin of admins) {
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', admin.email)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        isESNAdmin: true,
        esnUniversity: admin.university
      });
      console.log(`✅ Updated ${admin.email} as ESN ${admin.university} admin`);
    } else {
      console.log(`❌ User ${admin.email} not found. Make sure they've signed up first.`);
    }
  }
}

setupESNAdmins();
```

## Features Available to ESN Admins

Once configured, ESN admins can:

1. **Create ESN Events** for their university
2. **Add Custom Registration Forms** with various field types:
   - Text, Email, Number, Textarea, Select, Checkbox
   - Mark fields as required
   - Add options for select fields

3. **View All Participants** including those who joined anonymously
4. **Access Event Chats** and moderate discussions
5. **Delete Their Events** if needed

## User Features

Regular users can:
- Browse ESN events by university (VMU, KTU, LSMU)
- Join events anonymously (optional)
- Fill out custom registration forms when joining ESN events
- Chat with other participants in event discussion chats
- See anonymous participants as "Anonymous 🕶️" (admins see real names)

## Notes

- Event chats are only visible to participants
- Event creators always see participant identities (even anonymous ones)
- ESN admins can only create events for their assigned university
- Custom form responses are stored in the event document under `formResponses`
