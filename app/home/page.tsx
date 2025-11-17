'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType } from '@/firebase/types';
import Link from 'next/link';
import { FiUsers, FiMessageCircle, FiCalendar, FiPlus } from 'react-icons/fi';

const DORMS: { id: DormType; name: string }[] = [
  { id: 'KTU', name: 'KTU' },
  { id: 'LSMU', name: 'LSMU' },
  { id: 'Solo Society', name: 'Solo Society' },
  { id: 'Baltija VDU', name: 'Baltija VDU' },
  { id: 'Other Dorms', name: 'Other Dorms' }
];

function HomeContent() {
  const { currentUser, userData, logout, loading } = useAuth();
  const router = useRouter();
  const [memberCounts, setMemberCounts] = useState<Record<DormType, number>>({
    'KTU': 0,
    'LSMU': 0,
    'Solo Society': 0,
    'Baltija VDU': 0,
    'Other Dorms': 0
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeFading, setWelcomeFading] = useState(false);
  const hasShownWelcome = useRef(false);
  const welcomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (loading) {
      return;
    }

    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Only redirect to profile/create if userData is explicitly null (no document) 
    // or if userData exists but has no dorm field
    if (userData === null) {
      // User document doesn't exist - need to create profile
      router.push('/profile/create');
      return;
    }

    if (userData && !userData.dorm) {
      // User document exists but no dorm field - need to complete profile
      router.push('/profile/create');
      return;
    }

    // Fetch member counts for each dorm
    async function fetchMemberCounts() {
      const counts: Record<DormType, number> = {
        'KTU': 0,
        'LSMU': 0,
        'Solo Society': 0,
        'Baltija VDU': 0,
        'Other Dorms': 0
      };

      for (const dorm of DORMS) {
        const q = query(collection(db, 'users'), where('dorm', '==', dorm.id));
        const snapshot = await getDocs(q);
        counts[dorm.id] = snapshot.size;
      }

      setMemberCounts(counts);
    }

    fetchMemberCounts();
  }, [currentUser, userData, loading, router]);

  // Show welcome message temporarily on login - only once per session
  useEffect(() => {
    if (!userData || loading) return;

    // Check if we've already shown welcome in this session
    const hasShownWelcomeSession = sessionStorage.getItem('hasShownWelcome') === 'true';
    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
    
    // Only show if user just logged in and we haven't shown it yet in this session
    if (justLoggedIn && !hasShownWelcomeSession) {
      // Clear the justLoggedIn flag
      sessionStorage.removeItem('justLoggedIn');
      // Set flag so it doesn't show again when navigating back to home
      sessionStorage.setItem('hasShownWelcome', 'true');
      hasShownWelcome.current = true;
      setShowWelcome(true);
      
      // Hide welcome message after 3 seconds
      welcomeTimerRef.current = setTimeout(() => {
        setWelcomeFading(true);
        setTimeout(() => {
          setShowWelcome(false);
          setWelcomeFading(false);
        }, 300); // Fade out animation duration
      }, 3000);
    }

    return () => {
      if (welcomeTimerRef.current) {
        clearTimeout(welcomeTimerRef.current);
      }
    };
  }, [userData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData || !userData.dorm) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ 
        marginBottom: '2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '45px',
              height: '45px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '20px'
            }}>
              D
            </div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px',
              fontWeight: 700,
              color: '#1f2937'
            }}>
              Dormzy
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {showWelcome && (
              <span 
                style={{ 
                  fontSize: '0.9rem',
                  color: '#667eea',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  background: '#e6f2ff',
                  borderRadius: '20px',
                  opacity: welcomeFading ? 0 : 1,
                  transition: 'opacity 0.3s ease-out',
                  animation: welcomeFading ? 'none' : 'slideIn 0.3s ease-out'
                }}
              >
                Welcome, {userData.displayName}! 👋
              </span>
            )}
            <Link 
              href="/profile" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.9rem', padding: '10px 24px', borderRadius: '10px' }}
            >
              Profile
            </Link>
            <button 
              className="btn btn-primary"
              onClick={() => logout()}
              style={{ fontSize: '0.9rem', padding: '10px 24px', borderRadius: '10px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
        gap: '25px'
      }}>
        {DORMS.map((dorm, index) => (
          <div 
            key={dorm.id} 
            className="card" 
            style={{ 
              border: userData.dorm === dorm.id ? '2px solid #667eea' : 'none',
              animation: `fadeIn 0.6s ease forwards`,
              animationDelay: `${index * 0.1}s`,
              opacity: 0
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px',
                fontWeight: 700,
                color: '#1f2937'
              }}>
                {dorm.name}
              </h2>
              {userData.dorm === dorm.id && (
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Your Dorm
                </span>
              )}
            </div>
            
            <Link 
              href={`/dorm/${encodeURIComponent(dorm.id)}`}
              className="btn btn-secondary"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                textDecoration: 'none', 
                display: 'flex',
                marginBottom: '18px',
                padding: '14px',
                borderRadius: '12px'
              }}
            >
              View Dorm →
            </Link>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px',
              background: '#f9fafb',
              borderRadius: '10px',
              marginBottom: '18px',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <FiUsers style={{ width: '20px', height: '20px' }} />
              <span>{memberCounts[dorm.id]} members</span>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              <Link 
                href={`/chat/${encodeURIComponent(dorm.id)}`}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  textDecoration: 'none', 
                  display: 'flex',
                  padding: '14px',
                  borderRadius: '12px',
                  gap: '8px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <FiMessageCircle style={{ width: '18px', height: '18px' }} />
                Join Chat
              </Link>

              <Link 
                href={`/events/${encodeURIComponent(dorm.id)}`}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  textDecoration: 'none', 
                  display: 'flex',
                  padding: '14px',
                  borderRadius: '12px',
                  gap: '8px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <FiCalendar style={{ width: '18px', height: '18px' }} />
                See Events
              </Link>

              <Link 
                href={`/events/create?dorm=${encodeURIComponent(dorm.id)}`}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  textDecoration: 'none', 
                  display: 'flex',
                  padding: '14px',
                  borderRadius: '12px',
                  gap: '8px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FiPlus style={{ width: '18px', height: '18px' }} />
                Create Event
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}

