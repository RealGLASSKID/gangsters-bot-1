import { Command } from "../types";
import { findUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";
import { resolveTargetJid, displayId } from "../utils/target";

const rank: Command = {
  name: "rank",
  description: "Show rank and XP (yours or @user)",
  usage: "!rank | !rank @user",
  aliases: ["xp"],
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = await resolveTargetJid(ctx, ctx.from);
    const user = findUser(target);
    if (!user) {
      await reply(
        target === ctx.from || target === ctx.sender.primary
          ? "No data yet. Send a message first."
          : `No data for @${displayId(target)} yet.\nThey need to chat in the group once so the bot can save their profile.`
      );
      return;
    }
    const progress = xpProgress(user.xp);
    const position = getUserRank(user.jid);
    const filled = Math.min(10, Math.round((progress.current / progress.needed) * 10));
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    const name = user.name || displayId(target);
    const mentions = ctx.mentionedJids[0] ? [ctx.mentionedJids[0]] : undefined;
    const text =
      `*${name}*\n${fullRank(user.level)}\nRank: #${position}\n` +
      `Level ${user.level}  |  ${user.xp.toLocaleString()} XP\n` +
      `${bar} ${progress.current}/${progress.needed}\n` +
      `Messages: ${user.message_count.toLocaleString()}`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default rank;
