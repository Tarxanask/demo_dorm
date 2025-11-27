'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useState } from 'react';

export default function AuthButton() {
  const { currentUser, userData } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!currentUser) {
    return (
      <Link
        href="/auth/login"
        style={{
          padding: '0.5rem 1rem',
          background: '#667eea',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}
      >
        Login
      </Link>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '6px'
        }}
      >
        {userData?.photoURL ? (
          <img
            src={userData.photoURL}
            alt="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#667eea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {userData?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <span style={{ 
          fontSize: '0.875rem', 
          color: '#ffffff',
          display: 'none'
        }}
        className="desktop-only">
          {userData?.displayName || 'User'}
        </span>
        <i className="bi bi-chevron-down" style={{ fontSize: '12px', color: '#cccccc' }}></i>
      </button>

      {showDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#404040',
            border: '1px solid #555555',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            minWidth: '160px',
            zIndex: 1000
          }}>
            <Link
              href="/profile"
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                borderBottom: '1px solid #555555'
              }}
              onClick={() => setShowDropdown(false)}
            >
              <i className="bi bi-person" style={{ marginRight: '0.5rem' }}></i>
              Profile
            </Link>
            <button
              onClick={() => {
                setShowDropdown(false);
                handleSignOut();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem 1rem',
                color: '#ff6b6b',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-box-arrow-right" style={{ marginRight: '0.5rem' }}></i>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}