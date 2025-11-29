'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, NotificationPreferences } from '@/firebase/types';
import { useRouter } from 'next/navigation';
import { Notification, markNotificationAsRead } from '@/utils/notifications';

const DORM_INFO: Record<string, { name: string; icon: string }> = {
  'KTU': { name: 'KTU Dormitories', icon: '🏛️' },
  'LSMU': { name: 'LSMU Dormitories', icon: '⚕️' },
  'Solo Society': { name: 'Solo Society', icon: '🏠' },
  'Baltija VDU': { name: 'Baltija VDU', icon: '🎓' },
  'Other Dorms': { name: 'Other Dorms', icon: '🏘️' },
  'General Community': { name: 'General Community', icon: '🌍' }
};

const defaultPreferences: NotificationPreferences = {
  enabledDorms: [],
  messageNotifications: true,
  eventNotifications: true
};

export default function NotificationSettingsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [memberDorms, setMemberDorms] = useState<DormType[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    loadPreferences();
    loadNotificationHistory();
  }, [currentUser]);

  async function loadPreferences() {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (userData) {
        // Load member dorms
        const dorms = userData.memberDorms || [userData.dorm];
        setMemberDorms(dorms);

        // Load preferences or use defaults
        const prefs = userData.notificationPreferences || {
          ...defaultPreferences,
          enabledDorms: dorms // Enable all dorms by default
        };
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadNotificationHistory() {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsList: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifsList.push({
          id: doc.id,
          ...data
        } as Notification);
      });
      setNotifications(notifsList);
    });

    return unsubscribe;
  }

  async function savePreferences() {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        notificationPreferences: preferences
      });
      alert('Notification preferences saved! ✅');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  function toggleDorm(dormId: DormType) {
    setPreferences(prev => ({
      ...prev,
      enabledDorms: prev.enabledDorms.includes(dormId)
        ? prev.enabledDorms.filter(id => id !== dormId)
        : [...prev.enabledDorms, dormId]
    }));
  }

  function toggleAll() {
    setPreferences(prev => ({
      ...prev,
      enabledDorms: prev.enabledDorms.length === memberDorms.length ? [] : [...memberDorms]
    }));
  }

  async function handleNotificationClick(notification: Notification) {
    await markNotificationAsRead(notification.id);
    if (notification.url) {
      router.push(notification.url);
    }
  }

  function formatTimestamp(timestamp: unknown): string {
    if (!timestamp) return '';
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp 
      ? (timestamp as { toDate: () => Date }).toDate() 
      : new Date(timestamp as string | number | Date);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '24px',
      background: '#1a1a1a',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#0ea5e9',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: '16px'
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
          🔔 Notification Settings
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '8px' }}>
          Manage how you receive notifications from dorms and events
        </p>
      </div>

      {/* Notification Types */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
          Notification Types
        </h2>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.messageNotifications}
            onChange={e => setPreferences(prev => ({ ...prev, messageNotifications: e.target.checked }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0ea5e9' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>💬 Chat Messages</div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Receive notifications for new messages</div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.eventNotifications}
            onChange={e => setPreferences(prev => ({ ...prev, eventNotifications: e.target.checked }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0ea5e9' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>📅 Events</div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Receive notifications for new events</div>
          </div>
        </label>
      </div>

      {/* Dorm Notifications */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Dorm Notifications
          </h2>
          <button
            onClick={toggleAll}
            style={{
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid #0ea5e9',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#0ea5e9'
            }}
          >
            {preferences.enabledDorms.length === memberDorms.length ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
          Choose which dorms you want to receive notifications from
        </p>

        {memberDorms.map(dormId => {
          const dormInfo = DORM_INFO[dormId] || { name: dormId, icon: '🏠' };
          const isEnabled = preferences.enabledDorms.includes(dormId);

          return (
            <div
              key={dormId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                background: isEnabled ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: `2px solid ${isEnabled ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)'}`,
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => toggleDorm(dormId)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>{dormInfo.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{dormInfo.name}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {isEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleDorm(dormId)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#0ea5e9'
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        style={{
          width: '100%',
          padding: '16px',
          background: saving ? '#4b5563' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          marginBottom: '24px'
        }}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>

      {/* Notification History */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
          📜 Notification History
        </h2>

        {notifications.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
            No notifications yet
          </p>
        ) : (
          <div>
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: notification.read ? 'rgba(255, 255, 255, 0.03)' : 'rgba(14, 165, 233, 0.1)',
                  border: `1px solid ${notification.read ? 'rgba(255, 255, 255, 0.1)' : '#0ea5e9'}`,
                  marginBottom: '8px',
                  cursor: notification.url ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>
                    {notification.type === 'message' ? '💬' : notification.type === 'event' ? '📅' : 'ℹ️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatTimestamp(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0ea5e9',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
