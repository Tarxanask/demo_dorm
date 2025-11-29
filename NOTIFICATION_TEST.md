# Pusher Notification System - Testing Guide

## System Overview
- **Technology**: Pusher Channels (Real-time messaging)
- **Credentials**: App ID 2084524, Cluster: eu
- **Free Tier**: 200k messages/day, 100 concurrent connections

## Notification Flow

```
User A sends message → notifyDormUsers() → Query Firestore for dorm users
→ For each user (except sender):
  → sendPusherNotification(userId, notification)
  → POST to /api/pusher/notify
  → Pusher server triggers event on "user-{userId}" channel
  → User B's PusherNotifications component receives event
  → Toast notification appears in top-right corner
```

## Test Scenarios

### 1. Dorm Chat Notification Test
**Prerequisites**: 
- Two users (A and B) in the same dorm
- Both users logged in

**Steps**:
1. Open two browser windows (or incognito mode)
2. Login as User A in Window 1
3. Login as User B in Window 2
4. User A navigates to dorm chat
5. User A sends a message
6. **Expected Result**: User B sees a toast notification with:
   - Title: "New message in [dorm name]"
   - Message: "[User A name]: [message preview]"
   - Icon: 💬 (message icon)
   - Click redirects to dorm chat

**Console Logs to Check**:
- User A: `✅ Sent notifications to X users in [dorm]`
- User B: `📬 Received notification:` followed by notification data

### 2. Event Creation Notification Test
**Prerequisites**: 
- Two users (A and B) in the same dorm
- Both users logged in

**Steps**:
1. User A navigates to Events page
2. User A clicks "Create Event"
3. User A fills in event details and submits
4. **Expected Result**: User B sees a toast notification with:
   - Title: "New Event in [dorm name]"
   - Message: "[Event name] on [date]"
   - Icon: 🎉 (event icon)
   - Click redirects to event details

### 3. Multi-User Test
**Prerequisites**: 
- Three or more users in the same dorm

**Steps**:
1. All users logged in different browsers/tabs
2. User A sends a message
3. **Expected Result**: All other users see the notification simultaneously

### 4. Cross-Dorm Test
**Prerequisites**: 
- User A in Dorm X
- User B in Dorm Y

**Steps**:
1. User A sends message in Dorm X chat
2. **Expected Result**: User B does NOT receive notification (different dorm)

## Debugging Checklist

### If notifications don't appear:

1. **Check Browser Console (F12)**:
   - Look for: `Initializing Pusher client with cluster: eu`
   - Look for: `Setting up Pusher for user: [userId]`
   - Check for any Pusher connection errors

2. **Check Environment Variables**:
   ```
   NEXT_PUBLIC_PUSHER_KEY=e4be42c03ce1afacd3b0
   NEXT_PUBLIC_PUSHER_CLUSTER=eu
   PUSHER_APP_ID=2084524
   PUSHER_SECRET=d02b4be241c967cdb652
   ```

3. **Verify API Route**:
   - Check Network tab for POST to `/api/pusher/notify`
   - Should return: `{"success":true}`
   - If 500 error, check server console

4. **Check Firestore**:
   - Ensure users have `dorm` field set correctly
   - Query: `users` collection where `dorm == [dormId]`

5. **Restart Dev Server**:
   ```powershell
   # Kill existing server
   Stop-Process -Name "node" -Force
   
   # Clear Next.js cache
   Remove-Item -Recurse -Force .next
   
   # Restart
   npm run dev
   ```

## Current Status

### ✅ Implemented Features:
- Pusher client/server setup
- API route for sending notifications
- PusherNotifications toast component
- Integration with dorm chat
- Integration with event creation
- Automatic user query from Firestore
- Toast auto-hide after 5 seconds
- Click-to-navigate functionality

### 🧪 Testing Status:
- [ ] Single user notification
- [ ] Multi-user notification
- [ ] Cross-dorm isolation
- [ ] Event notifications
- [ ] Chat notifications
- [ ] Toast UI appearance
- [ ] Click navigation
- [ ] Auto-hide functionality

## Known Limitations

1. **Browser Required**: No iOS/Android native push notifications (Pusher Beams would be needed for that)
2. **User Must Be Online**: Notifications only appear to active users
3. **No Notification History**: Missed notifications are not stored
4. **Rate Limits**: Free tier limited to 200k messages/day

## Next Steps for Full Production

If needed in the future:
1. Add notification history in Firestore
2. Implement read/unread status
3. Add notification preferences (mute dorms, etc.)
4. Upgrade to Pusher Beams for mobile push
5. Add notification sounds
6. Add badge counts
