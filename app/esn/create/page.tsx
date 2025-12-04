'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CustomFormField } from '@/firebase/types';
import BackButton from '@/components/BackButton';
import { sendNotification } from '@/utils/notifications';

export default function CreateESNEventPage() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [desiredParticipants, setDesiredParticipants] = useState(30);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user is ESN admin
  if (!userData?.isESNAdmin) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h1>Access Denied</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Only ESN admins can create ESN events.
          </p>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCustomField = () => {
    const newField: CustomFormField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomFormField>) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      let imageURL = '';
      
      if (image) {
        const imageRef = ref(storage, `esn-events/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageURL = await getDownloadURL(imageRef);
      }

      const eventRef = await addDoc(collection(db, 'events'), {
        dormId: 'General Community', // ESN events are cross-dorm
        hostId: currentUser.uid,
        hostName: userData.displayName,
        hostPhoto: userData.photoURL,
        isHostResident: true,
        title,
        description,
        location: location || undefined,
        date,
        time,
        desiredParticipants,
        maxParticipants,
        residentsOnly: false,
        participants: [],
        anonymousParticipants: [],
        imageURL,
        createdAt: Timestamp.now(),
        isESNEvent: true,
        esnUniversity: userData.esnUniversity,
        customFormFields: customFields.length > 0 ? customFields : undefined,
        formResponses: {}
      });

      // Notify all users about new ESN event
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const notificationPromises = usersSnapshot.docs
        .filter(doc => doc.id !== currentUser.uid) // Don't notify the creator
        .map(doc => 
          sendNotification(doc.id, {
            title: `New ESN ${userData.esnUniversity} Event`,
            message: `${title} - ${new Date(date).toLocaleDateString()}`,
            type: 'event',
            url: `/event/${eventRef.id}`
          })
        );
      
      await Promise.all(notificationPromises);
      console.log(`✅ Sent event notifications to ${notificationPromises.length} users`);

      router.push('/esn');
    } catch (error) {
      console.error('Error creating ESN event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton href="/esn" />

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ 
            color: '#ffffff',
            marginBottom: '0.5rem',
            fontSize: '2rem'
          }}>
            Create ESN {userData.esnUniversity} Event
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem'
          }}>
            Create an event for ESN {userData.esnUniversity} students
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., International Dinner Night"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe your event..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                Location/Address
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., VMU Dorms, Room 101 or Laisvės alėja 12, Kaunas"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500'
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500'
                }}>
                  Time *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500'
                }}>
                  Desired Participants
                </label>
                <input
                  type="number"
                  value={desiredParticipants}
                  onChange={(e) => setDesiredParticipants(parseInt(e.target.value) || 0)}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '500'
                }}>
                  Max Participants *
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                Event Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Preview"
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
              )}
            </div>

            {/* Custom Form Fields */}
            <div style={{ 
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ color: '#ffffff', margin: 0 }}>
                  Custom Registration Fields
                </h3>
                <button
                  type="button"
                  onClick={addCustomField}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  + Add Field
                </button>
              </div>

              {customFields.map((field) => (
                <div key={field.id} style={{ 
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px'
                }}>
                  {/* Field Label */}
                  <input
                    type="text"
                    placeholder="Field Label"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  {/* Field Type */}
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomField(field.id, { type: e.target.value as 'text' | 'textarea' | 'checkbox' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(40, 40, 40, 0.9)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      marginBottom: '0.75rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="text" style={{ background: '#2a2a2a', color: '#ffffff' }}>Text</option>
                    <option value="textarea" style={{ background: '#2a2a2a', color: '#ffffff' }}>Long Text (Textarea)</option>
                    <option value="checkbox" style={{ background: '#2a2a2a', color: '#ffffff' }}>Consent (Checkbox)</option>
                  </select>
                  
                  {/* Required checkbox and Remove button */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <label style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                        style={{
                          cursor: 'pointer',
                          width: '18px',
                          height: '18px'
                        }}
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: '#dc3545',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {customFields.length === 0 && (
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  No custom fields added. Click &quot;Add Field&quot; to create registration questions.
                </p>
              )}
            </div>

            <div style={{ 
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '1rem',
                  fontSize: '1.1rem',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create ESN Event'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
