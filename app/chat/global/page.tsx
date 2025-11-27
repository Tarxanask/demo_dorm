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
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link 
            href="/home" 
            style={{ 
              color: '#667eea',
              fontSize: '1.5rem',
              textDecoration: 'none'
            }}
          >
            ←
          </Link>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Global Chat</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
              Chat with everyone from all dorms
            </p>
          </div>
        </div>
      </div>

      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666'
          }}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            if (message.deleted) return null;
            
            const user = userCache[message.userId];
            const isOwnMessage = message.userId === currentUser?.uid;
            
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isOwnMessage ? '#e6f2ff' : 'white',
                  marginLeft: isOwnMessage ? 'auto' : '0',
                  marginRight: isOwnMessage ? '0' : 'auto',
                  maxWidth: '70%',
                  position: 'relative'
                }}
                onMouseEnter={() => setActiveMessageId(message.id)}
                onMouseLeave={() => setActiveMessageId(null)}
              >
                {!isOwnMessage && (
                  <Link href={`/profile/${message.userId}`} style={{ textDecoration: 'none' }}>
                    {message.userPhoto ? (
                      <img 
                        src={message.userPhoto} 
                        alt={message.userName}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer'
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
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {!isOwnMessage && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <Link 
                        href={`/profile/${message.userId}`}
                        style={{ 
                          fontWeight: 600, 
                          color: '#333',
                          textDecoration: 'none'
                        }}
                      >
                        {message.userName}
                      </Link>
                      {user?.dorm && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          background: '#f0f0f0',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {user.dorm}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {message.replyTo && (
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.05)',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#666',
                      borderLeft: '3px solid #667eea'
                    }}>
                      Replying to: {message.replyToMessage}
                    </div>
                  )}
                  
                  <p style={{ margin: 0, wordBreak: 'break-word' }}>
                    {editingMessageId === message.id ? (
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(message.id, message.message);
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
                  </p>
                  
                  {message.edited && (
                    <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                      (edited)
                    </span>
                  )}
                  
                  {isOwnMessage && (
                    <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                  )}
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
          background: 'white',
          padding: '1rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '0.75rem'
        }}
      >
        {replyTo && (
          <div style={{
            padding: '0.5rem',
            background: '#e6f2ff',
            borderRadius: '4px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>Replying to: {replyToMessage}</span>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setReplyToMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer'
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
            padding: '0.75rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!newMessage.trim()}
        >
          {editingMessageId ? 'Save' : 'Send'}
        </button>
        {editingMessageId && (
          <button
            type="button"
            onClick={() => {
              setEditingMessageId(null);
              setNewMessage('');
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

