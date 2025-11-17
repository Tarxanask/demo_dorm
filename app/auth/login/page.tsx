'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { login, loginWithGoogle, currentUser, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect after login when user data is loaded
  useEffect(() => {
    // Don't do anything if auth is still loading or already redirecting
    if (authLoading || redirecting) {
      return;
    }

    // If no user, stay on login page (user hasn't logged in yet)
    if (!currentUser) {
      return;
    }

    // At this point, authLoading is false and currentUser exists
    // userData should be loaded (either an object if document exists, or null if it doesn't)
    // If userData is null, it means no profile document exists
    // If userData exists but has no dorm, profile is incomplete
    // If userData exists with dorm, profile is complete
    
    // Small delay to ensure state is stable after login
    const timer = setTimeout(() => {
      // Check if userData has been loaded (it will be null if no document, or an object if document exists)
      // We check userData explicitly - if it's null after loading completes, no profile exists
      if (userData === null || (userData && !userData.dorm)) {
        // No profile or incomplete profile - redirect to create
        setRedirecting(true);
        router.push('/profile/create');
      } else if (userData && userData.dorm) {
        // Profile exists and is complete - redirect to home
        setRedirecting(true);
        router.push('/home');
      }
      // If userData is still undefined, it means it's still loading (shouldn't happen if authLoading is false)
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentUser, userData, authLoading, router, redirecting]);

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      // Set flag to show welcome message on home page
      sessionStorage.setItem('justLoggedIn', 'true');
      // Don't redirect here - let the useEffect handle it after userData is loaded
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Only one popup request is allowed at a time.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Set flag to show welcome message on home page
      sessionStorage.setItem('justLoggedIn', 'true');
      // Don't redirect here - let the useEffect handle it after userData is loaded
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // Provide user-friendly error messages
      let errorMessage = 'Failed to log in. Please try again.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please sign up first.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.message) {
        // Check if the error message contains the code
        if (error.message.includes('invalid-credential') || error.message.includes('wrong-password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email address. Please sign up first.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Show redirecting message if logged in and waiting for redirect
  if (redirecting || (!authLoading && currentUser)) {
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
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            objectFit: 'cover'
          }}
        />
        <div style={{ fontSize: '1.1rem', color: '#666' }}>Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '2rem', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '28px',
          margin: '0 auto 1rem'
        }}>
          D
        </div>
        <h1 style={{ 
          margin: 0, 
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          Dormzy
        </h1>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>Login</h2>
        
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
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#333',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#ccc';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/auth/signup" style={{ color: '#667eea', fontWeight: '500' }}>
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}

