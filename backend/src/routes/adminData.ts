import { Router } from "express";
import { listRecentSessions } from "../bot/sessions";
import { listRecentMessages } from "../bot/messages";

export const sessionsRouter = Router();
sessionsRouter.get("/", (_req, res) => {
  res.json({ success: true, data: listRecentSessions() });
});

export const messagesRouter = Router();
messagesRouter.get("/", (_req, res) => {
  res.json({ success: true, data: listRecentMessages() });
});
