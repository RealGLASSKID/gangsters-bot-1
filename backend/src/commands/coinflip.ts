import { Command } from "../types";
import { getUser, removeCoins, addCoins, ensureUser } from "../database";

const coinflip: Command = {
  name: "coinflip",
  description: "Bet on heads or tails",
  usage: "!coinflip <heads|tails> <amount>",
  cooldown: 5,
  async execute(ctx, reply) {
    const side = ctx.args[0]?.toLowerCase();
    const amount = parseInt(ctx.args[1], 10);
    if (!side || !["heads", "tails", "h", "t"].includes(side) || !amount || amount <= 0) {
      await reply("Usage: !coinflip <heads|tails> <amount>");
      return;
    }
    ensureUser(ctx.from, ctx.senderName);
    const user = getUser(ctx.from)!;
    if (user.coins < amount) { await reply("Not enough coins."); return; }
    const choice = side.startsWith("h") ? "heads" : "tails";
    const result = Math.random() < 0.5 ? "heads" : "tails";
    if (choice === result) {
      addCoins(ctx.from, amount);
      await reply(`🪙 ${result.toUpperCase()}! You won *${amount} GC*`);
    } else {
      removeCoins(ctx.from, amount);
      await reply(`🪙 ${result.toUpperCase()}! You lost *${amount} GC*`);
    }
  },
};
export default coinflip;
