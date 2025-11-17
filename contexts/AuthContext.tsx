'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { User, DormType } from '@/firebase/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw to let the signup page handle it
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw to let the login page handle it
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists, if not create a basic one
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create basic user document for Google sign-in
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          createdAt: new Date()
        }, { merge: true });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserData(null);
  }

  async function updateUserData(data: Partial<User>) {
    if (!currentUser) return;
    
    // Filter out undefined values (Firestore doesn't accept undefined)
    const cleanData: any = {
      uid: currentUser.uid,
      email: currentUser.email,
      updatedAt: new Date()
    };
    
    // Only include defined values
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, cleanData, { merge: true });
    
    const updatedDoc = await getDoc(userRef);
    if (updatedDoc.exists()) {
      const data = updatedDoc.data();
      setUserData({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as User);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as User);
        } else {
          // User document doesn't exist - set to null explicitly
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

