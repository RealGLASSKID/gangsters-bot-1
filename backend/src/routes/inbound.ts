import { Router } from "express";
import { z } from "zod";
import { requireRelaySecret } from "../middleware/relayAuth";
import { handleInboundMessage } from "../bot/router";
import { sendWhatsAppMessage } from "../relay/client";
import { logMessage } from "../bot/messages";

export const inboundRouter = Router();

const inboundSchema = z.object({
  from: z.string().min(4),
  text: z.string(),
  messageId: z.string().nullable().optional(),
  replyToId: z.string().nullable().optional(),
});

inboundRouter.post("/inbound", requireRelaySecret, async (req, res) => {
  const parsed = inboundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: "INVALID_BODY", message: parsed.error.message } });
    return;
  }

  const payload = {
    from: parsed.data.from,
    text: parsed.data.text,
    messageId: parsed.data.messageId ?? null,
    replyToId: parsed.data.replyToId ?? null,
  };

  logMessage({
    phone: payload.from,
    direction: "inbound",
    text: payload.text,
    messageId: payload.messageId,
    replyToId: payload.replyToId,
  });

  let reply: string | null = null;
  try {
    reply = await handleInboundMessage(payload);
  } catch (err) {
    console.error("[inbound] handler error", err);
    reply = "Something jammed on our end. Try again in a sec.";
  }

  if (reply) {
    try {
      const sent = await sendWhatsAppMessage(payload.from, reply);
      logMessage({ phone: payload.from, direction: "outbound", text: reply, messageId: sent.id });
    } catch (err) {
      console.error("[inbound] failed to send reply via relay", err);
    }
  }

  res.json({ success: true, data: { handled: true } });
});
