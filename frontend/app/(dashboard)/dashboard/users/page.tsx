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
    const res = await authedFetch("users");
    const json = await res.json();
    setUsers(json.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
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
    load();
  }

  async function toggleBan(phone: string, banned: boolean) {
    await authedFetch("users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, banned }),
    });
    load();
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Users & Roles</h2>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Last seen</th>
              <th className="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.phone} className="border-b border-zinc-900">
                <td className="py-2 pr-4 font-mono">{u.phone}</td>
                <td className="py-2 pr-4">{u.displayName || "—"}</td>
                <td className="py-2 pr-4">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.phone, e.target.value as Role)}
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </td>
                <td className="py-2 pr-4 text-zinc-500">
                  {new Date(u.lastSeenAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => toggleBan(u.phone, !u.banned)}
                    className={`rounded px-2 py-1 text-xs ${
                      u.banned
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-red-950 text-red-300 hover:bg-red-900"
                    }`}
                  >
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
