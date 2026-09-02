import { Command } from "../types";
import { withdraw, getUser } from "../database";

const withdrawCmd: Command = {
  name: "withdraw",
  description: "Withdraw coins from bank",
  usage: "!withdraw <amount|all>",
  cooldown: 3,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) { await reply("No data yet."); return; }
    let amount: number;
    if (ctx.args[0]?.toLowerCase() === "all") amount = user.bank;
    else amount = parseInt(ctx.args[0], 10);
    if (!amount || amount <= 0) { await reply("Usage: !withdraw <amount|all>"); return; }
    if (!withdraw(ctx.from, amount)) { await reply("Not enough coins in bank."); return; }
    await reply(`✅ Withdrew *${amount} GC* to wallet.`);
  },
};
export default withdrawCmd;
