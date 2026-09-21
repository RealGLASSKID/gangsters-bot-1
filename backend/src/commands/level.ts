import { Command } from "../types";
import { findUser } from "../database";
import { rankTitle, xpProgress } from "../ranking";
import { resolveTargetJid, displayId } from "../utils/target";

const level: Command = {
  name: "level",
  description: "Show level (yours or @user)",
  usage: "!level | !level @user",
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = await resolveTargetJid(ctx, ctx.from);
    const user = findUser(target);
    if (!user) {
      await reply(
        target === ctx.from || target === ctx.sender.primary
          ? "No data yet. Send a message first."
          : `No data for @${displayId(target)} yet.\nThey need to chat in the group once.`
      );
      return;
    }
    const { current, needed } = xpProgress(user.xp);
    const name = user.name || displayId(target);
    const mentions = ctx.mentionedJids[0] ? [ctx.mentionedJids[0]] : undefined;
    const text = `*${name}*\nLevel ${user.level} (${rankTitle(user.level)})\n${current}/${needed} XP to next level`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default level;
