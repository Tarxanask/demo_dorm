'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationHandler() {
  const router = useRouter();

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

