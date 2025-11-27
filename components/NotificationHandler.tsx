'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { initializeFirebaseMessaging, setupMessageListener } from '@/utils/firebaseMessaging';

export default function NotificationHandler() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Firebase Messaging
    const initializeMessaging = async () => {
      try {
        await initializeFirebaseMessaging();
        await setupMessageListener();
        console.log('Firebase Messaging initialized');
      } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
      }
    };

    initializeMessaging();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle notification clicks via service worker messages
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const url = event.data.url || '/home';
          router.push(url);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [router]);

  return null;
}

