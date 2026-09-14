"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";

type Props = {
  children: (user: User, token: string) => ReactNode;
};

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured()) {
      setReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        const idToken = await next.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
      setReady(true);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="container">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!firebaseConfigured()) {
    return (
      <div className="container">
        <header>
          <h1>GANGSTER BOT</h1>
        </header>
        <div className="error">
          Firebase web config is missing. Add these to <code>frontend/.env.local</code>:
          <br />
          NEXT_PUBLIC_FIREBASE_API_KEY
          <br />
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
          <br />
          NEXT_PUBLIC_FIREBASE_PROJECT_ID
          <br />
          Then create the admin user under Firebase Authentication.
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="container">
        <header>
          <h1>GANGSTER BOT</h1>
        </header>
        <form className="card login" onSubmit={onSubmit}>
          <h2>Admin sign in</h2>
          <p className="muted">Only emails you add in Firebase Authentication can enter.</p>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="signout-bar">
        <span className="muted">{user.email}</span>
        <button className="btn ghost" type="button" onClick={() => signOut(getFirebaseAuth())}>
          Sign out
        </button>
      </div>
      {children(user, token)}
    </>
  );
}
