const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    let detail = `API ${path} failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export type Health = {
  ok: boolean;
  bot: string;
  connected: boolean;
  status?: string;
  groupJid: string;
  firebase?: boolean;
};

export type Stats = {
  members: number;
  totalMessages: number;
  totalCoins: number;
};

export type XpRow = { name: string; level: number; xp: number; messages: number };
export type CoinRow = { name: string; coins: number; bank: number; total: number };
export type RepRow = { name: string; rep: number };

export type Giveaway = {
  id: number;
  prize: string;
  endsAt: number;
  entries: number;
} | null;

export type Cmd = {
  name: string;
  description: string;
  usage: string | null;
  adminOnly: boolean;
  ownerOnly: boolean;
  category?: string;
};

export type Session = {
  status: string;
  connected: boolean;
  qrDataUrl: string | null;
  user: string | null;
  lastError: string | null;
  updatedAt: number;
  bot: string;
  groupJid: string;
  adminEmail: string | null;
  firebaseReady: boolean;
};

export const api = {
  health: () => request<Health>("/api/health", null),
  stats: (token: string) => request<Stats>("/api/stats", token),
  xp: (token: string) => request<XpRow[]>("/api/leaderboard/xp", token),
  coins: (token: string) => request<CoinRow[]>("/api/leaderboard/coins", token),
  rep: (token: string) => request<RepRow[]>("/api/leaderboard/rep", token),
  giveaway: (token: string) => request<Giveaway>("/api/giveaway", token),
  commands: (token: string) => request<Cmd[]>("/api/commands", token),
  session: (token: string) => request<Session>("/api/session", token),
  relink: (token: string) =>
    request<{ ok: boolean; session: Session }>("/api/session/relink", token, { method: "POST" }),
};
