"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { BotMessage } from "@/types";

export default function MessagesPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await authedFetch("messages");
      const json = await res.json();
      setMessages(json.data || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p className="subtitle">Recent bot traffic</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : messages.length === 0 ? (
        <div className="card">
          <p className="muted">No messages yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{
                padding: "12px 16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span
                className="badge"
                style={{
                  fontSize: "0.65rem",
                  background:
                    m.direction === "inbound"
                      ? "rgba(59,130,246,0.15)"
                      : "rgba(168,85,247,0.15)",
                  borderColor:
                    m.direction === "inbound"
                      ? "rgba(59,130,246,0.3)"
                      : "rgba(168,85,247,0.3)",
                  color: m.direction === "inbound" ? "#93c5fd" : "#d8b4fe",
                }}
              >
                {m.direction}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  {m.phone || "—"} ·{" "}
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </div>
                <div style={{ fontSize: "0.9rem", wordBreak: "break-word" }}>
                  {m.text || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
