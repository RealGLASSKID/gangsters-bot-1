"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "./client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}

export async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = clientAuth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  return fetch(`/api/brain/${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
}