import { Command } from "../types";
import { findUser } from "../database";
import { resolveTargetJid, displayId } from "../utils/target";

const balance: Command = {
  name: "balance",
  description: "Show Gang Coins (yours or @user)",
  usage: "!balance | !balance @user",
  aliases: ["bal", "wallet"],
  category: "economy",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = await resolveTargetJid(ctx, ctx.from);
    const user = findUser(target);
    if (!user) {
      await reply(
        target === ctx.from || target === ctx.sender.primary
          ? "No data yet."
          : `No data for @${displayId(target)}.\nThey need to chat in the group once.`
      );
      return;
    }
    const total = user.coins + user.bank;
    const name = user.name || displayId(target);
    const mentions = ctx.mentionedJids[0] ? [ctx.mentionedJids[0]] : undefined;
    const text = `💰 *${name}*\nWallet: ${user.coins} GC\nBank: ${user.bank} GC\nTotal: ${total} GC`;
    await reply(mentions ? { text, mentions } : text);
  },
};
export default balance;
