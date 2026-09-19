import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";
import { resolveTarget, displayId } from "../utils/target";

const profile: Command = {
  name: "profile",
  description: "Show profile (yours or @user)",
  usage: "!profile | !profile @user",
  aliases: ["mystats"],
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
    const total = user.coins + user.bank;
    const name = user.name || displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text =
      `👤 *${name}*\n` +
      `─────────────\n` +
      `${fullRank(user.level)}\n` +
      `Rank #${position}\n` +
      `Level: ${user.level}\n` +
      `XP: ${user.xp.toLocaleString()} (${progress.current}/${progress.needed})\n` +
      `Messages: ${user.message_count.toLocaleString()}\n` +
      `Coins: ${user.coins.toLocaleString()} GC (Bank: ${user.bank.toLocaleString()})\n` +
      `Total Wealth: ${total.toLocaleString()} GC\n` +
      `Rep: ${user.rep ?? 0}\n` +
      `Daily Streak: ${user.daily_streak} 🔥\n` +
      `Birthday: ${user.birthday || "not set"}\n` +
      `Joined: ${user.join_date.slice(0, 10)}`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default profile;
