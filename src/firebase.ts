import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import type { JournalEntry, UserProfile } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target isolated custom database if configured
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId
    : '(default)'
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Strict Undefined-Stripping Utility
 * Strips all undefined fields recursively to prevent Firestore driver serialization crashes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Initiates Google Sign-In popup with Firebase Auth.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Auth sign-in failed:', error);
    throw error;
  }
}

/**
 * Signs the user out from Firebase Auth.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes.
 */
export function subscribeToAuth(callback: (user: UserProfile | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Saves or updates a journal interaction in Firestore under /users/{userId}/interactions/{interactionId}
 * Strict user data isolation enforced by security rules: request.auth.uid == userId
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to persist journal interactions.');
  }

  const cleanEntry = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });

  const entryRef = doc(db, 'users', userId, 'interactions', entry.id);
  await setDoc(entryRef, cleanEntry, { merge: true });
}

/**
 * Deletes a journal interaction from Firestore.
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId) {
    throw new Error('User must be authenticated to perform delete operations.');
  }
  const entryRef = doc(db, 'users', userId, 'interactions', entryId);
  await deleteDoc(entryRef);
}

/**
 * Deletes all journal interactions for the authenticated user (Privacy Right to Erasure).
 */
export async function deleteAllUserEntries(userId: string): Promise<number> {
  if (!userId) {
    throw new Error('User must be authenticated to delete all entries.');
  }
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const snapshot = await getDocs(interactionsRef);
  let count = 0;
  const deletePromises: Promise<void>[] = [];
  snapshot.forEach((docSnap) => {
    deletePromises.push(deleteDoc(docSnap.ref));
    count++;
  });
  await Promise.all(deletePromises);
  return count;
}

/**
 * Subscribes to real-time updates for all journal interactions belonging to the authenticated user.
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  // Order by updatedAt desc
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore listener error:', err);
      onError(err);
    }
  );
}
