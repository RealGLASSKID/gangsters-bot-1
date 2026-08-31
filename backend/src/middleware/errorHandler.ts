import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[error]", err);
  const message = err instanceof Error ? err.message : "Internal error";
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message } });
}
