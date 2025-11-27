import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType } from '@/firebase/types';

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Request notification permission and subscribe
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Get service worker registration
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Error getting service worker:', error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string): Promise<void> {
  try {
    const permission = await requestNotificationPermission();
    if (!permission) {
      return;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return;
    }

    // For now, we'll use the browser Notification API directly
    // In production, you'd want to set up VAPID keys and use push subscriptions
    // Save a simple flag to Firestore that user has enabled notifications
    await setDoc(doc(db, 'notificationSubscriptions', userId), {
      enabled: true,
      userId,
      timestamp: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Save subscription to Firestore
async function saveSubscriptionToFirestore(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  try {
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      console.error('Missing subscription keys');
      return;
    }
    
    const subData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dhKey),
        auth: arrayBufferToBase64(authKey)
      }
    };

    await setDoc(doc(db, 'notificationSubscriptions', userId), subData, { merge: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
  }
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Send notification to all users in a dorm
export async function notifyDormUsers(
  dormId: DormType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    // Check if notifications are enabled for current user
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Use service worker to show notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        data: data || {},
        tag: `dorm-${dormId}`,
        requireInteraction: false
      });
    } else {
      // Fallback to browser notification
      new Notification(title, {
        body,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        tag: `dorm-${dormId}`
      });
    }
  } catch (error) {
    console.error('Error notifying dorm users:', error);
  }
}

// Send notification to all users (global)
export async function notifyAllUsers(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    // Check if notifications are enabled
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Use service worker to show notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        data: data || {},
        tag: 'global',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
    } else {
      // Fallback to browser notification
      new Notification(title, {
        body,
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        tag: 'global'
      });
    }
  } catch (error) {
    console.error('Error notifying all users:', error);
  }
}

