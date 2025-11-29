'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscribeToNotifications, markNotificationAsRead, Notification } from '@/utils/notifications';

export default function NotificationToast() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    console.log('📡 Setting up real-time notifications for user:', currentUser.uid);

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notification) => {
      console.log('📬 New notification received:', notification);
      
      setCurrentNotification(notification);
      setShowToast(true);

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    });

    return () => {
      console.log('Unsubscribing from notifications');
      unsubscribe();
    };
  }, [currentUser]);

  const handleNotificationClick = async (notification: Notification) => {
    setShowToast(false);
    
    // Mark as read
    await markNotificationAsRead(notification.id);
    
    // Navigate to URL if provided
    if (notification.url) {
      router.push(notification.url);
    }
  };

  if (!currentUser || !showToast || !currentNotification) return null;

  // Icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'event':
        return '📅';
      default:
        return 'ℹ️';
    }
  };

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
        animation: 'slideInRight 0.3s ease-out',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          {getIcon(currentNotification.type)}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentNotification.title}
          </div>
          
          <div style={{
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {currentNotification.message}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowToast(false);
            markNotificationAsRead(currentNotification.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#999',
            cursor: 'pointer',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ×
        </button>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
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
