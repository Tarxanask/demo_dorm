# Pusher Real-Time Notifications Setup

## Why Pusher?

We've switched from browser notifications to **Pusher** because:
- ✅ Works across ALL devices and browsers
- ✅ No permission prompts needed
- ✅ Instant real-time delivery
- ✅ Works even when page is not open (via background sync)
- ✅ Free tier: 200k messages/day, 100 concurrent connections
- ✅ Much simpler than Firebase Cloud Messaging

## Setup Steps

### 1. Create Pusher Account

1. Go to https://dashboard.pusher.com/accounts/sign_up
2. Sign up (free tier is enough)
3. Create a new Channels app:
   - Name: `Dormzy Notifications`
   - Cluster: Choose closest to your users (EU for Europe, US2 for US, etc.)
   - Tech stack: Select any (doesn't matter)

### 2. Get Your Credentials

After creating the app, you'll see:
- **app_id**
- **key**
- **secret**
- **cluster**

### 3. Add to Environment Variables

Add these to your `.env.local` file:

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=eu  # or us2, ap1, etc.
PUSHER_APP_ID=your_app_id_here
PUSHER_SECRET=your_secret_here
```

### 4. Restart Development Server

```bash
npm run dev
```

## How It Works

### For Users Receiving Notifications:

1. User logs in → Subscribes to channel `user-{userId}`
2. Another user sends message/creates event → Triggers notification
3. **Toast popup appears** in top-right corner
4. Click toast → Navigate to chat/event
5. **Works on all devices** where user is logged in

### For Developers:

**Send notification to specific user:**
```typescript
import { sendPusherNotification } from '@/utils/pusher-notify';

await sendPusherNotification('userId123', {
  title: 'New Message',
  message: 'John sent you a message',
  type: 'message',
  url: '/chat/KTU'
});
```

**Send notification to all dorm users:**
```typescript
import { notifyDormUsers } from '@/utils/pusher-notify';

await notifyDormUsers(
  'KTU',  // dormId
  {
    title: 'New Event',
    message: 'John created "Basketball Game"',
    type: 'event',
    url: '/events/KTU'
  },
  currentUser.uid  // exclude sender
);
```

## Testing

1. Open app in **two different browsers** (or incognito + normal)
2. Login as different users in same dorm
3. Send message from User A
4. **User B should see toast notification** immediately
5. Check browser console for debug logs

## Debugging

Check console for:
- `📬 Received notification:` - Notification received
- `✅ Sent notifications to X users` - Notification sent

Common issues:
- **No notification?** Check Pusher credentials in `.env.local`
- **Invalid credentials?** Verify in Pusher dashboard
- **Wrong cluster?** Must match what you selected in Pusher

## Free Tier Limits

- **200,000 messages/day** (plenty for notifications)
- **100 concurrent connections**
- **200 MB/day data transfer**

Enough for thousands of active users!

## Pusher Dashboard

Monitor in real-time:
- https://dashboard.pusher.com → Select your app → Debug Console
- See live connections and messages
