/**
 * Public-facing labels for members.
 * Prefer WhatsApp push/display name; else +phone. Never show raw JIDs.
 */

export function phoneFromJid(jid: string): string | null {
  const user = (jid || "").split("@")[0].split(":")[0] || "";
  if (/^\d{10,15}$/.test(user)) return `+${user}`;
  return null;
}

/** Short public id: +234... or short token — never full @s.whatsapp.net */
export function displayId(jid: string): string {
  const phone = phoneFromJid(jid);
  if (phone) return phone;
  const user = (jid || "").split("@")[0].split(":")[0] || "member";
  if (user.length > 16) return user.slice(0, 12) + "…";
  return user;
}

/**
 * Best label for chat messages.
 * @param name pushName / DB name
 * @param jid member jid
 */
export function publicName(name: string | null | undefined, jid: string): string {
  const n = (name || "").trim();
  if (
    n &&
    n.toLowerCase() !== "unknown" &&
    !n.includes("@s.whatsapp") &&
    !n.includes("@lid") &&
    !n.includes("@g.us") &&
    !/^\d{15,}$/.test(n)
  ) {
    return n;
  }
  return displayId(jid);
}

/** For warning lines: "Name" with optional @ mention handled by caller */
export function warnLabel(name: string | null | undefined, jid: string): string {
  return publicName(name, jid);
}
