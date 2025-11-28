'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, ChatMessage, User } from '@/firebase/types';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';
import { notifyDormUsers } from '@/utils/notifications';
import BackButton from '@/components/BackButton';
import AnimatedSendButton from '@/components/AnimatedSendButton';

function ChatPageContent() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [memberCount, setMemberCount] = useState<number>(0);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userCacheRef = useRef<Record<string, User>>({});
  // Decode the dormId from URL (handles URL encoding like %20 for spaces)
  const dormId = decodeURIComponent(params.dormId as string) as DormType;

  // Function to get dorm logo path
  const getDormLogo = (dorm: DormType) => {
    const logoMap: Record<DormType, string> = {
      'LSMU': '/images_dorms/LSMU.png',
      'KTU': '/images_dorms/KTU.png',
      'Other Dorms': '/images_dorms/Baltija VDU.png',
      'Solo Society': '/images_dorms/SoloSociety.png',
      'Baltija VDU': '/images_dorms/Other dorm.png',
      'General Community': '/images_dorms/GE.png',
      'Global': '/images_dorms/GE.png'
    };
    return logoMap[dorm] || '/images_dorms/Other dorm.png';
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Query without orderBy to avoid needing composite index
    // We'll sort client-side instead
    const q = query(
      collection(db, 'chatMessages'),
      where('dormId', '==', dormId)
    );

    const unsubscribe = onSnapshot(
      q, 
      async (snapshot) => {
        const messagesList: ChatMessage[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const userId = data.userId;
          
          // Cache user data using ref to avoid dependency issues
          if (!userCacheRef.current[userId]) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              userCacheRef.current[userId] = userData;
              // Update state only when new users are added
              setUserCache({ ...userCacheRef.current });
            }
          }

          messagesList.push({
            id: docSnap.id,
            dormId: data.dormId as DormType,
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

        // Sort by timestamp client-side (avoids needing Firestore index)
        messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        setMessages(messagesList);
      },
      (error: unknown) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => unsubscribe();
  }, [dormId, currentUser, router]);

  // Fetch member count for the dorm
  useEffect(() => {
    async function fetchMemberCount() {
      try {
        const q = query(collection(db, 'users'), where('dorm', '==', dormId));
        const snapshot = await getDocs(q);
        setMemberCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching member count:', error);
      }
    }

    if (dormId) {
      fetchMemberCount();
    }
  }, [dormId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userData) return;

    try {
      // If editing, update the message instead of creating new one
      if (editingMessageId) {
        const messageRef = doc(db, 'chatMessages', editingMessageId);
        await updateDoc(messageRef, {
          message: newMessage.trim(),
          edited: true,
          editedAt: new Date()
        });
        setEditingMessageId(null);
      } else {
        await addDoc(collection(db, 'chatMessages'), {
          dormId,
          userId: currentUser.uid,
          userName: userData.displayName,
          userPhoto: userData.photoURL || '',
          message: newMessage.trim(),
          replyTo: replyTo || null,
          replyToMessage: replyTo ? replyToMessage : null,
          timestamp: new Date(),
          deleted: false
        });

        // Send notification to dorm users (except sender)
        try {
          await notifyDormUsers(
            dormId,
            `New message in ${dormId}`,
            `${userData.displayName}: ${newMessage.trim().substring(0, 50)}${newMessage.trim().length > 50 ? '...' : ''}`,
            { type: 'message', dormId, url: `/chat/${encodeURIComponent(dormId)}` }
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
    }
  }

  function handleReply(message: ChatMessage) {
    setReplyTo(message.id);
    setReplyToMessage(message.message);
    setEditingMessageId(null);
  }

  function handleEdit(message: ChatMessage) {
    if (message.userId !== currentUser?.uid) return;
    setEditingMessageId(message.id);
    setNewMessage(message.message);
    setReplyTo(null);
    setReplyToMessage('');
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setNewMessage('');
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, {
        deleted: true,
        message: 'This message was deleted'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  }

  const getReplyMessage = (messageId: string) => {
    return messages.find(m => m.id === messageId);
  };

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday ' + format(timestamp, 'HH:mm');
    } else {
      const daysDiff = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return format(timestamp, 'EEE HH:mm');
      } else {
        return format(timestamp, 'MMM dd, HH:mm');
      }
    }
  };

  const shouldShowAvatar = (message: ChatMessage, index: number) => {
    if (message.userId === currentUser?.uid) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime();
    return prevMessage.userId !== message.userId || timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  const shouldShowName = (message: ChatMessage, index: number) => {
    if (message.userId === currentUser?.uid) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.userId !== message.userId;
  };


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
        <div style={{ fontSize: '60px', animation: 'float 2s ease-in-out infinite' }}>💬</div>
        <div style={{ 
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          fontSize: '1.1rem'
        }}>
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
      overflow: 'hidden'
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
        
        <Link
          href={`/dorm/${encodeURIComponent(dormId)}`}
          style={{ textDecoration: 'none', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (window.innerWidth > 768) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <img 
              src={getDormLogo(dormId)} 
              alt={dormId}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '16px'
              }}
            />
          </div>
        </Link>
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
            #{dormId}
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
            {dormId === 'General Community' 
              ? 'Connect with the entire Kaunas community'
              : `${memberCount} ${memberCount === 1 ? 'member' : 'members'} online`
            }
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
            <div style={{ fontSize: '4rem', opacity: 0.5 }}>💬</div>
            <div>
              <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No messages yet</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
          if (message.deleted && message.userId !== currentUser?.uid) {
            return null; // Don't show deleted messages from others
          }

          const showAvatar = shouldShowAvatar(message, index);
          const showName = shouldShowName(message, index);
          const isOwnMessage = message.userId === currentUser?.uid;

          return (
            <div 
              key={message.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                marginBottom: shouldShowAvatar(message, index) ? '0.5rem' : '0.25rem',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  const actions = e.currentTarget.querySelector('.message-actions');
                  if (actions) (actions as HTMLElement).style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 768) {
                  const actions = e.currentTarget.querySelector('.message-actions');
                  if (actions && activeMessageId !== message.id) {
                    (actions as HTMLElement).style.opacity = '0';
                  }
                }
              }}
              onTouchStart={(e) => {
                setActiveMessageId(message.id);
                const actions = e.currentTarget.querySelector('.message-actions');
                if (actions) (actions as HTMLElement).style.opacity = '1';
              }}
              onClick={(e) => {
                const actions = e.currentTarget.querySelector('.message-actions');
                if (window.innerWidth <= 768 && actions && !actions.contains(e.target as Node)) {
                  setTimeout(() => {
                    if (activeMessageId === message.id) {
                      (actions as HTMLElement).style.opacity = '0';
                      setActiveMessageId(null);
                    }
                  }, 2000);
                }
              }}
            >
              {!isOwnMessage && showAvatar && (
                <Link 
                  href={`/profile/${message.userId}`}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={message.userPhoto || userCache[message.userId]?.photoURL || '/default-avatar.png'} 
                    alt={message.userName}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      alignSelf: 'flex-end',
                      cursor: 'pointer',
                      border: '2px solid #e0e0e0',
                      transition: 'transform 0.2s'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                    onMouseEnter={(e) => {
                      if (window.innerWidth > 768) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Link>
              )}
              {!isOwnMessage && !showAvatar && (
                <div style={{ width: '36px', flexShrink: 0 }} />
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
                opacity: message.deleted ? 0.6 : 1,
                border: isOwnMessage ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                {showName && !isOwnMessage && (
                  <Link
                    href={`/profile/${message.userId}`}
                    style={{ 
                      fontWeight: '600', 
                      marginBottom: '0.25rem',
                      fontSize: '0.9rem',
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {message.userName}
                  </Link>
                )}

                {message.replyTo && (
                  <div style={{
                    background: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    borderLeft: `3px solid ${isOwnMessage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                  }}>
                    {getReplyMessage(message.replyTo)?.userName}: {message.replyToMessage}
                  </div>
                )}

                <div style={{ 
                  fontStyle: message.deleted ? 'italic' : 'normal',
                  opacity: message.deleted ? 0.7 : 1
                }}>
                  {message.deleted ? 'This message was deleted' : message.message}
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
                  <span>{formatMessageTime(message.timestamp)}</span>
                  {message.edited && (
                    <span style={{ fontSize: '0.7rem' }}>(edited)</span>
                  )}
                </div>

                {/* Message actions (edit, delete, reply) */}
                <div 
                  className="message-actions"
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: isOwnMessage ? 'auto' : '-8px',
                    left: isOwnMessage ? '-8px' : 'auto',
                    display: 'flex',
                    gap: '0.25rem',
                    opacity: activeMessageId === message.id ? 1 : 0,
                    transition: 'opacity 0.2s',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '0.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 50
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth > 768 && activeMessageId !== message.id) {
                      e.currentTarget.style.opacity = '0';
                    }
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setActiveMessageId(message.id);
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {isOwnMessage ? (
                    <>
                      <button
                        onClick={() => handleEdit(message)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          borderRadius: '8px'
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          color: '#dc3545'
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReply(message)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px'
                      }}
                      title="Reply"
                    >
                      ↪
                    </button>
                  )}
                </div>
              </div>

              {isOwnMessage && showAvatar && (
                <Link 
                  href={`/profile/${currentUser?.uid}`}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={userData?.photoURL || '/default-avatar.png'} 
                    alt={userData?.displayName}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      alignSelf: 'flex-end',
                      cursor: 'pointer',
                      border: '2px solid #0070f3',
                      transition: 'transform 0.2s'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                    onMouseEnter={(e) => {
                      if (window.innerWidth > 768) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Link>
              )}
              {isOwnMessage && !showAvatar && (
                <div style={{ width: '36px', flexShrink: 0 }} />
              )}
            </div>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit Message Banner */}
      {editingMessageId && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.2)',
          backdropFilter: 'blur(10px)',
          padding: '1rem',
          borderTop: '1px solid rgba(251, 191, 36, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fbbf24'
        }}>
          <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✏️</span> Editing message
          </div>
          <button
            onClick={handleCancelEdit}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div style={{
          background: 'rgba(14, 165, 233, 0.2)',
          backdropFilter: 'blur(10px)',
          padding: '1rem',
          borderTop: '1px solid rgba(14, 165, 233, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#0ea5e9'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Replying to:</div>
            <div style={{ fontSize: '0.9rem' }}>{replyToMessage}</div>
          </div>
          <button
            onClick={() => {
              setReplyTo(null);
              setReplyToMessage('');
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{
        background: 'rgba(48, 48, 48, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '1.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexShrink: 0,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
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
      </form>
    </div>
  );
}

export default function ChatPage() {
  return <ChatPageContent />;
}

