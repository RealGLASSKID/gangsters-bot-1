export const XP_PER_MESSAGE = 15;
export const XP_COOLDOWN_MS = 60_000;

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

export function xpProgress(xp: number): { level: number; current: number; needed: number } {
  const level = levelFromXp(xp);
  const prevTotal = totalXpForLevel(level);
  const current = xp - prevTotal;
  const needed = xpForLevel(level);
  return { level, current, needed };
}

const RANKS: { min: number; title: string }[] = [
  { min: 1, title: "Street Rookie" },
  { min: 5, title: "Corner Boy" },
  { min: 10, title: "Hustler" },
  { min: 15, title: "Soldier" },
  { min: 20, title: "Enforcer" },
  { min: 30, title: "Lieutenant" },
  { min: 40, title: "Capo" },
  { min: 50, title: "Underboss" },
  { min: 70, title: "Boss" },
  { min: 100, title: "Don" },
];

export function rankTitle(level: number): string {
  let title = RANKS[0].title;
  for (const r of RANKS) {
    if (level >= r.min) title = r.title;
  }
  return title;
}
