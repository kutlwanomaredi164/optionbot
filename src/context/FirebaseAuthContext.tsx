import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
  testConnection,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  firestoreConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  firestoreConnected: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    // Check initial Firestore connectivity
    testConnection().then((connected) => {
      setFirestoreConnected(connected);
    });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile to Firestore /users/{userId} if not already created
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || 'SelectBot User',
              role: 'owner',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          // If security rules or network fails, log with standard handler without throwing in auth loop
          console.warn('Could not sync user document to Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        throw err;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
      throw err;
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        firestoreConnected,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}
