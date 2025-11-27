import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

let messaging: Messaging | null = null;

export async function initializeFirebaseMessaging() {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    if (messaging) {
      return messaging;
    }

    // Initialize messaging only if supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return null;
    }

    messaging = getMessaging();
    console.log('Firebase Messaging initialized');

    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      await subscribeToNotifications();
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToNotifications();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function subscribeToNotifications(userId?: string): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    if (!messaging) {
      messaging = await initializeFirebaseMessaging();
      if (!messaging) {
        console.log('Messaging not available');
        return;
      }
    }

    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.warn('FCM VAPID key not configured');
      return;
    }

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');

      // Save token to Firestore
      if (userId) {
        await setDoc(
          doc(db, 'userTokens', userId),
          {
            fcmToken: token,
            updatedAt: new Date(),
            platform: 'web'
          },
          { merge: true }
        );
        console.log('FCM token saved to Firestore for user:', userId);
      } else {
        // Store in localStorage if no userId
        localStorage.setItem('fcmToken', token);
      }
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
}

export async function setupMessageListener(): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    if (!messaging) {
      messaging = await initializeFirebaseMessaging();
      if (!messaging) {
        return;
      }
    }

    // Listen to messages when the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);

      if (payload.notification) {
        const title = payload.notification.title || 'Dormzy';
        const options: NotificationOptions = {
          body: payload.notification.body,
          icon: payload.notification.icon || '/images/logo.png',
          badge: '/images/logo.png',
          data: payload.data,
          tag: 'dormzy-notification'
        };

        // Show notification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
          });
        } else if ('Notification' in window) {
          new Notification(title, options);
        }
      }
    });

    console.log('Message listener set up');
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
}
