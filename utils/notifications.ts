// utils/notifications.ts - Firestore-based notification system
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { NotificationPreferences } from '@/firebase/types';

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

// Check if user should receive notification based on preferences
async function shouldReceiveNotification(
  userId: string,
  dormId: string | null,
  notificationType: 'message' | 'event' | 'info'
): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.notificationPreferences) {
      return true; // Default to receiving notifications if no preferences set
    }

    const prefs: NotificationPreferences = userData.notificationPreferences;

    // Check notification type preferences
    if (notificationType === 'message' && !prefs.messageNotifications) return false;
    if (notificationType === 'event' && !prefs.eventNotifications) return false;

    // Check if dorm is enabled (if it's a dorm notification)
    if (dormId && !prefs.enabledDorms.includes(dormId)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to showing notification on error
  }
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
    // Get all users who are members of this dorm (check both dorm and memberDorms)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Filter users based on preferences and membership
    const eligibleUsers = await Promise.all(
      usersSnapshot.docs
        .filter(userDoc => {
          const userData = userDoc.data();
          const userId = userDoc.id;
          
          // Exclude sender
          if (userId === excludeUserId) return false;
          
          // Check if user is member of this dorm (primary dorm or in memberDorms array)
          const isPrimaryDorm = userData.dorm === dormId;
          const isMemberDorm = userData.memberDorms?.includes(dormId);
          
          return isPrimaryDorm || isMemberDorm;
        })
        .map(async (userDoc) => {
          const shouldReceive = await shouldReceiveNotification(
            userDoc.id,
            dormId,
            notification.type
          );
          return shouldReceive ? userDoc.id : null;
        })
    );

    // Remove null values and send notifications
    const promises = eligibleUsers
      .filter(userId => userId !== null)
      .map(userId => sendNotification(userId!, notification));
    
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

  let isFirstSnapshot = true;

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // Only show notifications for newly added documents (not on initial load)
      if (change.type === 'added' && !isFirstSnapshot) {
        const data = change.doc.data();
        onNotification({
          id: change.doc.id,
          ...data
        } as Notification);
      }
    });
    
    // After first snapshot, mark as not first
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
    }
  });
}
