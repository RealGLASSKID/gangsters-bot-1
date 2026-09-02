import { Command } from "../types";
import { getUser } from "../database";
import { rankTitle, xpProgress } from "../ranking";

const level: Command = {
  name: "level",
  description: "Show your level",
  cooldown: 5,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) {
      await reply("No data yet. Send a message first.");
      return;
    }
    const { current, needed } = xpProgress(user.xp);
    await reply(`*${ctx.senderName}*\nLevel ${user.level} (${rankTitle(user.level)})\n${current}/${needed} XP to next level`);
  },
};

export default level;
