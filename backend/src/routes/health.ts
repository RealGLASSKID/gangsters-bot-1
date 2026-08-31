import { Router } from "express";

export const healthRouter = Router();
healthRouter.get("/", (_req, res) => {
  res.json({ success: true, data: { service: "gangster-bot-brain", status: "ok", time: Date.now() } });
});
