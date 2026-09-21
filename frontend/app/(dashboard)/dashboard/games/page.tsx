"use client";


import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { GameDefinition } from "@/types";

export default function GamesPage() {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("games");
      const json = await res.json();
      setGames(json.data || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await authedFetch("games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    void load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Games</h1>
          <p className="subtitle">Enable or disable loaded games</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : games.length === 0 ? (
        <div className="card">
          <p className="muted">No game definitions returned from the API yet.</p>
        </div>
      ) : (
        <div className="cmd-list">
          {games.map((g) => (
            <div className="cmd" key={g.id}>
              <strong>{g.name || g.id}</strong>
              <span className="muted">{g.description || "—"}</span>
              <div style={{ marginTop: 8 }}>
                <button
                  className={`btn ${g.enabled ? "danger" : ""}`}
                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                  onClick={() => void toggle(g.id, !g.enabled)}
                >
                  {g.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
