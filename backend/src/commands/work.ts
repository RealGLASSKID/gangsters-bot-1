import { Command } from "../types";
import { addCoins, ensureUser } from "../database";
import { randomWorkPay } from "../economy";

const JOBS = ["ran a corner hustle", "collected debts", "moved product", "drove the getaway", "watched the stash house", "negotiated a deal"];

const work: Command = {
  name: "work",
  description: "Work for Gang Coins",
  cooldown: 300,
  async execute(ctx, reply) {
    ensureUser(ctx.from, ctx.senderName);
    const pay = randomWorkPay();
    addCoins(ctx.from, pay);
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    await reply(`💼 You ${job} and earned *${pay} GC*`);
  },
};
export default work;
