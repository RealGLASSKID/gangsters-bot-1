import express, { NextFunction, Request, Response } from "express";
import {
  db,
  getLeaderboard,
  getCoinLeaderboard,
  getRepLeaderboard,
  getActiveGiveaway,
  getGiveawayEntries,
  listUsers,
  setUserXp,
  setUserLevel,
  setUserCoins,
  addCoins,
  ensureUser,
  getUser,
} from "./database";
import { getSession, relinkWhatsApp } from "./bot";
import { config, dashboardConfig } from "./config";
import { getAllCommands } from "./commands";
import { firebaseReady, verifyIdToken } from "./auth/firebase";

type AuthedRequest = Request & { adminEmail?: string | null };

async function requireDashboardAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (dashboardConfig.devBypass) {
    req.adminEmail = "dev@localhost";
    next();
    return;
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }

  try {
    const user = await verifyIdToken(token);
    req.adminEmail = user.email;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    res.status(401).json({ error: message });
  }
}

export function startApi(port = Number(process.env.PORT) || 4000) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    const origin = req.headers.origin || "";
    const allowed =
      dashboardConfig.origin === "*" ||
      !dashboardConfig.origin ||
      origin === dashboardConfig.origin ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (allowed && origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else if (dashboardConfig.origin === "*" || !dashboardConfig.origin) {
      res.header("Access-Control-Allow-Origin", "*");
    } else {
      res.header("Access-Control-Allow-Origin", dashboardConfig.origin);
    }
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    const session = getSession();
    res.json({
      ok: true,
      bot: config.botName,
      connected: session.connected,
      status: session.status,
      groupJid: config.groupJid,
      firebase: firebaseReady() || dashboardConfig.devBypass,
    });
  });

  app.get("/api/stats", requireDashboardAuth, (_req, res) => {
    const users = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
    const messages = db.prepare("SELECT SUM(message_count) AS c FROM users").get() as {
      c: number | null;
    };
    const coins = db.prepare("SELECT SUM(coins + bank) AS c FROM users").get() as {
      c: number | null;
    };
    res.json({
      members: users.c,
      totalMessages: messages.c || 0,
      totalCoins: coins.c || 0,
    });
  });

  app.get("/api/leaderboard/xp", requireDashboardAuth, (_req, res) => {
    res.json(
      getLeaderboard(15).map((u) => ({
        name: u.name || u.jid.split("@")[0],
        level: u.level,
        xp: u.xp,
        messages: u.message_count,
      }))
    );
  });

  app.get("/api/leaderboard/coins", requireDashboardAuth, (_req, res) => {
    res.json(
      getCoinLeaderboard(15).map((u) => ({
        name: u.name || u.jid.split("@")[0],
        coins: u.coins,
        bank: u.bank,
        total: u.coins + u.bank,
      }))
    );
  });

  app.get("/api/leaderboard/rep", requireDashboardAuth, (_req, res) => {
    res.json(
      getRepLeaderboard(15).map((u) => ({
        name: u.name || u.jid.split("@")[0],
        rep: u.rep,
      }))
    );
  });

  app.get("/api/giveaway", requireDashboardAuth, (_req, res) => {
    const g = getActiveGiveaway();
    if (!g) {
      res.json(null);
      return;
    }
    res.json({
      id: g.id,
      prize: g.prize,
      endsAt: g.ends_at,
      entries: getGiveawayEntries(g.id).length,
    });
  });

  app.get("/api/commands", requireDashboardAuth, (_req, res) => {
    res.json(
      getAllCommands().map((c) => ({
        name: c.name,
        description: c.description,
        usage: c.usage || null,
        adminOnly: !!c.adminOnly,
        ownerOnly: !!c.ownerOnly,
        category: c.category || (c.ownerOnly ? "owner" : c.adminOnly ? "admin" : "general"),
      }))
    );
  });

  app.get("/api/members", requireDashboardAuth, (_req, res) => {
    res.json(
      listUsers(200).map((u) => ({
        jid: u.jid,
        name: u.name || u.jid.split("@")[0],
        level: u.level,
        xp: u.xp,
        coins: u.coins,
        bank: u.bank,
        messages: u.message_count,
        rep: u.rep ?? 0,
        lastActive: u.last_active,
      }))
    );
  });

  app.post("/api/members/xp", requireDashboardAuth, (req, res) => {
    const jid = String(req.body?.jid || "").trim();
    const xp = Number(req.body?.xp);
    if (!jid || Number.isNaN(xp)) {
      res.status(400).json({ error: "jid and xp required" });
      return;
    }
    res.json({ ok: true, user: setUserXp(jid, xp) });
  });

  app.post("/api/members/level", requireDashboardAuth, (req, res) => {
    const jid = String(req.body?.jid || "").trim();
    const level = Number(req.body?.level);
    if (!jid || Number.isNaN(level)) {
      res.status(400).json({ error: "jid and level required" });
      return;
    }
    res.json({ ok: true, user: setUserLevel(jid, level) });
  });

  app.post("/api/members/coins", requireDashboardAuth, (req, res) => {
    const jid = String(req.body?.jid || "").trim();
    const mode = String(req.body?.mode || "set");
    const amount = Number(req.body?.amount);
    if (!jid || Number.isNaN(amount)) {
      res.status(400).json({ error: "jid and amount required" });
      return;
    }
    ensureUser(jid);
    if (mode === "add") addCoins(jid, Math.floor(amount));
    else setUserCoins(jid, amount, req.body?.bank !== undefined ? Number(req.body.bank) : undefined);
    res.json({ ok: true, user: getUser(jid) });
  });

  app.get("/api/session", requireDashboardAuth, (req: AuthedRequest, res) => {
    const session = getSession();
    res.json({
      ...session,
      bot: config.botName,
      groupJid: config.groupJid,
      adminEmail: req.adminEmail || null,
      firebaseReady: firebaseReady() || dashboardConfig.devBypass,
    });
  });

  app.post("/api/session/relink", requireDashboardAuth, async (_req, res) => {
    try {
      const session = await relinkWhatsApp();
      res.json({ ok: true, session });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Relink failed",
      });
    }
  });

  app.listen(port, () => {
    console.log(`[API] http://localhost:${port}`);
    if (dashboardConfig.devBypass) {
      console.warn("[API] DASHBOARD_DEV_BYPASS=1 — dashboard auth is off");
    } else if (!firebaseReady()) {
      console.warn(
        "[API] Firebase Admin not configured. Set DASHBOARD_DEV_BYPASS=1 for local dashboard."
      );
    }
  });
}
