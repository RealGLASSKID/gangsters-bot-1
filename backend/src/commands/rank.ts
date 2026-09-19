import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";
import { resolveTarget, displayId } from "../utils/target";

const rank: Command = {
  name: "rank",
  description: "Show rank and XP (yours or @user)",
  usage: "!rank | !rank @user",
  aliases: ["xp"],
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx, ctx.from) || ctx.from;
    const user = getUser(target);
    if (!user) {
      await reply(
        target === ctx.from
          ? "No data yet. Send a message first."
          : `No data for @${displayId(target)} yet.`
      );
      return;
    }
    const progress = xpProgress(user.xp);
    const position = getUserRank(target);
    const filled = Math.min(10, Math.round((progress.current / progress.needed) * 10));
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    const name = user.name || displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text =
      `*${name}*\n${fullRank(user.level)}\nRank: #${position}\n` +
      `Level ${user.level}  |  ${user.xp.toLocaleString()} XP\n` +
      `${bar} ${progress.current}/${progress.needed}\n` +
      `Messages: ${user.message_count.toLocaleString()}`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default rank;
