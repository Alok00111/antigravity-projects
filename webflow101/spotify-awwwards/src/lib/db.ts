import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: ReturnType<typeof serverTimestamp> | null;
  plan: "free" | "premium" | "duo" | "family" | "student";
}

/**
 * Creates a user profile document in Firestore if it doesn't already exist.
 * Called after first sign-up.
 */
export async function createUserProfile(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // profile already exists

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0] || "Listener",
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
    plan: "free",
  } satisfies Omit<UserProfile, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> });
}

/**
 * Fetches a user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}
