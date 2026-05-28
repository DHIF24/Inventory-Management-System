import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../firebase';
import { UserProfile, OperationType } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or create Firestore user profile
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserProfile({ id: user.uid, ...userDoc.data() } as UserProfile);
          } else {
            // Setup default profile
            const isBootstrappedAdmin = user.email === 'dhif4025@gmail.com';
            const newProfile = {
              name: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
              email: user.email || '',
              createdAt: new Date().toISOString(),
              role: isBootstrappedAdmin ? ('admin' as const) : ('user' as const),
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ id: user.uid, ...newProfile });
          }
        } catch (error) {
          console.error("Error setting up user profile in context:", error);
          // Fallback local profile so we don't block user
          setUserProfile({
            id: user.uid,
            name: user.email?.split('@')[0] || 'Utilisateur',
            email: user.email || '',
            createdAt: new Date().toISOString(),
            role: user.email === 'dhif4025@gmail.com' ? 'admin' : 'user'
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const isBootstrappedAdmin = email === 'dhif4025@gmail.com';
    const newProfile = {
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
      role: isBootstrappedAdmin ? ('admin' as const) : ('user' as const),
    };

    const userRef = doc(db, 'users', cred.user.uid);
    try {
      await setDoc(userRef, newProfile);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${cred.user.uid}`);
    }

    setUserProfile({ id: cred.user.uid, ...newProfile });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changePassword = async (newPass: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPass);
    } else {
      throw new Error('No authenticated user');
    }
  };

  const updateProfileName = async (name: string) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...userProfile,
      name
    } as any;
    delete updated.id; // remove id field for firestore save

    try {
      await setDoc(userRef, updated, { merge: true });
      setUserProfile(prev => prev ? { ...prev, name } : null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    changePassword,
    updateProfileName
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
