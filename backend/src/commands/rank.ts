import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { rankTitle, xpProgress } from "../ranking";

const rank: Command = {
  name: "rank",
  description: "Show your rank and XP",
  cooldown: 5,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) {
      await reply("No data yet. Send a message first.");
      return;
    }
    const progress = xpProgress(user.xp);
    const position = getUserRank(ctx.from);
    const title = rankTitle(user.level);
    const filled = Math.min(10, Math.round((progress.current / progress.needed) * 10));
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    await reply(
      `*${ctx.senderName}*\nRank: #${position} · ${title}\nLevel ${user.level}  |  ${user.xp} XP\n${bar} ${progress.current}/${progress.needed}\nMessages: ${user.message_count}`
    );
  },
};

export default rank;
