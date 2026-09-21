import { Command } from "../types";
import { findUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";
import { resolveTargetJid, displayId } from "../utils/target";

const profile: Command = {
  name: "profile",
  description: "Show profile (yours or @user)",
  usage: "!profile | !profile @user",
  aliases: ["mystats"],
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
    const total = user.coins + user.bank;
    const name = user.name || displayId(target);
    const mentions = ctx.mentionedJids[0] ? [ctx.mentionedJids[0]] : undefined;
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
