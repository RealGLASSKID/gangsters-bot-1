"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { Dashboard } from "@/components/Dashboard";

export default function OverviewPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) {
    return <div className="muted">Loading…</div>;
  }

  if (!token) {
    return <div className="muted">Sign in required.</div>;
  }

  return <Dashboard token={token} />;
}
