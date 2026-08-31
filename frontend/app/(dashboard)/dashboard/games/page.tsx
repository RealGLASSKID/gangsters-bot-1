"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { GameDefinition } from "@/types";

export default function GamesPage() {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await authedFetch("games");
    const json = await res.json();
    setGames(json.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await authedFetch("games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    load();
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Games</h2>
      <p className="mb-6 text-sm text-zinc-500">
        Drop a new file in <code className="text-zinc-400">gangster-bot-brain/src/bot/games/</code> and
        restart the brain. This page only toggles whether a loaded game is playable.
      </p>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {games.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <div>
                <p className="font-medium">{g.name}</p>
                <p className="text-sm text-zinc-500">{g.description}</p>
              </div>
              <button
                onClick={() => toggle(g.id, !g.enabled)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  g.enabled ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {g.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
