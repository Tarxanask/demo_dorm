'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DormType, User } from '@/firebase/types';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

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
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '60px', animation: 'float 2s ease-in-out infinite' }}>👥</div>
        <div style={{ 
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          fontSize: '1.1rem'
        }}>
          Loading members...
        </div>
      </div>
    );
  }

  if (!dormId) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
        color: '#ffffff',
        fontSize: '1.1rem'
      }}>
        Dorm not found
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #303030 0%, #1a1a1a 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <BackButton href={`/dorm/${encodeURIComponent(dormId)}`} />

        <div className="card" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          color: '#ffffff'
        }}>
        <h1 style={{ 
          marginBottom: '2rem',
          fontSize: '2.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center'
        }}>
          👥 All Members ({members.length})
        </h1>

        {members.length === 0 ? (
          <p style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.6)', 
            padding: '3rem',
            fontSize: '1.1rem'
          }}>
            No members found
          </p>
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
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(14, 165, 233, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
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
                      background: 'rgba(255, 255, 255, 0.2)',
                      margin: '0 auto 0.5rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }} />
                  )}
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>
                    {member.displayName}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    {member.faculty}
                  </div>
                  {member.hobbies && member.hobbies.length > 0 && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'rgba(255,255,255,0.6)',
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
    </div>
  );
}

