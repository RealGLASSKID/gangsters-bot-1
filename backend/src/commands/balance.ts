import { Command } from "../types";
import { getUser } from "../database";
import { resolveTarget, displayId } from "../utils/target";

const balance: Command = {
  name: "balance",
  description: "Show Gang Coins (yours or @user)",
  usage: "!balance | !balance @user",
  aliases: ["bal", "wallet"],
  category: "economy",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx, ctx.from) || ctx.from;
    const user = getUser(target);
    if (!user) {
      await reply(target === ctx.from ? "No data yet." : `No data for @${displayId(target)}.`);
      return;
    }
    const total = user.coins + user.bank;
    const name = user.name || displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text = `💰 *${name}*\nWallet: ${user.coins} GC\nBank: ${user.bank} GC\nTotal: ${total} GC`;
    await reply(mentions ? { text, mentions } : text);
  },
};
export default balance;
