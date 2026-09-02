import { Command } from "../types";
import { getUser, getUserRank } from "../database";
import { rankTitle, xpProgress } from "../ranking";

const profile: Command = {
  name: "profile",
  description: "Show your full profile",
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
      `👤 *${user.name || ctx.senderName}*\n─────────────\nRank #${position} · ${rankTitle(user.level)}\nLevel: ${user.level}\nXP: ${user.xp} (${progress.current}/${progress.needed})\nMessages: ${user.message_count}\nCoins: ${user.coins} GC (bank ${user.bank})\nTotal: ${total} GC\nRep: ${user.rep ?? 0}\nDaily streak: ${user.daily_streak}\nBirthday: ${user.birthday || "not set"}\nJoined: ${user.join_date.slice(0, 10)}`
    );
  },
};

export default profile;
