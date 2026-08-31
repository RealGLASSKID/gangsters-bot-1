import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

/**
 * Authenticates the Next.js dashboard server as a caller of this brain's
 * admin API. This is NOT per-human auth — the dashboard itself gates real
 * humans via Firebase Auth before it ever calls here; this key just proves
 * "this request came from our dashboard server," the same shape as the
 * relay's own API key check.
 */
export function requireDashboardKey(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const key = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!key || !config.dashboardApiKeys.has(key)) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing dashboard API key" } });
    return;
  }
  next();
}
