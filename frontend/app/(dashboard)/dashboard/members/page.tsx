"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { api, type MemberRow } from "@/lib/api";

export default function MembersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (user) setToken(await user.getIdToken());
      else setToken(null);
    });
    return () => unsub();
  }, []);

  async function load(t: string) {
    setLoading(true);
    try {
      setMembers(await api.members(t));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (token) void load(token);
  }, [token]);

  async function act(jid: string, kind: "xp" | "level" | "coins", value: number) {
    if (!token) return;
    setBusy(jid + kind);
    setMsg("");
    try {
      if (kind === "xp") await api.setXp(token, jid, value);
      if (kind === "level") await api.setLevel(token, jid, value);
      if (kind === "coins") await api.setCoins(token, jid, value, "add");
      setMsg("Updated.");
      await load(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
    setBusy(null);
  }

  function promptNum(label: string): number | null {
    const raw = window.prompt(label);
    if (raw === null) return null;
    const n = Number(raw);
    if (Number.isNaN(n)) {
      alert("Enter a valid number");
      return null;
    }
    return n;
  }

  if (!token) return <p className="muted">Sign in required.</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p className="subtitle">Set XP, level, and give coins</p>
        </div>
      </div>

      {error && (
        <p className="form-error" style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}
      {msg && (
        <p className="muted" style={{ marginBottom: 12, color: "var(--green)" }}>
          {msg}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="card padded-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Level</th>
                <th>XP</th>
                <th>Coins</th>
                <th>Msgs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No members yet. They appear after chatting in the group.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.jid}>
                    <td>
                      <div>{m.name}</div>
                      <div className="muted" style={{ fontSize: "0.7rem" }}>
                        {m.jid.split("@")[0]}
                      </div>
                    </td>
                    <td>{m.level}</td>
                    <td>{m.xp.toLocaleString()}</td>
                    <td>
                      {m.coins.toLocaleString()}
                      <span className="muted"> / {m.bank.toLocaleString()}</span>
                    </td>
                    <td>{m.messages}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn ghost"
                          style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                          disabled={!!busy}
                          onClick={() => {
                            const n = promptNum(`Set LEVEL for ${m.name}`);
                            if (n !== null) void act(m.jid, "level", n);
                          }}
                        >
                          Set level
                        </button>
                        <button
                          className="btn ghost"
                          style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                          disabled={!!busy}
                          onClick={() => {
                            const n = promptNum(`Set XP for ${m.name}`);
                            if (n !== null) void act(m.jid, "xp", n);
                          }}
                        >
                          Set XP
                        </button>
                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                          disabled={!!busy}
                          onClick={() => {
                            const n = promptNum(`Add COINS for ${m.name}`);
                            if (n !== null) void act(m.jid, "coins", n);
                          }}
                        >
                          + Coins
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
