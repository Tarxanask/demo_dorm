'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function ProfilePage() {
  const { userData } = useAuth();

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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <BackButton href="/home" />

      <div className="card">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div>
            {userData.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt={userData.displayName}
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
            <h1 style={{ marginBottom: '0.5rem' }}>{userData.displayName}</h1>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
              <div><strong>Email:</strong> {userData.email}</div>
              <div><strong>Dorm:</strong> {userData.dorm}</div>
              <div><strong>Faculty:</strong> {userData.faculty}</div>
            </div>

            {userData.hobbies && userData.hobbies.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Hobbies:</strong>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {userData.hobbies.map(hobby => (
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

            <Link 
              href="/profile/edit"
              className="btn btn-primary"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

