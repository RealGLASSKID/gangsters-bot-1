import { Command } from "../types";
import { getUser } from "../database";

const bank: Command = {
  name: "bank",
  description: "Show bank balance",
  cooldown: 3,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) { await reply("No data yet."); return; }
    await reply(`🏦 Bank: *${user.bank} GC*\nWallet: ${user.coins} GC`);
  },
};
export default bank;
