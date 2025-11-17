'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, Event, User } from '@/firebase/types';
import Link from 'next/link';
import { FiUsers, FiMessageCircle, FiCalendar, FiPlus, FiHome, FiHash, FiSearch, FiBell, FiSettings } from 'react-icons/fi';
import { format } from 'date-fns';

const DORMS: { id: DormType; name: string; color: string }[] = [
  { id: 'KTU', name: 'KTU', color: '#3b82f6' },
  { id: 'LSMU', name: 'LSMU', color: '#10b981' },
  { id: 'Solo Society', name: 'Solo Society', color: '#8b5cf6' },
  { id: 'Baltija VDU', name: 'Baltija VDU', color: '#f97316' },
  { id: 'Other Dorms', name: 'Other Dorms', color: '#ec4899' }
];

function HomeContent() {
  const { currentUser, userData, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedDorm, setSelectedDorm] = useState<DormType | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<DormType, number>>({
    'KTU': 0,
    'LSMU': 0,
    'Solo Society': 0,
    'Baltija VDU': 0,
    'Other Dorms': 0
  });
  const [eventCounts, setEventCounts] = useState<Record<DormType, number>>({
    'KTU': 0,
    'LSMU': 0,
    'Solo Society': 0,
    'Baltija VDU': 0,
    'Other Dorms': 0
  });
  const [messageCounts, setMessageCounts] = useState<Record<DormType, number>>({
    'KTU': 0,
    'LSMU': 0,
    'Solo Society': 0,
    'Baltija VDU': 0,
    'Other Dorms': 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    user: string;
    action: string;
    time: string;
    avatar: string;
  }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    if (userData === null || (userData && !userData.dorm)) {
      router.push('/profile/create');
      return;
    }
    if (userData?.dorm) {
      setSelectedDorm(userData.dorm);
    }
  }, [currentUser, userData, loading, router]);

  useEffect(() => {
    if (!userData?.dorm) return;

    async function fetchStats() {
      // Fetch member counts
      const counts: Record<DormType, number> = {
        'KTU': 0, 'LSMU': 0, 'Solo Society': 0, 'Baltija VDU': 0, 'Other Dorms': 0
      };
      const eventCounts: Record<DormType, number> = {
        'KTU': 0, 'LSMU': 0, 'Solo Society': 0, 'Baltija VDU': 0, 'Other Dorms': 0
      };
      const msgCounts: Record<DormType, number> = {
        'KTU': 0, 'LSMU': 0, 'Solo Society': 0, 'Baltija VDU': 0, 'Other Dorms': 0
      };

      for (const dorm of DORMS) {
        const userQuery = query(collection(db, 'users'), where('dorm', '==', dorm.id));
        const userSnapshot = await getDocs(userQuery);
        counts[dorm.id] = userSnapshot.size;

        const eventQuery = query(collection(db, 'events'), where('dormId', '==', dorm.id));
        const eventSnapshot = await getDocs(eventQuery);
        eventCounts[dorm.id] = eventSnapshot.size;

        const msgQuery = query(collection(db, 'chatMessages'), where('dormId', '==', dorm.id));
        const msgSnapshot = await getDocs(msgQuery);
        msgCounts[dorm.id] = msgSnapshot.size;
      }

      setMemberCounts(counts);
      setEventCounts(eventCounts);
      setMessageCounts(msgCounts);
    }

    fetchStats();

    // Fetch recent activity
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const activities: Array<{ user: string; action: string; time: string; avatar: string }> = [];
      snapshot.docs.slice(-5).forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        activities.push({
          user: data.displayName || 'User',
          action: 'joined the dorm',
          time: format(createdAt, 'MMM dd, yyyy'),
          avatar: (data.displayName || 'U').substring(0, 2).toUpperCase()
        });
      });
      setRecentActivity(activities.reverse());
    });

    return () => unsubscribe();
  }, [userData]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}>
        Loading...
      </div>
    );
  }

  if (!userData || !userData.dorm) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}>
        Loading...
      </div>
    );
  }

  const currentDorm = selectedDorm ? DORMS.find(d => d.id === selectedDorm) : DORMS.find(d => d.id === userData.dorm);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Discord Style */}
      <div style={{
        width: '80px',
        background: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: '12px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100
      }}>
        {/* Global Chat Icon */}
        <Link 
          href="/chat/global"
          style={{
            width: '48px',
            height: '48px',
            background: pathname === '/chat/global' ? '#667eea' : 'transparent',
            borderRadius: pathname === '/chat/global' ? '12px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/chat/global') {
              e.currentTarget.style.background = '#2a2a2a';
              e.currentTarget.style.borderRadius = '12px';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/chat/global') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderRadius = '24px';
            }
          }}
        >
          <FiMessageCircle size={24} />
        </Link>
        
        <div style={{ width: '32px', height: '2px', background: '#2a2a2a', borderRadius: '1px' }}></div>
        
        {/* Dorm Icons */}
        {DORMS.map((dorm) => {
          const isSelected = selectedDorm === dorm.id;
          const isUserDorm = userData.dorm === dorm.id;
          return (
            <div
              key={dorm.id}
              onClick={() => setSelectedDorm(dorm.id)}
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                background: isSelected ? dorm.color : 'transparent',
                borderRadius: isSelected ? '12px' : '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.borderRadius = '12px';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderRadius = '24px';
                }
              }}
              title={dorm.name}
            >
              {dorm.name.substring(0, 2).toUpperCase()}
              {isUserDorm && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid #1e1e1e'
                }}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <div style={{
          height: '56px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiHash size={20} color="#9ca3af" />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              {currentDorm?.name || 'Home'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  paddingLeft: '36px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '256px',
                  outline: 'none'
                }}
              />
            </div>
            <Link 
              href="/profile"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              {userData.photoURL ? (
                <img 
                  src={userData.photoURL} 
                  alt={userData.displayName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                userData.displayName.charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '32px',
          background: '#f5f5f5'
        }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: currentDorm?.color || '#667eea',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <FiUsers size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>
                      {currentDorm ? memberCounts[currentDorm.id] : 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Members</div>
                  </div>
                </div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#3b82f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <FiMessageCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>
                      {currentDorm ? messageCounts[currentDorm.id] : 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Messages</div>
                  </div>
                </div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#10b981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <FiCalendar size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>
                      {currentDorm ? eventCounts[currentDorm.id] : 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Events</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#9ca3af', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '16px'
              }}>
                Quick Actions
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <Link
                  href={currentDorm ? `/chat/${encodeURIComponent(currentDorm.id)}` : '/chat/global'}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #f3f4f6',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#e0e7ff',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiMessageCircle size={24} color="#667eea" />
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>Join Chat</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginLeft: '64px', margin: 0 }}>
                    Connect with your dorm members
                  </p>
                </Link>
                
                <Link
                  href={currentDorm ? `/events/${encodeURIComponent(currentDorm.id)}` : '/home'}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #f3f4f6',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#d1fae5',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiCalendar size={24} color="#10b981" />
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>See Events</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginLeft: '64px', margin: 0 }}>
                    View upcoming activities
                  </p>
                </Link>
              </div>
            </div>

            {/* Create Event Banner */}
            <Link
              href={currentDorm ? `/events/create?dorm=${encodeURIComponent(currentDorm.id)}` : '/events/create'}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: 'white',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', margin: 0 }}>
                  Create New Event
                </h3>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                  Organize activities and bring your dorm together
                </p>
              </div>
              <div style={{
                background: 'white',
                color: '#667eea',
                padding: '12px 32px',
                borderRadius: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiPlus size={20} />
                Create Event
              </div>
            </Link>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div>
                <h2 style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#9ca3af', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  marginBottom: '16px'
                }}>
                  Recent Activity
                </h2>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #f3f4f6',
                  overflow: 'hidden'
                }}>
                  {recentActivity.map((activity, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: idx < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {activity.avatar}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                            <span style={{ fontWeight: 600 }}>{activity.user}</span> {activity.action}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-menu-button"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          alignItems: 'center',
          justifyContent: 'center',
          display: 'none'
        }}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="width: 80px"] {
            position: fixed;
            left: ${sidebarOpen ? '0' : '-80px'};
            top: 0;
            height: 100vh;
            transition: left 0.3s ease;
            z-index: 999;
          }
          div[style*="max-width: 1152px"] {
            padding: 16px;
          }
          div[style*="gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'"] {
            grid-template-columns: 1fr;
          }
          div[style*="gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'"] {
            grid-template-columns: 1fr;
          }
          input[style*="width: 256px"] {
            width: 150px !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
