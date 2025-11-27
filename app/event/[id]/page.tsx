'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Event, User } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';
import BackButton from '@/components/BackButton';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
      return;
    }

    async function fetchEvent() {
      try {
        const eventDoc = await getDoc(doc(db, 'events', params.id as string));
        if (eventDoc.exists()) {
          const eventData = {
            id: eventDoc.id,
            ...eventDoc.data(),
            createdAt: eventDoc.data().createdAt?.toDate() || new Date()
          } as Event;
          setEvent(eventData);

          // Fetch participants
          if (eventData.participants.length > 0) {
            const participantDocs = await Promise.all(
              eventData.participants.map(uid => getDoc(doc(db, 'users', uid)))
            );
            const participantsList = participantDocs
              .filter(doc => doc.exists())
              .map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
              } as User));
            setParticipants(participantsList);
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id && !authLoading) {
      fetchEvent();
    }
  }, [params.id, currentUser, authLoading, router]);

  async function handleJoinEvent() {
    if (!currentUser || !event || !userData) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as Event;
        
        if (eventData.participants.includes(currentUser.uid)) {
          await updateDoc(eventRef, {
            participants: arrayRemove(currentUser.uid)
          });
          // Refresh event data
          const updatedDoc = await getDoc(eventRef);
          if (updatedDoc.exists()) {
            setEvent({
              id: updatedDoc.id,
              ...updatedDoc.data(),
              createdAt: updatedDoc.data().createdAt?.toDate() || new Date()
            } as Event);
          }
        } else {
          // Check if event is residents-only and user is not a resident
          if (eventData.residentsOnly && userData.dorm !== eventData.dormId) {
            alert(`This event is only for ${eventData.dormId} residents. You are a ${userData.dorm} resident and cannot join this event.`);
            return;
          }
          
          if (eventData.participants.length >= eventData.maxParticipants) {
            alert('Event is full');
            return;
          }
          
          // Show cross-dorm visitor notice if user is from different dorm
          if (!eventData.residentsOnly && userData.dorm !== eventData.dormId) {
            const confirmMessage = `You are a ${userData.dorm} resident joining an event in ${eventData.dormId}.\n\n` +
              `As a visitor, you must:\n` +
              `• Be accompanied by a ${eventData.dormId} resident (the host)\n` +
              `• Obey ${eventData.dormId}'s rules (quiet hours, no alcohol in common areas if forbidden)\n` +
              `• Present ID at reception if requested\n\n` +
              `Do you understand and agree to follow these rules?`;
            
            if (!confirm(confirmMessage)) {
              return;
            }
          }
          
          await updateDoc(eventRef, {
            participants: arrayUnion(currentUser.uid)
          });
          // Refresh event data
          const updatedDoc = await getDoc(eventRef);
          if (updatedDoc.exists()) {
            setEvent({
              id: updatedDoc.id,
              ...updatedDoc.data(),
              createdAt: updatedDoc.data().createdAt?.toDate() || new Date()
            } as Event);
          }
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join/leave event. Please try again.');
    }
  }

  async function handleDeleteEvent() {
    if (!currentUser || !event) return;
    
    if (event.hostId !== currentUser.uid) {
      alert('Only the event host can delete this event');
      return;
    }

    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', event.id));
      router.push(`/events/${event.dormId}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

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
        <div style={{ fontSize: '60px', animation: 'float 2s ease-in-out infinite' }}>🎉</div>
        <div style={{ 
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          fontSize: '1.1rem'
        }}>
          Loading event...
        </div>
      </div>
    );
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const isParticipating = currentUser && event.participants.includes(currentUser.uid);
  
  const canJoinEvent = () => {
    if (!currentUser || !userData) return false;
    // If event is residents-only, user must be from the same dorm
    if (event.residentsOnly && userData.dorm !== event.dormId) {
      return false;
    }
    return true;
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton href={`/events/${encodeURIComponent(event.dormId)}`} />

        <div className="card" style={{ 
          marginBottom: '1.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          color: '#ffffff'
        }}>
        {event.imageURL && (
          <img 
            src={event.imageURL} 
            alt={event.title}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>{event.title}</h1>
        </div>
        
        <div style={{ marginBottom: '1rem', color: '#666' }}>
          <div><strong>Dorm:</strong> {event.dormId}</div>
          <div><strong>Host:</strong> {event.hostName}</div>
          {!event.isHostResident && event.dormId !== 'General Community' && (
            <div style={{ 
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              color: '#856404'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                ⚠ Cross-Dorm Event Notice
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                The host <strong>{event.hostName}</strong> is not a resident of <strong>{event.dormId}</strong>.
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <strong>For visitors to {event.dormId}:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', paddingLeft: '0' }}>
                  <li>You must be accompanied by a {event.dormId} resident (the host)</li>
                  <li>Obey {event.dormId}&apos;s rules (quiet hours, no alcohol in common areas if forbidden)</li>
                  <li>Present ID at reception if requested</li>
                </ul>
              </div>
            </div>
          )}
          <div><strong>Date:</strong> {format(new Date(event.date), 'MMMM dd, yyyy')}</div>
          <div><strong>Time:</strong> {event.time}</div>
          <div>
            <strong>Participants:</strong> {event.participants.length} / {event.maxParticipants}
            {event.desiredParticipants && (
              <span> (Desired: {event.desiredParticipants})</span>
            )}
          </div>
          {event.residentsOnly && event.dormId !== 'General Community' && (
            <div style={{ color: '#0070f3', marginTop: '0.5rem' }}>
              🔒 Residents only event
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          {!canJoinEvent() && event.residentsOnly && event.dormId !== 'General Community' ? (
            <button
              disabled
              className="btn btn-secondary"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title={`This event is only for ${event.dormId} residents`}
            >
              Join Event (Residents Only)
            </button>
          ) : (
            <button
              onClick={handleJoinEvent}
              className={isParticipating ? 'btn btn-secondary' : 'btn btn-primary'}
            >
              {isParticipating ? 'Leave Event' : 'Join Event'}
            </button>
          )}
          {currentUser && event.hostId === currentUser.uid && (
            <button
              onClick={handleDeleteEvent}
              className="btn btn-secondary"
              style={{ background: '#dc3545', color: 'white' }}
            >
              Delete Event
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>
          Participants ({participants.length})
        </h2>

        {participants.length === 0 ? (
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            textAlign: 'center',
            fontSize: '1rem',
            padding: '2rem'
          }}>No participants yet</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {participants.map(participant => (
              <Link 
                key={participant.uid}
                href={`/profile/${participant.uid}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
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
                  {participant.photoURL ? (
                    <img 
                      src={participant.photoURL} 
                      alt={participant.displayName}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '0.75rem',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      margin: '0 auto 0.75rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }} />
                  )}
                  <div style={{ 
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '0.25rem',
                    fontSize: '1rem'
                  }}>{participant.displayName}</div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>{participant.faculty}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

