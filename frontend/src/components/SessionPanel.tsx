"use client";

import { useEffect, useState } from "react";
import { api, type Session } from "@/lib/api";

export function SessionPanel({ token }: { token: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const next = await api.session(token);
      setSession(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load session");
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function relink() {
    const ok = window.confirm(
      "This logs the bot out of WhatsApp and shows a new QR. Continue?"
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.relink(token);
      setSession({ ...res.session, bot: session?.bot || "GANGSTER BOT", groupJid: session?.groupJid || "", adminEmail: session?.adminEmail || null, firebaseReady: true });
      setTimeout(() => void load(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Relink failed");
    } finally {
      setBusy(false);
    }
  }

  const status = session?.status || "unknown";
  const connected = !!session?.connected;

  return (
    <div className="section">
      <h2>WhatsApp session</h2>
      <div className="card session-card">
        <div className="session-row">
          <span className="badge">
            <span className={`dot ${connected ? "on" : ""}`} />
            {connected ? "Connected" : status}
          </span>
          {session?.user && <code className="muted">{session.user}</code>}
        </div>
        {session?.lastError && <p className="form-error">{session.lastError}</p>}
        {error && <p className="form-error">{error}</p>}
        {session?.qrDataUrl && (
          <div className="qr-wrap">
            <img src={session.qrDataUrl} alt="WhatsApp QR code" width={220} height={220} />
            <p className="muted">Open WhatsApp on the bot phone → Linked devices → Link a device.</p>
          </div>
        )}
        {!session?.qrDataUrl && !connected && (
          <p className="muted">No QR yet. Click Relink if the session is dead.</p>
        )}
        <div className="session-actions">
          <button className="btn" type="button" onClick={() => void load()} disabled={busy}>
            Refresh
          </button>
          <button className="btn danger" type="button" onClick={() => void relink()} disabled={busy}>
            {busy ? "Relinking…" : "Relink (new QR)"}
          </button>
        </div>
      </div>
    </div>
  );
}
