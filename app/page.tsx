'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/auth/login');
      } else if (!userData || !userData.dorm) {
        router.push('/profile/create');
      } else {
        router.push('/home');
      }
    }
  }, [currentUser, userData, loading, router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      gap: '1rem'
    }}>
      <img 
        src="/images/logo.png" 
        alt="Dormzy" 
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '12px',
          objectFit: 'cover'
        }}
      />
      <div style={{ fontSize: '1.1rem', color: '#666' }}>Loading...</div>
    </div>
  );
}

