import { CommandContext } from "../types";
import { isLid, isPn, matchesAny, normalizeJid } from "./ids";

/** Parse a phone number from command args into a WhatsApp JID. */
export function parseTarget(args: string[], fallback?: string): string | null {
  for (const a of args) {
    const digits = a.replace(/\D/g, "");
    if (digits.length >= 8) return `${digits}@s.whatsapp.net`;
  }
  return fallback || null;
}

/** Prefer a @mention, then a typed number, then optional fallback (usually the sender). */
export function resolveTarget(ctx: CommandContext, fallback?: string | null): string | null {
  const mentioned = ctx.mentionedJids[0];
  if (mentioned) return mentioned;
  return parseTarget(ctx.args, fallback || undefined);
}

/**
 * Resolve @mention to the best DB key (phone JID when possible).
 * Group "Addressing: lid" mentions come as @lid — map them via group participants.
 */
export async function resolveTargetJid(
  ctx: CommandContext,
  fallback?: string | null
): Promise<string> {
  let jid = resolveTarget(ctx, fallback ?? ctx.from) || ctx.from;
  const norm = normalizeJid(jid) || jid;

  if (isLid(norm) && ctx.actions?.getGroupInfo) {
    try {
      const info = await ctx.actions.getGroupInfo();
      if (info?.participants?.length) {
        const p = info.participants.find(
          (x) =>
            matchesAny(norm, [x.id, x.lid, x.pn]) ||
            x.id === jid ||
            x.lid === jid
        );
        if (p) {
          if (p.pn) return p.pn;
          if (p.id && isPn(p.id)) return p.id;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return norm;
}

export function displayId(jid: string): string {
  const n = normalizeJid(jid) || jid;
  const user = (n.split("@")[0] || "").split(":")[0] || "";
  if (/^\d{10,15}$/.test(user)) return `+${user}`;
  if (user.length > 16) return user.slice(0, 12) + "…";
  return user || "member";
}

/** Prefer push/DB name; never show raw JID in public messages */
export function publicName(name: string | null | undefined, jid: string): string {
  const n = (name || "").trim();
  if (
    n &&
    n.toLowerCase() !== "unknown" &&
    !n.includes("@s.whatsapp") &&
    !n.includes("@lid") &&
    !n.includes("@g.us")
  ) {
    return n;
  }
  return displayId(jid);
}
