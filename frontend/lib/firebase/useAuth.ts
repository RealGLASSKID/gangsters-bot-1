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

/**
 * Fetch wrapper for calling the brain's admin API via this app's own
 * /api/brain/[...path] proxy (see that route for why the proxy exists).
 * `path` is relative, e.g. "users" or "games" — no leading slash.
 * Still attaches the Firebase ID token so the proxy can be upgraded to
 * verify it later without changing every call site.
 */
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
