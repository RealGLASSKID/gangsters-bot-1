import { config } from "../config";
import { logger } from "../utils/logger";

export type InboundPayload = {
  from: string;
  text: string;
  messageId: string | null;
  replyToId: string | null;
};

/**
 * Forwards an inbound WhatsApp message to the backend ("the brain" — e.g.
 * a Next.js API route). This relay has no opinion about what happens next;
 * it just delivers the payload and lets the caller retry via WhatsApp's
 * own delivery if this fails.
 */
export async function forwardInboundToBackend(payload: InboundPayload): Promise<void> {
  const url = config.backend.inboundUrl;
  if (!url) {
    logger.warn("No BACKEND_URL configured; dropping inbound WhatsApp message");
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.backend.webhookSecret) {
    headers["x-webhook-secret"] = config.backend.webhookSecret;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Backend inbound webhook failed ${response.status}: ${body}`);
  }
}
