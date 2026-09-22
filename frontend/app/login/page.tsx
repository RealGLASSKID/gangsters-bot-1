"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/useAuth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      try {
        sessionStorage.setItem("gb_welcome", "1");
      } catch {
        /* ignore */
      }
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function afterSuccess() {
    try {
      sessionStorage.setItem("gb_welcome", "1");
    } catch {
      /* ignore */
    }
    router.replace("/dashboard");
  }

  async function handleGoogle() {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(clientAuth, new GoogleAuthProvider());
      await afterSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSigningIn(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(clientAuth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(clientAuth, email.trim(), password);
      }
      await afterSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim() || msg);
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="login-shell">
        <div className="login-bg" />
        <div className="login-overlay" />
        <div className="loading-screen login-loading">Waking Sandra up…</div>
      </div>
    );
  }

  return (
    <div className={`login-shell${mounted ? " login-shell--in" : ""}`}>
      <div className="login-bg" />
      <div className="login-overlay" />
      <div className="login-glow login-glow--1" />
      <div className="login-glow login-glow--2" />

      <div className="login-stage">
        <section className="login-hero">
          <p className="login-badge">🔥 𝐆𝐀𝐍𝐆𝐒𝐓𝐄𝐑 𝐁𝐎𝐓</p>
          <h1 className="login-title">
            I&apos;m <span>Sandra</span>
          </h1>
          <p className="login-tagline">
            AKA Gangster Bot — your group&apos;s night shift. Games, ranks, rules, and vibes on lock.
            Sign in if you run this house. 🤭
          </p>
          <ul className="login-perks">
            <li>⚡ Live session &amp; QR control</li>
            <li>👑 Rank &amp; coin management</li>
            <li>🛡️ Rules &amp; moderation</li>
          </ul>
        </section>

        <section className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-shine" />
            <div className="login-logo pulse-logo">S</div>
            <h2>Admin access</h2>
            <p className="login-card-sub">Only authorized operators. No tourists.</p>

            <form className="login-form" onSubmit={handleEmail}>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button type="submit" className="btn btn-primary login-submit" disabled={signingIn}>
                {signingIn
                  ? "Hold up…"
                  : mode === "login"
                    ? "Sign in with email"
                    : "Create account"}
              </button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn-google"
              onClick={handleGoogle}
              disabled={signingIn}
            >
              {signingIn ? "Signing in…" : "Continue with Google"}
            </button>

            {error && <p className="form-error login-error">{error}</p>}

            <p className="login-switch">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button type="button" onClick={() => setMode("register")}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already in?{" "}
                  <button type="button" onClick={() => setMode("login")}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
