'use client';

import { useEffect } from 'react';
import { requestNotificationPermission } from '@/utils/notifications';

export default function NotificationHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Request notification permission on mount
    const initializeNotifications = async () => {
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission not granted');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    // Delay the request slightly so it doesn't interfere with page load
    setTimeout(initializeNotifications, 2000);
  }, []);

  return null;
}

