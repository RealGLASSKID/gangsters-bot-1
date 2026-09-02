import { Command } from "../types";
import { getUser, removeCoins, addCoins, ensureUser } from "../database";

const dice: Command = {
  name: "dice",
  description: "Roll dice — guess 1-6",
  usage: "!dice <1-6> <amount>",
  cooldown: 5,
  async execute(ctx, reply) {
    const guess = parseInt(ctx.args[0], 10);
    const amount = parseInt(ctx.args[1], 10);
    if (!guess || guess < 1 || guess > 6 || !amount || amount <= 0) {
      await reply("Usage: !dice <1-6> <amount>");
      return;
    }
    ensureUser(ctx.from, ctx.senderName);
    const user = getUser(ctx.from)!;
    if (user.coins < amount) { await reply("Not enough coins."); return; }
    const roll = 1 + Math.floor(Math.random() * 6);
    if (roll === guess) {
      const win = amount * 4;
      addCoins(ctx.from, win);
      await reply(`🎲 Rolled *${roll}*! You won *${win} GC*`);
    } else {
      removeCoins(ctx.from, amount);
      await reply(`🎲 Rolled *${roll}*. You lost *${amount} GC*`);
    }
  },
};
export default dice;
