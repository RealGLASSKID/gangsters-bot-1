"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { BotUser, Role } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<BotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("users");
      const json = await res.json();
      setUsers(json.data || []);
    } catch {
      setError("Failed to load users");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateRole(phone: string, role: Role) {
    setError(null);
    const res = await authedFetch("users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, role }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Failed to update role");
      return;
    }
    void load();
  }

  async function toggleBan(phone: string, banned: boolean) {
    await authedFetch("users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, banned }),
    });
    void load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users & Roles</h1>
          <p className="subtitle">Manage members, roles and bans</p>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="card padded-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">No users yet</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.phone || u.id}>
                    <td>{u.name || "—"}</td>
                    <td><code>{u.phone}</code></td>
                    <td>{u.role}</td>
                    <td>{u.banned ? "Banned" : "Active"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <select
                          value={u.role}
                          onChange={(e) => void updateRole(u.phone, e.target.value as Role)}
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                          }}
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                        <button
                          className="btn ghost"
                          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                          onClick={() => void toggleBan(u.phone, !u.banned)}
                        >
                          {u.banned ? "Unban" : "Ban"}
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
