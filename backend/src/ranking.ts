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

const RANKS: { min: number; title: string; emoji: string }[] = [
  { min: 1,  title: "Rookie",          emoji: "🥚" },
  { min: 5,  title: "Street Member",   emoji: "🔰" },
  { min: 10, title: "Hustler",         emoji: "😈" },
  { min: 18, title: "Gangster",        emoji: "🔥" },
  { min: 28, title: "OG",              emoji: "👑" },
  { min: 40, title: "Elite Gangster",  emoji: "💎" },
  { min: 55, title: "Boss",            emoji: "☠️" },
  { min: 75, title: "Don",             emoji: "🕶️" },
  { min: 100,title: "Legend",          emoji: "🏆" },
];

export function rankTitle(level: number): string {
  let title = RANKS[0].title;
  for (const r of RANKS) {
    if (level >= r.min) title = r.title;
  }
  return title;
}

export function rankEmoji(level: number): string {
  let emoji = RANKS[0].emoji;
  for (const r of RANKS) {
    if (level >= r.min) emoji = r.emoji;
  }
  return emoji;
}

export function fullRank(level: number): string {
  return `${rankEmoji(level)} ${rankTitle(level)}`;
}
