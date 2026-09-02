const floodMap = new Map<string, number[]>();
const FLOOD_WINDOW_MS = 7000;
const FLOOD_MAX = 6;

const LINK_RE = /https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\//i;

export function isFlooding(jid: string): boolean {
  const now = Date.now();
  const times = (floodMap.get(jid) || []).filter((t) => now - t < FLOOD_WINDOW_MS);
  times.push(now);
  floodMap.set(jid, times);
  return times.length > FLOOD_MAX;
}

export function containsLink(text: string): boolean {
  return LINK_RE.test(text);
}

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "nigga", "nigger"];

export function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}
