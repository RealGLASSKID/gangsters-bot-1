import { Command } from "../types";
import { getSocket } from "../bot";
import { config } from "../config";

/**
 * Owner-only, PRIVATE CHAT only.
 * Bot posts the announcement into the configured group.
 */
const announcement: Command = {
  name: "announcement",
  aliases: ["announce", "ann", "broadcast"],
  description: "DM the bot to post an announcement in the group (owner only)",
  usage: "!announcement <message>",
  ownerOnly: true,
  category: "owner",
  cooldown: 5,
  async execute(ctx, reply) {
    if (ctx.isGroup) {
      await reply(
        "❌ No be here o.\n\n" +
          "Chat me *privately* (DM) with:\n" +
          "`!announcement Your message`\n\n" +
          "Na only for private chat I go drop am for the group."
      );
      return;
    }

    const text = ctx.args.join(" ").trim();
    if (!text) {
      await reply(
        `📢 *Announcement* (private only)\n\n` +
          `Message me like this:\n` +
          `\`!announcement Meeting tonight by 9. Make una dey around.\`\n\n` +
          `I go post am for the group.`
      );
      return;
    }

    const sock = getSocket();
    if (!sock || !config.groupJid) {
      await reply("Bot no connect yet or GROUP_JID missing.");
      return;
    }

    const payload =
      `╭━━━━━━━━━━━━━━━━━━╮\n` +
      `📢 *GROUP ANNOUNCEMENT*\n` +
      `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
      `${text}\n\n` +
      `_— Admin / Sandra_`;

    try {
      await sock.sendMessage(config.groupJid, { text: payload });
      await reply("✅ Announcement don land for the group.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "send failed";
      await reply(`❌ I no fit post am: ${msg}`);
    }
  },
};

export default announcement;
