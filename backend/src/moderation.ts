import { isBannedWord } from "./database";

const floodMap = new Map<string, number[]>();
const repeatMap = new Map<string, { text: string; count: number; at: number }>();

const FLOOD_WINDOW_MS = 7000;
const FLOOD_MAX = 6;
const REPEAT_WINDOW_MS = 15000;
const REPEAT_MAX = 3;

const LINK_RE = /https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\//i;

export function isFlooding(jid: string): boolean {
  const now = Date.now();
  const times = (floodMap.get(jid) || []).filter((t) => now - t < FLOOD_WINDOW_MS);
  times.push(now);
  floodMap.set(jid, times);
  return times.length > FLOOD_MAX;
}

export function isRepeatedMessage(jid: string, text: string): boolean {
  const now = Date.now();
  const prev = repeatMap.get(jid);
  const normalized = text.trim().toLowerCase();

  if (prev && prev.text === normalized && now - prev.at < REPEAT_WINDOW_MS) {
    prev.count += 1;
    prev.at = now;
    repeatMap.set(jid, prev);
    return prev.count >= REPEAT_MAX;
  }

  repeatMap.set(jid, { text: normalized, count: 1, at: now });
  return false;
}

export function containsLink(text: string): boolean {
  return LINK_RE.test(text);
}

export function containsBadWord(text: string): boolean {
  return isBannedWord(text);
}

export function isCapsSpam(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 12) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.75;
}

export function tooManyMentions(mentioned: string[]): boolean {
  return mentioned.length >= 6;
}
