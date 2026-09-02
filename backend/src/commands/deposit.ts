import { Command } from "../types";
import { deposit, getUser } from "../database";

const depositCmd: Command = {
  name: "deposit",
  description: "Deposit coins to bank",
  usage: "!deposit <amount|all>",
  cooldown: 3,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user) { await reply("No data yet."); return; }
    let amount: number;
    if (ctx.args[0]?.toLowerCase() === "all") amount = user.coins;
    else amount = parseInt(ctx.args[0], 10);
    if (!amount || amount <= 0) { await reply("Usage: !deposit <amount|all>"); return; }
    if (!deposit(ctx.from, amount)) { await reply("Not enough coins in wallet."); return; }
    await reply(`✅ Deposited *${amount} GC* to bank.`);
  },
};
export default depositCmd;
