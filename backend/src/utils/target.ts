/** Parse a phone number from command args into a WhatsApp JID. */
export function parseTarget(args: string[], fallback?: string): string | null {
  for (const a of args) {
    const digits = a.replace(/\D/g, "");
    if (digits.length >= 8) return `${digits}@s.whatsapp.net`;
  }
  return fallback || null;
}
