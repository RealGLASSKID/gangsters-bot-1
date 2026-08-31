"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { BotMessage } from "@/types";

export default function MessagesPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await authedFetch("messages");
    const json = await res.json();
    setMessages(json.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // simple polling; swap for Firestore onSnapshot if you want realtime
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Messages</h2>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm"
            >
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  m.direction === "inbound"
                    ? "bg-blue-950 text-blue-300"
                    : "bg-purple-950 text-purple-300"
                }`}
              >
                {m.direction}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-zinc-500">{m.phone}</p>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              <span className="shrink-0 text-xs text-zinc-600">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
