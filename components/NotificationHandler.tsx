'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const url = event.data.url || '/home';
          router.push(url);
        }
      });
    }

    // Handle notification clicks from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Listen for notification clicks
        self.addEventListener?.('notificationclick', (event: any) => {
          event.notification.close();
          const data = event.notification.data || {};
          const url = data.url || '/home';
          router.push(url);
        });
      });
    }
  }, [router]);

  return null;
}

