import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";

const profile: Command = {
  name: "profile",
  description: "Show your full profile",
  aliases: ["mystats"],
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) {
      await reply("No data yet. Send a message first.");
      return;
    }
    const progress = xpProgress(user.xp);
    const position = getUserRank(ctx.from);
    const total = user.coins + user.bank;
    await reply(
      `👤 *${user.name || ctx.senderName}*\n` +
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
      `Joined: ${user.join_date.slice(0, 10)}`
    );
  },
};

export default profile;
