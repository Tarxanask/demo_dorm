'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from '@/firebase/types';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileId = params.id as string;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
      return;
    }

    async function fetchProfile() {
      try {
        const userDoc = await getDoc(doc(db, 'users', profileId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as User);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profileId && !authLoading) {
      fetchProfile();
    }
  }, [profileId, currentUser, authLoading, router]);

  if (authLoading || loading) {
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

  if (!profile) {
    return <div>Profile not found</div>;
  }

  const isOwnProfile = userData?.uid === profile.uid;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
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
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div>
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.displayName}
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: '#ccc'
              }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.5rem' }}>{profile.displayName}</h1>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
              <div><strong>Dorm:</strong> {profile.dorm}</div>
              <div><strong>Faculty:</strong> {profile.faculty}</div>
            </div>

            {profile.hobbies && profile.hobbies.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Hobbies:</strong>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {profile.hobbies.map(hobby => (
                    <span 
                      key={hobby}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#e6f2ff',
                        color: '#0070f3',
                        borderRadius: '20px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <Link 
                href={`/chat/direct/${profile.uid}`}
                className="btn btn-primary"
              >
                Start Chat
              </Link>
            )}

            {isOwnProfile && (
              <Link 
                href="/profile/edit"
                className="btn btn-secondary"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

