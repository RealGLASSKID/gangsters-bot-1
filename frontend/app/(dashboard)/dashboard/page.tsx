"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/firebase/useAuth";
import type { BotUser, BotMessage } from "@/types";

export default function OverviewPage() {
  const [users, setUsers] = useState<BotUser[] | null>(null);
  const [messages, setMessages] = useState<BotMessage[] | null>(null);

  useEffect(() => {
    authedFetch("users")
      .then((r) => r.json())
      .then((r) => setUsers(r.data || []));
    authedFetch("messages")
      .then((r) => r.json())
      .then((r) => setMessages(r.data || []));
  }, []);

  const admins = users?.filter((u) => u.role !== "member").length ?? "…";
  const total = users?.length ?? "…";
  const messagesToday =
    messages?.filter((m) => Date.now() - m.createdAt < 24 * 60 * 60 * 1000).length ?? "…";

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Overview</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total users" value={total} />
        <StatCard label="Admins / super-admins" value={admins} />
        <StatCard label="Messages (24h)" value={messagesToday} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
