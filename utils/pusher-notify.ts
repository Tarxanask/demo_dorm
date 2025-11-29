// utils/pusher-notify.ts - Helper to send notifications via Pusher
export async function sendPusherNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: 'message' | 'event' | 'info';
    url?: string;
  }
) {
  try {
    const response = await fetch('/api/pusher/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: `user-${userId}`,
        event: 'notification',
        data: {
          id: Date.now().toString(),
          ...notification,
          timestamp: Date.now()
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return true;
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
    return false;
  }
}

export async function notifyDormUsers(
  dormId: string,
  notification: {
    title: string;
    message: string;
    type: 'message' | 'event' | 'info';
    url?: string;
  },
  excludeUserId?: string
) {
  try {
    // Get all users in the dorm from Firestore
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    const usersQuery = query(
      collection(db, 'users'),
      where('dorm', '==', dormId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    // Send notification to each user except the sender
    const promises = usersSnapshot.docs
      .filter(doc => doc.id !== excludeUserId)
      .map(doc => sendPusherNotification(doc.id, notification));
    
    await Promise.all(promises);
    console.log(`✅ Sent notifications to ${promises.length} users in ${dormId}`);
    
    return true;
  } catch (error) {
    console.error('Error notifying dorm users:', error);
    return false;
  }
}
