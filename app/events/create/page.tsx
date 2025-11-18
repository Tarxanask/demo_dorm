'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { DormType } from '@/firebase/types';
import { notifyDormUsers } from '@/utils/notifications';
import { EVENT_IMAGES } from '../eventImages';

const DORMS: { id: DormType; name: string }[] = [
  { id: 'KTU', name: 'KTU' },
  { id: 'LSMU', name: 'LSMU' },
  { id: 'Solo Society', name: 'Solo Society' },
  { id: 'Baltija VDU', name: 'Baltija VDU' },
  { id: 'Other Dorms', name: 'Other Dorms' }
];

function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [dormId, setDormId] = useState<DormType | ''>('');
  
  // Get dorm from URL params
  useEffect(() => {
    const dorm = searchParams.get('dorm');
    if (dorm) {
      setDormId(dorm as DormType);
    }
  }, [searchParams]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [desiredParticipants, setDesiredParticipants] = useState(5);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [residentsOnly, setResidentsOnly] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title || !description || !date || !time || !dormId) {
      setError('Please fill in all required fields');
      return;
    }

    if (!currentUser || !userData) {
      setError('Not authenticated');
      return;
    }

    if (desiredParticipants > maxParticipants) {
      setError('Desired participants cannot exceed max participants');
      return;
    }

    setLoading(true);

    try {
      const isHostResident = userData.dorm === dormId;
      let imageURL = '';

      // Handle image upload
      if (customImage) {
        // Upload custom image to Firebase Storage
        const imageRef = ref(storage, `events/${currentUser.uid}_${Date.now()}_${customImage.name}`);
        await uploadBytes(imageRef, customImage);
        imageURL = await getDownloadURL(imageRef);
      } else if (selectedImage) {
        // Use pre-selected image
        imageURL = selectedImage;
      }

      // Build event data object, only include imageURL if it has a value
      const eventData: Record<string, unknown> = {
        dormId,
        hostId: currentUser.uid,
        hostName: userData.displayName,
        hostPhoto: userData.photoURL || '',
        isHostResident,
        title,
        description,
        date,
        time,
        desiredParticipants,
        maxParticipants,
        residentsOnly,
        participants: [],
        createdAt: new Date()
      };

      // Only add imageURL if it has a value (Firestore doesn't accept undefined)
      if (imageURL) {
        eventData.imageURL = imageURL;
      }

      await addDoc(collection(db, 'events'), eventData);

      // Send notification to dorm users
      try {
        await notifyDormUsers(
          dormId,
          'New Event Created!',
          `${userData.displayName} created "${title}" in ${dormId}`,
          { type: 'event', eventId: '', dormId, url: `/events/${dormId}` }
        );
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      router.push(`/events/${dormId}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create event. Please try again.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload images. Please check your account settings.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are logged in and have the necessary permissions.';
      } else if (error.message) {
        // Check for common Firebase error patterns
        if (error.message.includes('invalid data') || error.message.includes('Unsupported field value')) {
          errorMessage = 'There was an issue with the event data. Please check all fields and try again.';
        } else if (error.message.includes('network') || error.message.includes('offline')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !userData) {
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
    <div className="container" style={{ maxWidth: '600px', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Link 
        href="/home" 
        style={{ 
          color: '#0070f3',
          fontSize: '1.5rem',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          marginBottom: '1rem',
          flexShrink: 0,
          minWidth: '32px'
        }}
      >
        <i className="bi bi-arrow-left-circle-fill"></i>
      </Link>

      <div className="card">
        <h1 style={{ marginBottom: '1.5rem' }}>Create Event</h1>

        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Dorm *</label>
            <select
              value={dormId}
              onChange={(e) => setDormId(e.target.value as DormType)}
              required
            >
              <option value="">Select dorm</option>
              {DORMS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {dormId && userData.dorm !== dormId && (
              <div style={{ 
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  ⚠ Cross-Dorm Event Notice
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  You are creating an event in <strong>{dormId}</strong>, but you are a resident of <strong>{userData.dorm}</strong>.
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Important:</strong> As a visitor, you must:
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', paddingLeft: '0' }}>
                    <li>Be accompanied by a {dormId} resident (the host)</li>
                    <li>Obey {dormId}&apos;s rules (quiet hours, no alcohol in common areas if forbidden)</li>
                    <li>Present ID at reception if requested</li>
                  </ul>
                </div>
              </div>
            )}
            {(dormId === 'LSMU' || dormId === 'KTU' || dormId === 'Other Dorms') && (
              <div style={{ 
                background: '#e6f2ff',
                border: '1px solid #0070f3',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                color: '#004085'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  📍 Address Reminder
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Please remember to include the <strong>full address of the dormitory</strong> in your event description, as {dormId} has multiple locations.
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
            />
          </div>

          <div className="input-group">
            <label>Event Image</label>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Choose from pre-selected images:</strong>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  {EVENT_IMAGES.map(img => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setSelectedImage(img.url);
                        setCustomImage(null);
                        setImagePreview(img.url);
                      }}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        border: selectedImage === img.url ? '3px solid #0070f3' : '2px solid #e0e0e0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <img 
                        src={img.url} 
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {selectedImage === img.url && (
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#0070f3',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ 
                marginTop: '1rem', 
                paddingTop: '1rem', 
                borderTop: '1px solid #e0e0e0' 
              }}>
                <strong>Or upload your own image:</strong>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setSelectedImage('');
                    }}
                  >
                    {customImage ? 'Change Image' : 'Upload Image'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCustomImage(file);
                        setSelectedImage('');
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  {customImage && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setCustomImage(null);
                        setImagePreview('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="input-group">
              <label>Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Desired Participants</label>
              <input
                type="number"
                value={desiredParticipants}
                onChange={(e) => setDesiredParticipants(parseInt(e.target.value) || 0)}
                min="1"
                required
              />
            </div>

            <div className="input-group">
              <label>Max Participants</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="checkbox"
                checked={residentsOnly}
                onChange={(e) => setResidentsOnly(e.target.checked)}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  cursor: 'pointer',
                  accentColor: '#667eea'
                }}
              />
              <span style={{ fontWeight: '500', color: '#1f2937' }}>
                🔒 Residents only
              </span>
            </label>
            {residentsOnly && (
              <div style={{ 
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: '#e6f2ff',
                border: '1px solid #667eea',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#004085'
              }}>
                This event will only be visible and joinable by residents of the selected dorm.
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating event...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
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
    }>
      <CreateEventContent />
    </Suspense>
  );
}

