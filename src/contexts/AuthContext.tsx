import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate connection to Firestore on boot
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_test_', 'connection'));
      } catch (error) {
        // Expected if rules deny or collection doesn't exist, but tests if client is online
      }
    };
    testConnection();
  }, []);

  const fetchProfile = async (uid: string) => {
    const path = `profiles/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Auth Error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: fullName });
      }
    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password Reset Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      forgotPassword,
      logout,
      refreshProfile: () => user ? fetchProfile(user.uid) : Promise.resolve()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
