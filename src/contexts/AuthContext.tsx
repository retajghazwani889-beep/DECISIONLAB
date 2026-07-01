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
import { UserProfile, AnalysisReport } from '../types';

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
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  connectGoogleWorkspace: () => Promise<string | null>;
  googleWorkspaceError: string | null;
  setGoogleWorkspaceError: (error: string | null) => void;
  dbOnline: 'connecting' | 'online' | 'offline';
  analyses: AnalysisReport[];
  saveAnalysisToHistory: (analysis: AnalysisReport) => void;
  setAnalyses: React.Dispatch<React.SetStateAction<AnalysisReport[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);

  // Initialize from Local Storage instantly for high-fidelity offline cache routing
  useEffect(() => {
    const cached = localStorage.getItem('cached_analyses');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const uniqueMap = new Map<string, any>();
          parsed.forEach(item => {
            if (item && item.id) {
              uniqueMap.set(item.id, item);
            }
          });
          const uniqueList = Array.from(uniqueMap.values());
          setAnalyses(uniqueList);
        }
      } catch (_) {}
    }
  }, []);

  const saveAnalysisToHistory = (newAnalysis: AnalysisReport) => {
    setAnalyses(prev => {
      const idx = prev.findIndex(item => item.id === newAnalysis.id);
      let updated;
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...newAnalysis };
      } else {
        updated = [newAnalysis, ...prev];
      }
      try {
        localStorage.setItem('cached_analyses', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleWorkspaceError, setGoogleWorkspaceError] = useState<string | null>(null);
  const [dbOnline, setDbOnline] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Validate connection to Firestore on boot
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_test_', 'connection'));
        setDbOnline('online');
      } catch (error: any) {
        // Expected if rules deny or collection doesn't exist, but tests if client is online.
        // A permission-denied code means the server replied, so we are absolutely online!
        if (error && (error.code === 'permission-denied' || error.message?.includes('permission'))) {
          setDbOnline('online');
        } else {
          console.warn("Firestore unreachable. Turning on elegant offline-cached mode.");
          setDbOnline('offline');
        }
      }
    };
    testConnection();
  }, []);

  const fetchProfile = async (uid: string) => {
    const path = `profiles/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, path));

      if (docSnap.exists()) {
        // Use exactly what's stored in the database. The tier (subscriptionStatus)
        // is set only by a verified payment flow — never inferred from email/name.
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      } else {
        // Brand-new user: always start on the free tier.
        setProfile({
          uid,
          email: auth.currentUser?.email || 'guest@startup.com',
          displayName: auth.currentUser?.displayName || 'Startup Founder',
          photoURL: null,
          subscriptionStatus: 'free',
          roleType: 'Founder',
          onboardingCompleted: true,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.warn("Firestore profiles database unreachable. Operating in offline fallback session mode:", error);
      setProfile({
        uid,
        email: auth.currentUser?.email || 'guest@startup.com',
        displayName: auth.currentUser?.displayName || 'Startup Founder',
        photoURL: null,
        subscriptionStatus: 'free',
        roleType: 'Founder',
        onboardingCompleted: true,
        createdAt: new Date()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
        setGoogleAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Always show the Google account chooser so a user can pick which account.
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user'))) {
        console.warn("Google authentication closed or cancelled by user.");
        return;
      }
      console.error("Auth Error:", error);
      throw error;
    }
  };

  const connectGoogleWorkspace = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/presentations');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    setGoogleWorkspaceError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error: any) {
      const isPopupClosed = error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user'));
      if (isPopupClosed) {
        console.warn("Google Workspace connection closed by user (auth/popup-closed-by-user).");
        setGoogleWorkspaceError(
          "The Google authentication window was closed or blocked by browser security settings. When previewing within the workspace, secure connection popups can be restricted. Please open the application in a new tab using the 'Open in New Tab' button or the top-right launch icon (↗) to connect successfully."
        );
        return null;
      }
      console.error("Google Workspace connection failed:", error);
      setGoogleWorkspaceError(error.message || String(error));
      return null;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.warn("Login Error:", error);
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
      console.warn("Signup Error:", error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.warn("Password Reset Error:", error);
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
      googleAccessToken,
      setGoogleAccessToken,
      connectGoogleWorkspace,
      googleWorkspaceError,
      setGoogleWorkspaceError,
      dbOnline,
      analyses,
      saveAnalysisToHistory,
      setAnalyses,
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