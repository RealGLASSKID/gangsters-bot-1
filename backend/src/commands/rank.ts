import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { fullRank, xpProgress } from "../ranking";

const rank: Command = {
  name: "rank",
  description: "Show your rank and XP",
  aliases: ["xp", "level"],
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
    const filled = Math.min(10, Math.round((progress.current / progress.needed) * 10));
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    await reply(
      `*${ctx.senderName}*\n${fullRank(user.level)}\nRank: #${position}\nLevel ${user.level}  |  ${user.xp.toLocaleString()} XP\n${bar} ${progress.current}/${progress.needed}\nMessages: ${user.message_count.toLocaleString()}`
    );
  },
};

export default rank;
