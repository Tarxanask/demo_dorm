'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, Event } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  // Decode the dormId from URL (handles URL encoding like %20 for spaces)
  const dormId = decodeURIComponent(params.dormId as string) as DormType;

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Query events for this dorm
    const q = query(
      collection(db, 'events'),
      where('dormId', '==', dormId)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const eventsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Event;
        });
        
        // Filter out past events (events where the date has passed)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        const activeEvents = eventsList.filter(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        
        // Sort by date client-side (since composite index might not exist)
        activeEvents.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          // If same date, sort by time
          return a.time.localeCompare(b.time);
        });
        
        setEvents(activeEvents);
      },
      (error) => {
        console.error('Error fetching events:', error);
      }
    );

    return () => unsubscribe();
  }, [dormId, currentUser, router]);

  async function handleJoinEvent(eventId: string) {
    if (!currentUser || !userData) return;

    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const event = eventDoc.data() as Event;
        
        if (event.participants.includes(currentUser.uid)) {
          // Leave event
          await updateDoc(eventRef, {
            participants: arrayRemove(currentUser.uid)
          });
        } else {
          // Check if event is residents-only and user is not a resident
          if (event.residentsOnly && userData.dorm !== event.dormId) {
            alert(`This event is only for ${event.dormId} residents. You are a ${userData.dorm} resident and cannot join this event.`);
            return;
          }
          
          // Check if event is full
          if (event.participants.length >= event.maxParticipants) {
            alert('Event is full');
            return;
          }
          
          // Show cross-dorm visitor notice if user is from different dorm
          if (!event.residentsOnly && userData.dorm !== event.dormId) {
            const confirmMessage = `You are a ${userData.dorm} resident joining an event in ${event.dormId}.\n\n` +
              `As a visitor, you must:\n` +
              `• Be accompanied by a ${event.dormId} resident (the host)\n` +
              `• Obey ${event.dormId}'s rules (quiet hours, no alcohol in common areas if forbidden)\n` +
              `• Present ID at reception if requested\n\n` +
              `Do you understand and agree to follow these rules?`;
            
            if (!confirm(confirmMessage)) {
              return;
            }
          }
          
          // Join event
          await updateDoc(eventRef, {
            participants: arrayUnion(currentUser.uid)
          });
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join/leave event. Please try again.');
    }
  }

  async function handleDeleteEvent(eventId: string, eventTitle: string) {
    if (!currentUser) return;

    const event = events.find(e => e.id === eventId);
    if (!event || event.hostId !== currentUser.uid) {
      alert('Only the event host can delete this event');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

  const isParticipating = (event: Event) => {
    return currentUser && event.participants.includes(currentUser.uid);
  };

  const canJoinEvent = (event: Event) => {
    if (!currentUser || !userData) return false;
    // If event is residents-only, user must be from the same dorm
    if (event.residentsOnly && userData.dorm !== event.dormId) {
      return false;
    }
    return true;
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <Link 
          href="/home" 
          style={{ 
            color: '#0070f3',
            fontSize: '1.5rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            minWidth: '32px'
          }}
        >
          <i className="bi bi-arrow-left-circle-fill"></i>
        </Link>
        <Link 
          href={`/events/create?dorm=${dormId}`}
          className="btn btn-primary"
        >
          Create Event
        </Link>
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>{dormId} Events</h1>

      {events.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No events yet. Be the first to create one!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map(event => (
            <div key={event.id} className="card">
              {event.imageURL && (
                <img 
                  src={event.imageURL} 
                  alt={event.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}
                />
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ marginBottom: '0.5rem' }}>{event.title}</h2>
                  <div style={{ color: '#666', marginBottom: '0.5rem' }}>
                    <div><strong>Host:</strong> {event.hostName}</div>
                    {!event.isHostResident && (
                      <div style={{ 
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#856404'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          ⚠ Cross-Dorm Event
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                          Host is from <strong>{event.hostName}</strong> (not a {dormId} resident). 
                          Visitors must be accompanied by a {dormId} resident and follow dorm rules.
                        </div>
                      </div>
                    )}
                    <div><strong>Date:</strong> {format(new Date(event.date), 'MMM dd, yyyy')}</div>
                    <div><strong>Time:</strong> {event.time}</div>
                    <div>
                      <strong>Participants:</strong> {event.participants.length} / {event.maxParticipants}
                    </div>
                    {event.residentsOnly && (
                      <div style={{ color: '#0070f3' }}>Residents only</div>
                    )}
                  </div>
                  <p style={{ marginTop: '0.5rem' }}>{event.description}</p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                marginTop: '1rem',
                flexWrap: 'wrap'
              }}>
                {!canJoinEvent(event) && event.residentsOnly ? (
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
                    onClick={() => handleJoinEvent(event.id)}
                    className={isParticipating(event) ? 'btn btn-secondary' : 'btn btn-primary'}
                  >
                    {isParticipating(event) ? 'Leave Event' : 'Join Event'}
                  </button>
                )}
                <Link 
                  href={`/event/${event.id}`}
                  className="btn btn-secondary"
                >
                  View Details
                </Link>
                {currentUser && event.hostId === currentUser.uid && (
                  <button
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                    className="btn btn-secondary"
                    style={{ background: '#dc3545', color: 'white' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


