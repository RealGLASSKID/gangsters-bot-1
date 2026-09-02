import { Command } from "../types";
import { getUser } from "../database";

const balance: Command = {
  name: "balance",
  description: "Show your Gang Coins",
  cooldown: 3,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) { await reply("No data yet."); return; }
    const total = user.coins + user.bank;
    await reply(`💰 *${ctx.senderName}*\nWallet: ${user.coins} GC\nBank: ${user.bank} GC\nTotal: ${total} GC`);
  },
};
export default balance;
