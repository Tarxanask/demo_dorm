'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Event } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';

type ESNUniversity = 'VMU' | 'KTU' | 'LSMU';

export default function ESNEventsPage() {
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [selectedUniversity, setSelectedUniversity] = useState<ESNUniversity>('VMU');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
      return;
    }

    async function fetchESNEvents() {
      try {
        setLoading(true);
        const eventsQuery = query(
          collection(db, 'events'),
          where('isESNEvent', '==', true),
          where('esnUniversity', '==', selectedUniversity),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Event));

        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching ESN events:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchESNEvents();
    }
  }, [currentUser, authLoading, router, selectedUniversity]);

  const isESNAdmin = userData?.isESNAdmin && userData?.esnUniversity === selectedUniversity;

  const universities: { id: ESNUniversity; name: string; color: string }[] = [
    { id: 'VMU', name: 'VMU', color: '#f97316' },
    { id: 'KTU', name: 'KTU', color: '#3b82f6' },
    { id: 'LSMU', name: 'LSMU', color: '#10b981' }
  ];

  if (authLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '60px', animation: 'float 2s ease-in-out infinite' }}>🌍</div>
        <div style={{ 
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          fontSize: '1.1rem'
        }}>
          Loading ESN events...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: '#ffffff',
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            ESN Events
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem'
          }}>
            Erasmus Student Network - University Events
          </p>
        </div>

        {/* University Tabs */}
        <div style={{ 
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {universities.map(uni => (
            <button
              key={uni.id}
              onClick={() => setSelectedUniversity(uni.id)}
              style={{
                padding: '1rem 2rem',
                borderRadius: '16px',
                border: selectedUniversity === uni.id 
                  ? `2px solid ${uni.color}`
                  : '2px solid rgba(255, 255, 255, 0.2)',
                background: selectedUniversity === uni.id
                  ? `${uni.color}22`
                  : 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (selectedUniversity !== uni.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedUniversity !== uni.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              ESN {uni.name}
            </button>
          ))}
        </div>

        {/* Admin Controls */}
        {isESNAdmin && (
          <div style={{ 
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <Link href="/esn/create">
              <button
                className="btn btn-primary"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  borderRadius: '16px',
                  background: universities.find(u => u.id === selectedUniversity)?.color,
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              >
                + Create ESN Event
              </button>
            </Link>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
            <h2 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>
              No events yet
            </h2>
            <p>Check back soon for upcoming ESN {selectedUniversity} events!</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {events.map(event => (
              <Link 
                key={event.id}
                href={`/event/${event.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                >
                  {event.imageURL && (
                    <img 
                      src={event.imageURL} 
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '8px',
                      background: universities.find(u => u.id === event.esnUniversity)?.color,
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem'
                    }}>
                      ESN {event.esnUniversity}
                    </div>
                    <h3 style={{ 
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      fontSize: '1.3rem'
                    }}>{event.title}</h3>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '1rem',
                      fontSize: '0.95rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{event.description}</p>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem'
                    }}>
                      <div>📅 {format(new Date(event.date), 'MMM dd, yyyy')}</div>
                      <div>⏰ {event.time}</div>
                      <div>👥 {event.participants.length} / {event.maxParticipants}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
