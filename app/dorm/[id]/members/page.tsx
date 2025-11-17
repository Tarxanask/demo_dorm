'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, User } from '@/firebase/types';
import Link from 'next/link';

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const dormId = decodeURIComponent(params.id as string) as DormType;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
      return;
    }

    async function fetchMembers() {
      if (!dormId) return;
      try {
        const q = query(collection(db, 'users'), where('dorm', '==', dormId));
        const snapshot = await getDocs(q);
        const membersList = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as User));
        setMembers(membersList);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    }

    if (dormId && !authLoading) {
      fetchMembers();
    }
  }, [dormId, currentUser, authLoading, router]);

  if (authLoading) {
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

  if (!dormId) {
    return <div>Dorm not found</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Link 
        href={`/dorm/${encodeURIComponent(dormId)}`} 
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
        <h1 style={{ marginBottom: '1.5rem' }}>All Members ({members.length})</h1>

        {members.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No members found</p>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', 
            gap: '1rem' 
          }}>
            {members.map(member => (
              <Link
                key={member.uid}
                href={`/profile/${member.uid}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '1rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  {member.photoURL ? (
                    <img 
                      src={member.photoURL} 
                      alt={member.displayName}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        margin: '0 auto 0.5rem',
                        border: '2px solid #e0e0e0'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: '#ccc',
                      margin: '0 auto 0.5rem'
                    }} />
                  )}
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#333' }}>
                    {member.displayName}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    {member.faculty}
                  </div>
                  {member.hobbies && member.hobbies.length > 0 && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#888',
                      marginBottom: '0.5rem'
                    }}>
                      {member.hobbies.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

