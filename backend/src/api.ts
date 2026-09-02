import express from "express";
import {
  db,
  getLeaderboard,
  getCoinLeaderboard,
  getRepLeaderboard,
  getActiveGiveaway,
  getGiveawayEntries,
} from "./database";
import { getSocket } from "./bot";
import { config } from "./config";
import { getAllCommands } from "./commands";

export function startApi(port = Number(process.env.PORT) || 3001) {
  const app = express();
  app.use(express.json());

  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.get("/api/health", (_req, res) => {
    const sock = getSocket();
    res.json({
      ok: true,
      bot: config.botName,
      connected: !!(sock && sock.user),
      groupJid: config.groupJid,
    });
  });

  app.get("/api/stats", (_req, res) => {
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

  app.get("/api/leaderboard/xp", (_req, res) => {
    const rows = getLeaderboard(15).map((u) => ({
      name: u.name || u.jid.split("@")[0],
      level: u.level,
      xp: u.xp,
      messages: u.message_count,
    }));
    res.json(rows);
  });

  app.get("/api/leaderboard/coins", (_req, res) => {
    const rows = getCoinLeaderboard(15).map((u) => ({
      name: u.name || u.jid.split("@")[0],
      coins: u.coins,
      bank: u.bank,
      total: u.coins + u.bank,
    }));
    res.json(rows);
  });

  app.get("/api/leaderboard/rep", (_req, res) => {
    const rows = getRepLeaderboard(15).map((u) => ({
      name: u.name || u.jid.split("@")[0],
      rep: u.rep,
    }));
    res.json(rows);
  });

  app.get("/api/giveaway", (_req, res) => {
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

  app.get("/api/commands", (_req, res) => {
    res.json(
      getAllCommands().map((c) => ({
        name: c.name,
        description: c.description,
        usage: c.usage || null,
        adminOnly: !!c.adminOnly,
        ownerOnly: !!c.ownerOnly,
      }))
    );
  });

  app.listen(port, () => {
    console.log(`[API] http://localhost:${port}`);
  });
}
