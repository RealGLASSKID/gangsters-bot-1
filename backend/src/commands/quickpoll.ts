import { Command } from "../types";
import { getSocket } from "../bot";
import { config } from "../config";

const quickpoll: Command = {
  name: "quickpoll",
  description: "Create a WhatsApp poll quickly (admin)",
  usage: "!quickpoll Question? | Option1 | Option2 | Option3",
  aliases: ["qp"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const raw = ctx.body.replace(/^(quickpoll|qp)\s*/i, "").trim();
    if (!raw.includes("|")) {
      await reply(
        "Usage:\n`!quickpoll Question? | Option1 | Option2 | Option3`\n\nExample:\n`!quickpoll Who is the finest? | Prince | David | Joel`"
      );
      return;
    }

    const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 3) {
      await reply("Need at least 1 question + 2 options.\nExample:\n`!quickpoll Best food? | Jollof | Amala | Pounded Yam`");
      return;
    }

    const question = parts[0];
    const options = parts.slice(1).slice(0, 12); // WhatsApp limit

    const sock = getSocket();
    if (!sock) {
      await reply("Bot is not connected right now.");
      return;
    }

    // Post poll in the configured group
    try {
      await sock.sendMessage(config.groupJid, {
        poll: {
          name: question,
          values: options,
          selectableCount: 1,
        },
      });
      await reply(`✅ Poll posted in the group:\n*${question}*`);
    } catch (err) {
      await reply("Failed to create poll. Make sure the bot is in the group and has permission.");
    }
  },
};

export default quickpoll;
