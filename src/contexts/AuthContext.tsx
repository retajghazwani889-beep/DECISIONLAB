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
    // Identity cache: the last real profile we loaded for this uid. Used by
    // the fallbacks below so a slow/unreachable Firestore NEVER changes who
    // the user is (beta bug: investors got renamed "Startup Founder" and
    // routed to the founder side whenever the profile fetch failed).
    const cacheKey = `profile_identity_${uid}`;
    let cachedIdentity: any = null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) cachedIdentity = JSON.parse(raw);
    } catch (_) {}

    try {
      const docSnap = await getDoc(doc(db, path));

      if (docSnap.exists()) {
        // Use exactly what's stored in the database. The tier (subscriptionStatus)
        // is set only by a verified payment flow — never inferred from email/name.
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            displayName: (data as any).displayName || null,
            accountType: (data as any).accountType || null,
            roleType: (data as any).roleType || null,
            subscriptionStatus: (data as any).subscriptionStatus || 'free',
          }));
        } catch (_) {}
      } else {
        // Brand-new user whose profile document hasn't been written yet
        // (the signup page writes it moments after account creation).
        // IMPORTANT: onboardingCompleted must be FALSE here — this temporary
        // profile previously claimed to be a fully-onboarded founder, which
        // made role guards eject brand-new team members and investors to the
        // homepage ("it just logged me out" in beta testing).
        // Use the cached/auth identity — never invent a "Startup Founder" name.
        setProfile({
          uid,
          email: auth.currentUser?.email || '',
          displayName: cachedIdentity?.displayName || auth.currentUser?.displayName || 'New User',
          photoURL: auth.currentUser?.photoURL || null,
          subscriptionStatus: cachedIdentity?.subscriptionStatus || 'free',
          ...(cachedIdentity?.accountType ? { accountType: cachedIdentity.accountType } : {}),
          roleType: cachedIdentity?.roleType || 'Founder',
          onboardingCompleted: false,
          createdAt: new Date()
        } as any);
      }
    } catch (error) {
      console.warn("Firestore profiles database unreachable. Operating in offline fallback session mode:", error);
      // Offline fallback: keep the user's REAL name and role from the cache
      // (or Firebase Auth) — do not rewrite an investor into a founder.
      setProfile({
        uid,
        email: auth.currentUser?.email || '',
        displayName: cachedIdentity?.displayName || auth.currentUser?.displayName || 'User',
        photoURL: auth.currentUser?.photoURL || null,
        subscriptionStatus: cachedIdentity?.subscriptionStatus || 'free',
        ...(cachedIdentity?.accountType ? { accountType: cachedIdentity.accountType } : {}),
        roleType: cachedIdentity?.roleType || 'Founder',
        onboardingCompleted: true,
        createdAt: new Date()
      } as any);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // CRITICAL: clear the previous account's profile BEFORE loading the new
      // one. Keeping it during the fetch made the app briefly believe
      // "new user + old account's role", so role guards misrouted people who
      // signed into a second account (founder → team member/investor) in the
      // same browser ("stuck on the founder", "logged me out again").
      setUser(currentUser);
      setProfile(null);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
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
      const code = error?.code || '';
      const msg = error?.message || '';
      const isPopupIssue = 
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-blocked' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request') ||
        msg.includes('popup-blocked');

      if (isPopupIssue) {
        console.warn("Google authentication popup closed, cancelled, or blocked:", error);
      } else {
        console.error("Auth Error:", error);
      }
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
      const code = error?.code || '';
      const msg = error?.message || '';
      const isPopupClosed = 
        code === 'auth/popup-closed-by-user' || 
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-blocked' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request') ||
        msg.includes('popup-blocked');

      if (isPopupClosed) {
        console.warn("Google Workspace connection closed, cancelled, or blocked by user/iframe context:", error);
        setGoogleWorkspaceError(
          "The Google authentication window was closed, cancelled, or blocked by browser security settings. When previewing within the workspace iframe, secure connection popups can be restricted. Please open the application in a new tab using the 'Open in New Tab' button or the top-right launch icon (↗) to connect successfully."
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