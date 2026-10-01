import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setIsLoading(false);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (e) {
          console.error("Auth error:", e);
        }
        setIsLoading(false);
      }
    });
    return unsub;
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
}
