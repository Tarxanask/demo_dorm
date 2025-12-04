'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, addDoc, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Event, User, EventChatMessage } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';
import BackButton from '@/components/BackButton';
import { sendNotification } from '@/utils/notifications';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinAnonymously, setJoinAnonymously] = useState(false);
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formResponses, setFormResponses] = useState<{ [fieldId: string]: string }>({});

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

  // Subscribe to event chat messages - only if user is a participant
  useEffect(() => {
    if (!currentUser || !event || !params.id) return;
    
    // Only show chat if user is a participant
    if (!event.participants.includes(currentUser.uid)) {
      setShowChat(false);
      return;
    }
    
    setShowChat(true);
    
    const messagesQuery = query(
      collection(db, 'eventChatMessages'),
      where('eventId', '==', params.id as string),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as EventChatMessage));
      setMessages(messagesData);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [currentUser, event, params.id]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !userData || !newMessage.trim() || !event) {
      console.log('Missing required data:', { currentUser: !!currentUser, userData: !!userData, message: !!newMessage.trim(), event: !!event });
      return;
    }

    try {
      console.log('Attempting to send message to eventChatMessages collection');
      const messageData = {
        eventId: event.id,
        userId: currentUser.uid,
        userName: userData.displayName || 'Anonymous',
        userPhoto: userData.photoURL || '',
        message: newMessage.trim(),
        timestamp: Timestamp.now()
      };
      console.log('Message data:', messageData);
      
      const docRef = await addDoc(collection(db, 'eventChatMessages'), messageData);
      console.log('Message sent successfully with ID:', docRef.id);
      
      setNewMessage('');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Error sending message:', error);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      alert(`Failed to send message: ${err?.message || 'Unknown error'}. Please try again.`);
    }
  }

  async function handleJoinEvent() {
    if (!currentUser || !event || !userData) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as Event;
        
        if (eventData.participants.includes(currentUser.uid)) {
          // Leave event - remove from both participants and anonymousParticipants
          await updateDoc(eventRef, {
            participants: arrayRemove(currentUser.uid),
            anonymousParticipants: arrayRemove(currentUser.uid)
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
          if (!eventData.residentsOnly && userData.dorm !== eventData.dormId && !eventData.isESNEvent) {
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
          
          // Check if event has custom form fields
          if (eventData.customFormFields && eventData.customFormFields.length > 0) {
            // Show form modal
            setShowFormModal(true);
            return;
          }
          
          // Join event directly if no custom form
          await joinEventDirectly();
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join/leave event. Please try again.');
    }
  }
  
  async function joinEventDirectly() {
    if (!currentUser || !event || !userData) return;
    
    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Join event with optional anonymity
      const updateData: { participants: any; anonymousParticipants?: any; [key: string]: any } = {
        participants: arrayUnion(currentUser.uid)
      };
      
      if (joinAnonymously) {
        updateData.anonymousParticipants = arrayUnion(currentUser.uid);
      }
      
      // Add form responses if they exist
      if (Object.keys(formResponses).length > 0) {
        updateData[`formResponses.${currentUser.uid}`] = formResponses;
      }
      
      await updateDoc(eventRef, updateData);
      
      // Notify ESN admin when user joins their event
      if (event.isESNEvent && event.hostId !== currentUser.uid) {
        await sendNotification(event.hostId, {
          title: 'New Event Participant',
          message: `${userData.displayName} joined your event: ${event.title}`,
          type: 'event',
          url: `/event/${event.id}`
        });
      }
      
      // Refresh event data
      const updatedDoc = await getDoc(eventRef);
      if (updatedDoc.exists()) {
        setEvent({
          id: updatedDoc.id,
          ...updatedDoc.data(),
          createdAt: updatedDoc.data().createdAt?.toDate() || new Date()
        } as Event);
      }
      
      // Reset states
      setJoinAnonymously(false);
      setFormResponses({});
      setShowFormModal(false);
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join event. Please try again.');
    }
  }
  
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate required fields
    if (event?.customFormFields) {
      for (const field of event.customFormFields) {
        if (field.required && !formResponses[field.id]?.trim()) {
          alert(`Please fill in the required field: ${field.label}`);
          return;
        }
      }
    }
    
    // Submit form and join event
    joinEventDirectly();
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
        <BackButton href={event.isESNEvent ? '/esn' : `/events/${encodeURIComponent(event.dormId)}`} />

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
          <h1 style={{ margin: 0, color: '#ffffff' }}>{event.title}</h1>
        </div>
        
        <div style={{ marginBottom: '1rem', color: '#9CA3AF' }}>
          <div><strong>Dorm:</strong> {event.dormId}</div>
          <div><strong>Host:</strong> {event.hostName}</div>
          {event.location && (
            <div><strong>Location:</strong> {event.location}</div>
          )}
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

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          {!isParticipating && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={joinAnonymously}
                onChange={(e) => setJoinAnonymously(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Join anonymously (your name will be hidden from other participants)
            </label>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      </div>

      {/* Form Responses - Only visible to event host */}
      {currentUser && event.hostId === currentUser.uid && event.customFormFields && event.customFormFields.length > 0 && (
        <div className="card" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#ffffff', marginBottom: '1.5rem' }}>
            📋 Registration Form Responses
          </h2>
          
          {event.formResponses && Object.keys(event.formResponses).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(event.formResponses).map(([userId, responses]) => {
                const participant = participants.find(p => p.uid === userId);
                return (
                  <div key={userId} style={{
                    padding: '1.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {participant?.photoURL ? (
                        <img 
                          src={participant.photoURL}
                          alt={participant.displayName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}>
                          👤
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>
                          {participant?.displayName || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {participant?.email || ''}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {event.customFormFields?.map(field => (
                        <div key={field.id}>
                          <div style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.7)',
                            marginBottom: '0.25rem',
                            fontWeight: '500'
                          }}>
                            {field.label}
                          </div>
                          <div style={{
                            color: '#ffffff',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}>
                            {responses[field.id] || <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>No response</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              padding: '2rem',
              fontSize: '1rem'
            }}>
              No responses yet. Participants will see the registration form when they join.
            </p>
          )}
        </div>
      )}

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
            {participants.map(participant => {
              const isAnonymous = event.anonymousParticipants?.includes(participant.uid);
              const canSeeIdentity = currentUser && (
                currentUser.uid === event.hostId || // Event creator
                currentUser.uid === participant.uid // The participant themselves
              );
              const shouldShowAnonymous = isAnonymous && !canSeeIdentity;

              if (shouldShowAnonymous) {
                return (
                  <div 
                    key={participant.uid}
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '16px',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(150,150,150,0.3) 0%, rgba(100,100,100,0.2) 100%)',
                      margin: '0 auto 0.75rem',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      🕶️
                    </div>
                    <div style={{ 
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '0.25rem',
                      fontSize: '1rem'
                    }}>Anonymous</div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>Hidden participant</div>
                  </div>
                );
              }

              return (
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
                    }}>
                      {participant.displayName}
                      {isAnonymous && canSeeIdentity && (
                        <span style={{ 
                          fontSize: '0.75rem',
                          marginLeft: '0.5rem',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>🕶️</span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>{participant.faculty}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        </div>

        {/* Event Chat - Only visible to participants */}
        {showChat && (
          <div className="card" style={{ 
            marginTop: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            color: '#ffffff'
          }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 Event Discussion
              <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 'normal' }}>
                (Participants only)
              </span>
            </h2>

            <div style={{ 
              height: '400px', 
              overflowY: 'auto', 
              marginBottom: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  padding: '2rem'
                }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      {msg.userPhoto ? (
                        <img 
                          src={msg.userPhoto} 
                          alt={msg.userName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}>
                          👤
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'baseline', 
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{ fontWeight: '600', color: '#ffffff' }}>
                            {msg.userName}
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'rgba(255, 255, 255, 0.5)' 
                          }}>
                            {format(msg.timestamp, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div style={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  opacity: newMessage.trim() ? 1 : 0.5,
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send
              </button>
            </form>
          </div>
        )}
        
        {/* Custom Form Modal */}
        {showFormModal && event?.customFormFields && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '0.5rem',
            overflowY: 'auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '95vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              margin: 'auto'
            }}>
              <h2 style={{ 
                color: '#ffffff', 
                marginBottom: '0.75rem',
                fontSize: 'clamp(1.25rem, 5vw, 1.5rem)'
              }}>
                Registration Form
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                marginBottom: '1.25rem',
                fontSize: 'clamp(0.875rem, 3vw, 1rem)'
              }}>
                Please fill out the following information to join this event.
              </p>
              
              <form onSubmit={handleFormSubmit}>
                {event.customFormFields.map((field) => (
                  <div key={field.id} style={{ marginBottom: '1.25rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}>
                      {field.label} {field.required && <span style={{ color: '#ff6b6b' }}>*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formResponses[field.id] || ''}
                        onChange={(e) => setFormResponses({
                          ...formResponses,
                          [field.id]: e.target.value
                        })}
                        required={field.required}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    ) : field.type === 'checkbox' ? (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                      }}>
                        <input
                          type="checkbox"
                          checked={formResponses[field.id] === 'true'}
                          onChange={(e) => setFormResponses({
                            ...formResponses,
                            [field.id]: e.target.checked ? 'true' : 'false'
                          })}
                          required={field.required}
                          style={{ 
                            cursor: 'pointer',
                            width: '18px',
                            height: '18px'
                          }}
                        />
                        I agree
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={formResponses[field.id] || ''}
                        onChange={(e) => setFormResponses({
                          ...formResponses,
                          [field.id]: e.target.value
                        })}
                        required={field.required}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                          boxSizing: 'border-box'
                        }}
                      />
                    )}
                  </div>
                ))}
                
                <div className="modal-buttons" style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '1.5rem',
                  flexDirection: 'row'
                }}>
                  <style jsx>{`
                    @media (max-width: 480px) {
                      .modal-buttons {
                        flex-direction: column !important;
                      }
                    }
                  `}</style>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Submit & Join
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormModal(false);
                      setFormResponses({});
                    }}
                    className="btn btn-secondary"
                    style={{ 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

