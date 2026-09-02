import { Command } from "../types";
import { claimDaily, ensureUser } from "../database";

const daily: Command = {
  name: "daily",
  description: "Claim daily Gang Coins",
  cooldown: 5,
  async execute(ctx, reply) {
    ensureUser(ctx.from, ctx.senderName);
    const result = claimDaily(ctx.from);
    if (!result) { await reply("You already claimed today. Come back tomorrow."); return; }
    await reply(`🎁 Daily reward: *${result.amount} GC*\nStreak: ${result.streak} day${result.streak > 1 ? "s" : ""}`);
  },
};
export default daily;
