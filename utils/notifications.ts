import { showNotification, requestNotificationPermission as requestPermission } from './firebaseMessaging';

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  return await requestPermission();
}

// Show a simple browser notification
export async function showLocalNotification(title: string, body: string, data?: any): Promise<void> {
  await showNotification(title, {
    body,
    data,
    tag: 'dormzy',
    requireInteraction: false
  });
}

// Notify dorm users (shows notification only to current user - simplified)
export async function notifyDormUsers(
  dormId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Simply show notification to current user
  await showLocalNotification(title, body, data);
}

// Notify all users (shows notification only to current user - simplified)
export async function notifyAllUsers(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Simply show notification to current user
  await showLocalNotification(title, body, data);
}
