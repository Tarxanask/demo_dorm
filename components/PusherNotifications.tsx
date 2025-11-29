'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPusherClient } from '@/lib/pusher-client';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'event' | 'info';
  url?: string;
  timestamp: number;
}

export default function PusherNotifications() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${currentUser.uid}`);

    // Listen for notifications
    channel.bind('notification', (data: Notification) => {
      console.log('📬 Received notification:', data);
      
      setCurrentNotification(data);
      setShowToast(true);

      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    });

    return () => {
      channel.unbind('notification');
      pusher.unsubscribe(`user-${currentUser.uid}`);
    };
  }, [currentUser]);

  const handleNotificationClick = (notification: Notification) => {
    setShowToast(false);
    if (notification.url) {
      router.push(notification.url);
    }
  };

  if (!currentUser || !showToast || !currentNotification) return null;

  return (
    <div
      onClick={() => handleNotificationClick(currentNotification)}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        maxWidth: '350px',
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '16px',
        cursor: 'pointer',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: currentNotification.type === 'message' ? '#667eea' : '#48bb78',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {currentNotification.type === 'message' ? (
            <i className="bi bi-chat-dots" style={{ color: 'white', fontSize: '20px' }}></i>
          ) : (
            <i className="bi bi-calendar-event" style={{ color: 'white', fontSize: '20px' }}></i>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>
            {currentNotification.title}
          </div>
          <div style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.4' }}>
            {currentNotification.message}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowToast(false);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a0aec0',
            cursor: 'pointer',
            padding: '0',
            fontSize: '18px'
          }}
        >
          ×
        </button>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
