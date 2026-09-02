import { WASocket } from "@whiskeysockets/baileys";
import { config } from "../config";
import { logger } from "../utils/logger";

export function registerParticipantHandler(sock: WASocket) {
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.id !== config.groupJid) return;

      for (const jid of update.participants) {
        const name = jid.split("@")[0];

        if (update.action === "add") {
          await sock.sendMessage(config.groupJid, {
            text:
              `👋 Welcome @${name} to the gang!\n` +
              `Type *!help* to see commands.\n` +
              `Earn XP by chatting, claim *!daily*, and climb the ranks.`,
            mentions: [jid],
          });
        }

        if (update.action === "remove") {
          await sock.sendMessage(config.groupJid, {
            text: `👋 ${name} left the group. Respect.`,
          });
        }
      }
    } catch (err) {
      logger.error(err, "participant handler");
    }
  });
}
