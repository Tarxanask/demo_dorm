// utils/notifications.ts - Firestore-based notification system
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'event' | 'info';
  url?: string;
  read: boolean;
  createdAt: any;
}

// Send notification to a specific user
export async function sendNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: 'message' | 'event' | 'info';
    url?: string;
  }
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Send notification to all users in a dorm (except sender)
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
    // Get all users in the dorm
    const usersQuery = query(
      collection(db, 'users'),
      where('dorm', '==', dormId)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    // Send notification to each user except the sender
    const promises = usersSnapshot.docs
      .filter(doc => doc.id !== excludeUserId)
      .map(doc => sendNotification(doc.id, notification));
    
    await Promise.all(promises);
    console.log(`✅ Sent notifications to ${promises.length} users in ${dormId}`);
    
    return true;
  } catch (error) {
    console.error('Error notifying dorm users:', error);
    return false;
  }
}

// Send notification to all users (for global chat)
export async function notifyAllUsers(
  title: string,
  message: string,
  data?: { type: 'message' | 'event' | 'info'; url?: string }
) {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Send notification to each user
    const promises = usersSnapshot.docs.map(doc => 
      sendNotification(doc.id, {
        title,
        message,
        type: data?.type || 'info',
        url: data?.url
      })
    );
    
    await Promise.all(promises);
    console.log(`✅ Sent notifications to ${promises.length} users globally`);
    
    return true;
  } catch (error) {
    console.error('Error notifying all users:', error);
    return false;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Subscribe to user's notifications in real-time
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onNotification({
          id: change.doc.id,
          ...data
        } as Notification);
      }
    });
  });
}
