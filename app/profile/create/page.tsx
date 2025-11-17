'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { DormType } from '@/firebase/types';

const DORMS: { id: DormType; name: string }[] = [
  { id: 'KTU', name: 'KTU' },
  { id: 'LSMU', name: 'LSMU' },
  { id: 'Solo Society', name: 'Solo Society' },
  { id: 'Baltija VDU', name: 'Baltija VDU' },
  { id: 'Other Dorms', name: 'Other Dorms' }
];

const COMMON_HOBBIES = [
  'Sports', 'Music', 'Reading', 'Gaming', 'Cooking', 'Traveling',
  'Photography', 'Art', 'Dancing', 'Movies', 'Technology', 'Fitness'
];

function CreateProfileContent() {
  const [name, setName] = useState('');
  const [dorm, setDorm] = useState<DormType | ''>('');
  const [faculty, setFaculty] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, userData, updateUserData, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if profile already exists
  useEffect(() => {
    if (!authLoading && currentUser && userData && userData.dorm) {
      router.push('/home');
    }
  }, [currentUser, userData, authLoading, router]);

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

    if (!name || !dorm || !faculty) {
      setError('Please fill in all required fields');
      return;
    }

    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);

    try {
      let photoURL = '';

      if (photo) {
        const photoRef = ref(storage, `profiles/${currentUser.uid}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      // Check if user document exists to preserve createdAt
      const userRef = doc(db, 'users', currentUser.uid);
      const existingDoc = await getDoc(userRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : null;

      // Build user data object, preserve existing createdAt if it exists
      const userDataUpdate: Record<string, unknown> = {
        displayName: name,
        dorm: dorm as DormType,
        faculty,
        hobbies,
        uid: currentUser.uid,
        email: currentUser.email
      };

      // Preserve createdAt if it already exists
      if (existingData?.createdAt) {
        userDataUpdate.createdAt = existingData.createdAt;
      } else {
        userDataUpdate.createdAt = new Date();
      }

      // Only add photoURL if it has a value (Firestore doesn't accept undefined)
      if (photoURL) {
        userDataUpdate.photoURL = photoURL;
      } else if (existingData?.photoURL) {
        // Preserve existing photoURL if no new photo is uploaded
        userDataUpdate.photoURL = existingData.photoURL;
      }

      await setDoc(userRef, userDataUpdate, { merge: true });

      // Update the auth context with the new user data
      await updateUserData({
        displayName: name,
        dorm: dorm as DormType,
        faculty,
        hobbies,
        ...(photoURL && { photoURL })
      });
      
      // Redirect to home
      router.push('/home');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create profile. Please try again.';
      
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

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          You&apos;re a dorm user, congrats! 🎉
        </h1>
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#666' }}>
          Choose your dorm and create your profile
        </p>

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
                Choose Photo
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
            <label>Dorm *</label>
            <select
              value={dorm}
              onChange={(e) => setDorm(e.target.value as DormType)}
              required
            >
              <option value="">Select your dorm</option>
              {DORMS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Faculty *</label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="e.g., Computer Science"
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
            {loading ? 'Creating profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateProfilePage() {
  return <CreateProfileContent />;
}

