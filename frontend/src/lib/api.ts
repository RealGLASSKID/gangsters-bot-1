const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed`);
  return res.json();
}

export type Health = {
  ok: boolean;
  bot: string;
  connected: boolean;
  groupJid: string;
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
};

export const api = {
  health: () => get<Health>("/api/health"),
  stats: () => get<Stats>("/api/stats"),
  xp: () => get<XpRow[]>("/api/leaderboard/xp"),
  coins: () => get<CoinRow[]>("/api/leaderboard/coins"),
  rep: () => get<RepRow[]>("/api/leaderboard/rep"),
  giveaway: () => get<Giveaway>("/api/giveaway"),
  commands: () => get<Cmd[]>("/api/commands"),
};
