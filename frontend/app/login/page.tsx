"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/useAuth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!loading && user) {
    router.replace("/dashboard");
  }

  async function handleSignIn() {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(clientAuth, new GoogleAuthProvider());
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">G</div>
        <h1>Gangster Bot</h1>
        <p className="subtitle">Admin control panel</p>
        <button className="btn-google" onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && <p className="form-error">{error}</p>}
        <p className="login-note">Access is restricted to allowlisted accounts.</p>
      </div>
    </div>
  );
}
