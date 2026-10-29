import { Command } from "../types";
import { getSocket } from "../bot";
import { config } from "../config";

/**
 * Owner (or admin) DM only → posts spicy pidgin gossip to the group.
 * Example: !gossip david is crushing on mary
 */
const gossip: Command = {
  name: "gossip",
  aliases: ["gist", "rumour", "rumor", "tea"],
  description: "DM the bot gossip; it posts pidgin tea to the group",
  usage: "!gossip <the gist>",
  ownerOnly: true,
  category: "owner",
  cooldown: 8,
  async execute(ctx, reply) {
    if (ctx.isGroup) {
      await reply(
        "🤫 Gossip no be for group command o.\n\n" +
          "DM me privately:\n" +
          "`!gossip david is crushing on mary`"
      );
      return;
    }

    const text = ctx.args.join(" ").trim();
    if (!text) {
      await reply(
        `😏 *Gossip / Gist*\n\n` +
          `DM me like:\n` +
          `\`!gossip david is crushing on mary\`\n\n` +
          `I go yarn am for the group for pidgin.`
      );
      return;
    }

    const sock = getSocket();
    if (!sock || !config.groupJid) {
      await reply("Bot no connect yet or GROUP_JID missing.");
      return;
    }

    const openers = [
      "Guy make una come hear gossip oh 😱",
      "Omo see gist wey just land 👀",
      "Una no hear wetin I hear? 🤭",
      "Hold on… make I drop small tea ☕😱",
      "Abeg gather here sharp sharp — gist alert 🚨",
      "E be like say something dey hot for this group oh 🔥",
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    const closers = ["😂", "💀", "👀", "🤭", "🔥", "😭", "😏"];
    const closer = closers[Math.floor(Math.random() * closers.length)];

    const payload =
      `╭━━━━━━━━━━━━━━━━━━╮\n` +
      `🗞️ *GIST HOUR*\n` +
      `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
      `${opener}\n\n` +
      `*${text}* ${closer}\n\n` +
      `_— Sandra spill the tea ☕_`;

    try {
      await sock.sendMessage(config.groupJid, { text: payload });
      await reply("😂 Gossip don enter group. I no know you o.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "send failed";
      await reply(`❌ Gist no gree post: ${msg}`);
    }
  },
};

export default gossip;
