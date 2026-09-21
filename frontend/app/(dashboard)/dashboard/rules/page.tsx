"use client";


import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { api } from "@/lib/api";

type Rule = {
  id: number;
  title: string;
  body: string;
  keywords: string;
  enabled: number;
  sort_order: number;
};

export default function RulesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (user) => {
      if (user) setToken(await user.getIdToken());
      else setToken(null);
    });
  }, []);

  async function load(t: string) {
    try {
      setRules(await api.rules(t));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  useEffect(() => {
    if (token) void load(token);
  }, [token]);

  if (!token) return <p className="muted">Sign in required.</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Group Rules</h1>
          <p className="subtitle">
            Enforced automatically when keywords match (delete + warn by name)
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12, color: "var(--accent)" }}>Add rule</h3>
        <input
          placeholder="Title e.g. No group ads"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Rule text shown in warning"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{ ...inputStyle, marginTop: 8 }}
        />
        <input
          placeholder="Keywords (comma-separated) e.g. join my group, group link"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        />
        <button
          className="btn"
          style={{ marginTop: 12 }}
          onClick={async () => {
            if (!title.trim() || !body.trim()) return;
            await api.addRule(token, title.trim(), body.trim(), keywords.trim());
            setTitle("");
            setBody("");
            setKeywords("");
            await load(token);
          }}
        >
          Add rule
        </button>
      </div>

      <div className="cmd-list">
        {rules.map((r) => (
          <div className="cmd" key={r.id}>
            <strong>
              {r.enabled ? "✅" : "⏸️"} {r.title}
            </strong>
            <span className="muted">{r.body}</span>
            <span className="muted" style={{ fontSize: "0.75rem" }}>
              Keywords: {r.keywords || "(none)"}
            </span>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button
                className="btn ghost"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={async () => {
                  await api.updateRule(token, r.id, { enabled: r.enabled ? 0 : 1 });
                  await load(token);
                }}
              >
                {r.enabled ? "Disable" : "Enable"}
              </button>
              <button
                className="btn danger"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={async () => {
                  if (!confirm("Delete this rule?")) return;
                  await api.deleteRule(token, r.id);
                  await load(token);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: "0.9rem",
};
