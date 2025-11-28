// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBKDDbjcZy7pO4m52M1b7fPM2KxPJpGWCE",
  authDomain: "dorm-b8213.firebaseapp.com",
  projectId: "dorm-b8213",
  storageBucket: "dorm-b8213.firebasestorage.app",
  messagingSenderId: "113572649220",
  appId: "1:113572649220:web:e6a3a9da8a1db97ca5b13f",
  measurementId: "G-KGBW49LWK6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.data?.tag || 'notification',
    requireInteraction: false,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
