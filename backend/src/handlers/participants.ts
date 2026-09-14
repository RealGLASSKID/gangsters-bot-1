import { WASocket } from "@whiskeysockets/baileys";
import { config } from "../config";
import { logger } from "../utils/logger";
import { getSetting } from "../database";

function formatMessage(template: string, vars: { user: string; group: string; count: string }) {
  return template
    .replace(/\{user\}/gi, vars.user)
    .replace(/\{group\}/gi, vars.group)
    .replace(/\{count\}/gi, vars.count);
}

export function registerParticipantHandler(sock: WASocket) {
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.id !== config.groupJid) return;

      let subject = "the group";
      let size = 0;
      try {
        const meta = await sock.groupMetadata(config.groupJid);
        subject = meta.subject || subject;
        size = meta.participants?.length || 0;
      } catch {
        /* ignore */
      }

      for (const jid of update.participants) {
        const name = jid.split("@")[0];
        const mentionName = `@${name}`;

        if (update.action === "add") {
          const enabled = getSetting("welcome_enabled", "1") === "1";
          if (!enabled) continue;

          const template =
            getSetting(
              "welcome_message",
              `╭━━━━━━━━━━━━━━━━━━╮
🔥 WELCOME TO {group}
╰━━━━━━━━━━━━━━━━━━╯

Yo {user} 👋

Welcome to the gang.

🎮 Play games
🏆 Earn XP
😂 Have fun
📜 Read the rules

— GANGSTER BOT`
            );

          const text = formatMessage(template, {
            user: mentionName,
            group: subject,
            count: String(size),
          });

          await sock.sendMessage(config.groupJid, {
            text,
            mentions: [jid],
          });
        }

        if (update.action === "remove") {
          const enabled = getSetting("goodbye_enabled", "1") === "1";
          if (!enabled) continue;

          const template =
            getSetting(
              "goodbye_message",
              `🚪 {user} has left the GANG.

We move. 😭

Members remaining: {count}`
            );

          const text = formatMessage(template, {
            user: mentionName,
            group: subject,
            count: String(Math.max(0, size)),
          });

          await sock.sendMessage(config.groupJid, {
            text,
            mentions: [jid],
          });
        }
      }
    } catch (err) {
      logger.error(err, "participant handler");
    }
  });
}
