import { Command } from "../types";
import { transferCoins, ensureUser } from "../database";
import { parseTarget } from "../utils/target";

const give: Command = {
  name: "give",
  description: "Give coins to someone",
  usage: "!give <number> <amount>",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    const amount = parseInt(ctx.args[ctx.args.length - 1], 10);

    if (!target || !amount || amount <= 0) {
      await reply("Usage: !give <number> <amount>\nExample: !give 2348012345678 50");
      return;
    }
    if (target === ctx.from) {
      await reply("Can't give to yourself.");
      return;
    }

    ensureUser(target);
    if (!transferCoins(ctx.from, target, amount)) {
      await reply("Not enough coins.");
      return;
    }
    await reply(`✅ Sent *${amount} GC* to ${target.split("@")[0]}`);
  },
};

export default give;
