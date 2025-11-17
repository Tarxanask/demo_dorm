'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from '@/firebase/types';
import Link from 'next/link';
import { format } from 'date-fns';

interface DirectMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: Date;
  fromUserName: string;
  fromUserPhoto?: string;
}

export default function DirectChatPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = params.userId as string;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
      return;
    }

    if (authLoading) {
      return;
    }

    if (!currentUser) {
      return;
    }

    if (userId === currentUser.uid) {
      router.push('/home');
      return;
    }

    // Fetch other user
    async function fetchOtherUser() {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setOtherUser({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as User);
      }
    }

    fetchOtherUser();

    // Set up real-time messages
    // Query messages where either user is the sender, then filter client-side
    // Sort client-side to avoid needing Firestore composite index
    if (!currentUser) return;

    const currentUserId = currentUser.uid;
    const q = query(
      collection(db, 'directMessages'),
      where('fromUserId', 'in', [currentUserId, userId])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as DirectMessage))
        .filter(msg => 
          (msg.fromUserId === currentUserId && msg.toUserId === userId) ||
          (msg.fromUserId === userId && msg.toUserId === currentUserId)
        )
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(messagesList);
    }, (error) => {
      console.error('Error fetching direct messages:', error);
    });

    return () => unsubscribe();
  }, [userId, currentUser, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userData) return;

    try {
      await addDoc(collection(db, 'directMessages'), {
        fromUserId: currentUser.uid,
        toUserId: userId,
        message: newMessage.trim(),
        fromUserName: userData.displayName,
        fromUserPhoto: userData.photoURL || '',
        timestamp: new Date()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  if (authLoading || !otherUser) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f5f5f5'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '1rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <Link 
          href="/home" 
          style={{ 
            color: '#0070f3',
            fontSize: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            minWidth: '32px'
          }}
        >
          <i className="bi bi-arrow-left-circle-fill"></i>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {otherUser.photoURL && (
            <img 
              src={otherUser.photoURL} 
              alt={otherUser.displayName}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: '600' }}>{otherUser.displayName}</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{otherUser.faculty}</div>
          </div>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map(message => {
          const isOwn = message.fromUserId === currentUser?.uid;
          return (
            <div 
              key={message.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                maxWidth: '70%'
              }}
            >
              {!isOwn && (
                <img 
                  src={message.fromUserPhoto || '/default-avatar.png'} 
                  alt={message.fromUserName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <div style={{
                background: isOwn ? '#0070f3' : 'white',
                color: isOwn ? 'white' : '#333',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                flex: 1
              }}>
                <div>{message.message}</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.7,
                  marginTop: '0.25rem'
                }}>
                  {format(message.timestamp, 'HH:mm')}
                </div>
              </div>

              {isOwn && userData?.photoURL && (
                <img 
                  src={userData.photoURL} 
                  alt={userData.displayName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{
        background: 'white',
        padding: '1rem',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid #e0e0e0',
            borderRadius: '20px',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ borderRadius: '20px', padding: '0.75rem 1.5rem' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

