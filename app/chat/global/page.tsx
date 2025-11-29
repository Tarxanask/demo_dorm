'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query,
  where,
  onSnapshot, 
  addDoc,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ChatMessage, User } from '@/firebase/types';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';
import { notifyAllUsers } from '@/utils/notifications';
import BackButton from '@/components/BackButton';
import AnimatedSendButton from '@/components/AnimatedSendButton';

export default function GlobalChatPage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userCacheRef = useRef<Record<string, User>>({});

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Query messages from global chat (dormId = 'Global')
    const q = query(
      collection(db, 'chatMessages'),
      where('dormId', '==', 'Global')
    );

    const unsubscribe = onSnapshot(
      q, 
      async (snapshot) => {
        const messagesList: ChatMessage[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const userId = data.userId;
          
          // Cache user data
          if (!userCacheRef.current[userId]) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              userCacheRef.current[userId] = userData;
              setUserCache({ ...userCacheRef.current });
            }
          }

          messagesList.push({
            id: docSnap.id,
            dormId: data.dormId,
            userId: data.userId,
            userName: data.userName,
            userPhoto: data.userPhoto || '',
            message: data.message,
            replyTo: data.replyTo,
            replyToMessage: data.replyToMessage,
            timestamp: data.timestamp?.toDate() || new Date(),
            edited: data.edited || false,
            editedAt: data.editedAt?.toDate(),
            deleted: data.deleted || false
          } as ChatMessage);
        }

        // Sort by timestamp client-side
        messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(messagesList);
      },
      (error: unknown) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userData) return;

    try {
      // If editing, update the message instead of creating new one
      if (editingMessageId) {
        await updateDoc(doc(db, 'chatMessages', editingMessageId), {
          message: newMessage.trim(),
          edited: true,
          editedAt: new Date()
        });
        setEditingMessageId(null);
      } else {
        await addDoc(collection(db, 'chatMessages'), {
          dormId: 'Global',
          userId: currentUser.uid,
          userName: userData.displayName,
          userPhoto: userData.photoURL || '',
          message: newMessage.trim(),
          replyTo: replyTo || null,
          replyToMessage: replyTo ? replyToMessage : null,
          timestamp: new Date(),
          edited: false,
          deleted: false
        });

        // Send notification to all users
        try {
          await notifyAllUsers(
            'New message in Global Chat',
            `${userData.displayName}: ${newMessage.trim().substring(0, 50)}${newMessage.trim().length > 50 ? '...' : ''}`,
            { type: 'message', url: '/chat/global' }
          );
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      setNewMessage('');
      setReplyTo(null);
      setReplyToMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await updateDoc(doc(db, 'chatMessages', messageId), {
        deleted: true,
        message: '[Message deleted]'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  }

  function formatTimestamp(date: Date): string {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  }

  if (loading) {
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
          Loading global chat...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(48, 48, 48, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem', 
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <BackButton href="/home" />
        
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img 
            src="/images_dorms/GE.png" 
            alt="Global Community" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px'
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.2rem', 
            fontWeight: '700', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🌍 Global Chat
          </h2>
          <p style={{ 
            margin: 0, 
            fontSize: '0.85rem', 
            color: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: '#22c55e' }}>●</span>
            Connect with the entire Kaunas community
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          background: 'transparent'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '4rem', opacity: 0.5 }}>🌍</div>
            <div>
              <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No messages yet</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Start the global conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            if (message.deleted) return null;
            
            const isOwnMessage = message.userId === currentUser?.uid;
            
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  marginBottom: '0.5rem',
                  position: 'relative'
                }}
                onMouseEnter={() => setActiveMessageId(message.id)}
                onMouseLeave={() => setActiveMessageId(null)}
              >
                {!isOwnMessage && (
                  <Link href={`/profile/${message.userId}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    {message.userPhoto ? (
                      <img 
                        src={message.userPhoto} 
                        alt={message.userName}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#667eea',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}>
                        {message.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                )}
                
                <div style={{
                  background: isOwnMessage 
                    ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: isOwnMessage ? 'white' : '#ffffff',
                  padding: '1rem 1.25rem',
                  borderRadius: isOwnMessage ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                  boxShadow: isOwnMessage 
                    ? '0 8px 25px rgba(14, 165, 233, 0.3)'
                    : '0 8px 25px rgba(0, 0, 0, 0.2)',
                  flex: 1,
                  position: 'relative',
                  border: isOwnMessage ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  {!isOwnMessage && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <Link 
                        href={`/profile/${message.userId}`}
                        style={{ 
                          fontWeight: 600, 
                          color: 'inherit',
                          textDecoration: 'none',
                          marginBottom: '0.25rem',
                          fontSize: '0.9rem',
                          display: 'inline-block'
                        }}
                      >
                        {message.userName}
                      </Link>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', opacity: 0.7 }}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {message.replyTo && (
                    <div style={{
                      padding: '0.5rem',
                      background: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      fontSize: '0.85rem',
                      borderLeft: `3px solid ${isOwnMessage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                    }}>
                      Replying to: {message.replyToMessage}
                    </div>
                  )}
                  
                  <div style={{ 
                    fontStyle: message.deleted ? 'italic' : 'normal',
                    opacity: message.deleted ? 0.7 : 1
                  }}>
                    {editingMessageId === message.id ? (
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendMessage(e);
                          } else if (e.key === 'Escape') {
                            setEditingMessageId(null);
                            setNewMessage('');
                          }
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #667eea',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      message.message
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    fontSize: '0.75rem', 
                    opacity: 0.7,
                    flexWrap: 'wrap'
                  }}>
                    {isOwnMessage && (
                      <span>{formatTimestamp(message.timestamp)}</span>
                    )}
                    {message.edited && (
                      <span style={{ fontSize: '0.7rem' }}>(edited)</span>
                    )}
                  </div>
                </div>
                
                {isOwnMessage && activeMessageId === message.id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingMessageId !== message.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setNewMessage(message.message);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSendMessage}
        style={{
          background: 'rgba(48, 48, 48, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexShrink: 0,
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        {editingMessageId && (
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: 0,
            right: 0,
            background: 'rgba(251, 191, 36, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fbbf24',
            borderTop: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <span>✏️ Editing message</span>
            <button
              type="button"
              onClick={() => {
                setEditingMessageId(null);
                setNewMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fbbf24',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ×
            </button>
          </div>
        )}
        {replyTo && (
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: 0,
            right: 0,
            background: 'rgba(14, 165, 233, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#0ea5e9',
            borderTop: '1px solid rgba(14, 165, 233, 0.3)'
          }}>
            <span>💬 Replying to: {replyToMessage}</span>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setReplyToMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0ea5e9',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ×
            </button>
          </div>
        )}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
          style={{
            flex: 1,
            padding: '1rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '25px',
            fontSize: '16px',
            minHeight: '50px',
            WebkitAppearance: 'none',
            appearance: 'none',
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0ea5e9';
            e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <AnimatedSendButton 
          onClick={(e) => {
            e?.preventDefault();
            const form = e?.currentTarget?.closest('form');
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);
            }
          }} 
          disabled={!newMessage.trim()}
        />
        {editingMessageId && (
          <button
            type="button"
            onClick={() => {
              setEditingMessageId(null);
              setNewMessage('');
            }}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '25px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '50px'
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

