import { CommandContext } from "../types";

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

export function displayId(jid: string): string {
  return jid.split("@")[0] || jid;
}
