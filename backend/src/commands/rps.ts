import { Command } from "../types";
import { addCoins, ensureUser } from "../database";

const CHOICES = ["rock", "paper", "scissors"] as const;
type Choice = (typeof CHOICES)[number];
const BEATS: Record<Choice, Choice> = { rock: "scissors", paper: "rock", scissors: "paper" };

const rps: Command = {
  name: "rps",
  description: "Rock Paper Scissors",
  usage: "!rps <rock|paper|scissors>",
  cooldown: 5,
  async execute(ctx, reply) {
    const pick = ctx.args[0]?.toLowerCase() as Choice | undefined;
    if (!pick || !CHOICES.includes(pick)) { await reply("Usage: !rps <rock|paper|scissors>"); return; }
    const bot = CHOICES[Math.floor(Math.random() * 3)];
    ensureUser(ctx.from, ctx.senderName);
    if (pick === bot) { await reply(`🤝 Tie! Both chose *${pick}*`); return; }
    if (BEATS[pick] === bot) {
      addCoins(ctx.from, 20);
      await reply(`✅ You win! You: *${pick}* · Bot: *${bot}*\n+20 GC`);
    } else {
      await reply(`❌ You lose. You: *${pick}* · Bot: *${bot}*`);
    }
  },
};
export default rps;
