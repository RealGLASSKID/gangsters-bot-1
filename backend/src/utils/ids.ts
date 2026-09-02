/** WhatsApp identity helpers — PN JID (@s.whatsapp.net) vs LID (@lid). */

export type IdKind = "pn" | "lid" | "group" | "other";

export function normalizeJid(jid?: string | null): string | null {
  if (!jid) return null;
  const trimmed = jid.trim();
  if (!trimmed) return null;
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return trimmed;
  const user = trimmed.slice(0, at);
  const server = trimmed.slice(at + 1);
  const bare = user.split(":")[0];
  return `${bare}@${server}`;
}

export function idKind(jid?: string | null): IdKind {
  const n = normalizeJid(jid);
  if (!n) return "other";
  if (n.endsWith("@s.whatsapp.net") || n.endsWith("@c.us") || n.endsWith("@hosted")) return "pn";
  if (n.endsWith("@lid") || n.endsWith("@hosted.lid")) return "lid";
  if (n.endsWith("@g.us")) return "group";
  return "other";
}

export function isLid(jid?: string | null) {
  return idKind(jid) === "lid";
}

export function isPn(jid?: string | null) {
  return idKind(jid) === "pn";
}

export function splitPair(a?: string | null, b?: string | null): { pn: string | null; lid: string | null } {
  const A = normalizeJid(a);
  const B = normalizeJid(b);
  let pn: string | null = null;
  let lid: string | null = null;
  for (const x of [A, B]) {
    if (!x) continue;
    if (idKind(x) === "pn" && !pn) pn = x;
    else if (idKind(x) === "lid" && !lid) lid = x;
  }
  return { pn, lid };
}

export function sameUser(a?: string | null, b?: string | null): boolean {
  const A = normalizeJid(a);
  const B = normalizeJid(b);
  if (!A || !B) return false;
  return A === B;
}

export function matchesAny(target: string | null | undefined, candidates: Array<string | null | undefined>): boolean {
  const t = normalizeJid(target);
  if (!t) return false;
  return candidates.some((c) => sameUser(t, c));
}

export type SenderIds = {
  raw: string;
  pn: string | null;
  lid: string | null;
  /** Best id for storage / owner checks: PN if known, else raw. */
  primary: string;
};

export function senderFromKey(key: {
  participant?: string | null;
  participantAlt?: string | null;
  participantPn?: string | null;
  participantLid?: string | null;
  senderPn?: string | null;
  senderLid?: string | null;
  remoteJid?: string | null;
  remoteJidAlt?: string | null;
}): SenderIds {
  const raw = normalizeJid(key.participant) || normalizeJid(key.remoteJid) || "";
  const { pn, lid } = splitPair(
    raw,
    key.participantAlt ||
      key.participantPn ||
      key.participantLid ||
      key.senderPn ||
      key.senderLid ||
      key.remoteJidAlt
  );
  const primary = pn || raw;
  return { raw, pn, lid, primary };
}

export function participantMatches(
  participant: { id?: string; phoneNumber?: string; jid?: string; lid?: string },
  ids: SenderIds
): boolean {
  return matchesAny(participant.id, [ids.primary, ids.pn, ids.lid, ids.raw])
    || matchesAny(participant.phoneNumber, [ids.primary, ids.pn, ids.lid, ids.raw])
    || matchesAny(participant.jid, [ids.primary, ids.pn, ids.lid, ids.raw])
    || matchesAny(participant.lid, [ids.primary, ids.pn, ids.lid, ids.raw]);
}
