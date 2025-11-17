'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import Link from 'next/link';

const COMMON_HOBBIES = [
  'Sports', 'Music', 'Reading', 'Gaming', 'Cooking', 'Traveling',
  'Photography', 'Art', 'Dancing', 'Movies', 'Technology', 'Fitness'
];

function EditProfileContent() {
  const { currentUser, userData, updateUserData } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setName(userData.displayName || '');
      setFaculty(userData.faculty || '');
      setHobbies(userData.hobbies || []);
      setPhotoPreview(userData.photoURL || '');
    }
  }, [userData]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function toggleHobby(hobby: string) {
    setHobbies(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !faculty) {
      setError('Please fill in all required fields');
      return;
    }

    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);

    try {
      let photoURL = userData?.photoURL || '';

      if (photo) {
        const photoRef = ref(storage, `profiles/${currentUser.uid}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      // Build update data, only include photoURL if it has a value
      const updateData: Record<string, unknown> = {
        displayName: name,
        faculty,
        hobbies
      };

      // Only add photoURL if it has a value (Firestore doesn't accept undefined)
      if (photoURL) {
        updateData.photoURL = photoURL;
      }

      await updateUserData(updateData);

      router.push('/profile');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Provide user-friendly error messages
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload images. Please check your account settings.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are logged in and have the necessary permissions.';
      } else if (error.message) {
        if (error.message.includes('invalid data') || error.message.includes('Unsupported field value')) {
          errorMessage = 'There was an issue with the profile data. Please check all fields and try again.';
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

  if (!userData) {
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
        href="/profile" 
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
        <h1 style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>

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
            <label>Profile Picture</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {photoPreview && (
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    objectFit: 'cover' 
                  }} 
                />
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Dorm</label>
            <input
              type="text"
              value={userData.dorm}
              disabled
              style={{ background: '#f5f5f5' }}
            />
            <small style={{ color: '#666' }}>Dorm cannot be changed</small>
          </div>

          <div className="input-group">
            <label>Faculty *</label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Hobbies</label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem' 
            }}>
              {COMMON_HOBBIES.map(hobby => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => toggleHobby(hobby)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: hobbies.includes(hobby) ? '2px solid #0070f3' : '2px solid #e0e0e0',
                    background: hobbies.includes(hobby) ? '#e6f2ff' : 'white',
                    color: hobbies.includes(hobby) ? '#0070f3' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Updating profile...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <AuthProvider>
      <EditProfileContent />
    </AuthProvider>
  );
}

