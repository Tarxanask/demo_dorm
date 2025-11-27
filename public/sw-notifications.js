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
  console.log('[sw-notifications.js] Received background message:', payload);
  
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

// Notification handling for service worker
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Dormzy', body: event.data.text() };
    }
  }

  const title = data.title || 'Dormzy';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/images/logo.png',
    badge: '/images/logo.png',
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

