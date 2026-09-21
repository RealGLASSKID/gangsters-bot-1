"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "./client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const unsub = onAuthStateChanged(getClientAuth(), (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    } catch {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}

export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  let idToken: string | null = null;
  try {
    if (isFirebaseConfigured()) {
      const user = getClientAuth().currentUser;
      idToken = user ? await user.getIdToken() : null;
    }
  } catch {
    /* ignore */
  }
  return fetch(`/api/brain/${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
}
