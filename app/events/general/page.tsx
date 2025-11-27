'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Event } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';
import BackButton from '@/components/BackButton';

export default function GeneralEventsPage() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Query events for General Community
    const q = query(
      collection(db, 'events'),
      where('dormId', '==', 'General Community')
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
        
        // Filter out past events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeEvents = eventsList.filter(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        
        // Sort by date
        activeEvents.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          return a.time.localeCompare(b.time);
        });
        
        setEvents(activeEvents);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching general events:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, router]);

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
          // Check if event is full
          if (event.participants.length >= event.maxParticipants) {
            alert('Event is full');
            return;
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

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <BackButton href="/home" />
        
        <Link 
          href="/events/create?dorm=General%20Community&type=general"
          className="btn btn-primary"
        >
          Create Event
        </Link>
      </div>

      <h1 style={{ marginBottom: '0.5rem' }}> General Community Events</h1>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Open events for everyone in Kaunas - students, professionals, and anyone looking to connect!
      </p>

      {events.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>No events yet</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Be the first to create a general event for the Kaunas community!
            </p>
            <Link 
              href="/events/create?dorm=General%20Community&type=general"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Create First Event
            </Link>
          </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>{event.title}</h2>
                    <span style={{
                      background: '#06b6d4',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      GENERAL
                    </span>
                  </div>
                  
                  <div style={{ color: '#666', marginBottom: '0.5rem' }}>
                    <div><strong>Host:</strong> {event.hostName}</div>
                    <div><strong>Date:</strong> {format(new Date(event.date), 'MMM dd, yyyy')}</div>
                    <div><strong>Time:</strong> {event.time}</div>
                    <div>
                      <strong>Participants:</strong> {event.participants.length} / {event.maxParticipants}
                    </div>
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
                <button
                  onClick={() => handleJoinEvent(event.id)}
                  className={isParticipating(event) ? 'btn btn-secondary' : 'btn btn-primary'}
                >
                  {isParticipating(event) ? 'Leave Event' : 'Join Event'}
                </button>
                
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