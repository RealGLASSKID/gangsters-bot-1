import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

/** Verifies the shared secret the relay sends on inbound webhook calls. */
export function requireRelaySecret(req: Request, res: Response, next: NextFunction): void {
  if (!config.relayWebhookSecret) {
    next();
    return;
  }
  const header = req.headers["x-webhook-secret"];
  if (header !== config.relayWebhookSecret) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid webhook secret" } });
    return;
  }
  next();
}
