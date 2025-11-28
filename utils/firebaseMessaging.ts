// Simple browser notifications without Firebase Cloud Messaging
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function showNotification(title: string, options?: NotificationOptions): Promise<void> {
  try {
    if (typeof window === 'undefined') return;

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Use service worker notification if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        ...options
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        ...options
      });
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// No longer needed - removing FCM complexity
export async function initializeFirebaseMessaging() {
  return null;
}

export async function subscribeToNotifications() {
  return;
}

export async function setupMessageListener() {
  return;
}
