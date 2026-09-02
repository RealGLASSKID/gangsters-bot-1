import { getSocket } from "./bot";
import { config } from "./config";
import {
  getBirthdaysToday,
  getActiveGiveaway,
  getGiveawayEntries,
  endGiveaway,
} from "./database";
import { logger } from "./utils/logger";

let lastBirthdayCheck = "";

export function startScheduler() {
  setInterval(tick, 60_000);
  setTimeout(tick, 10_000);
  logger.info("Scheduler started");
}

async function tick() {
  const sock = getSocket();
  if (!sock) return;

  const today = new Date().toISOString().slice(0, 10);
  if (lastBirthdayCheck !== today) {
    lastBirthdayCheck = today;
    const bdays = getBirthdaysToday();
    for (const u of bdays) {
      const name = u.name || u.jid.split("@")[0];
      try {
        await sock.sendMessage(config.groupJid, {
          text: `🎂 Happy Birthday *${name}*! 🎉`,
          mentions: [u.jid],
        });
      } catch (err) {
        logger.error(err, "birthday message");
      }
    }
  }

  const g = getActiveGiveaway();
  if (g && g.ends_at <= Date.now()) {
    const entries = getGiveawayEntries(g.id);
    if (entries.length === 0) {
      endGiveaway(g.id, null);
      await sock.sendMessage(config.groupJid, {
        text: `🎁 Giveaway ended — no entries.\nPrize was: ${g.prize}`,
      });
    } else {
      const winner = entries[Math.floor(Math.random() * entries.length)];
      endGiveaway(g.id, winner);
      await sock.sendMessage(config.groupJid, {
        text: `🎁 *Giveaway ended!*\nPrize: ${g.prize}\nWinner: @${winner.split("@")[0]}\n(${entries.length} entries)`,
        mentions: [winner],
      });
    }
  }
}
