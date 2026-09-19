import { Command } from "../types";
import { getUser } from "../database";
import { rankTitle, xpProgress } from "../ranking";
import { resolveTarget, displayId } from "../utils/target";

const level: Command = {
  name: "level",
  description: "Show level (yours or @user)",
  usage: "!level | !level @user",
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
    const { current, needed } = xpProgress(user.xp);
    const name = user.name || displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text = `*${name}*\nLevel ${user.level} (${rankTitle(user.level)})\n${current}/${needed} XP to next level`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default level;
