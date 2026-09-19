import { Command } from "../types";
import { resolveTarget, displayId } from "../utils/target";

const TRUTHS = [
  // Funny / light
  "What is the most embarrassing thing you have ever done in public?",
  "Who was your first crush and what made you like them?",
  "What is one secret you have never told anyone in this group?",
  "Have you ever pretended to be sick just to skip school or work?",
  "What is the weirdest food combination you actually enjoy?",
  "Who in this group would you trust with your phone password?",
  "What is the most childish thing you still do?",
  "Have you ever lied about your age? Why?",
  "What is your biggest fear that people would laugh at?",
  "Who do you secretly think is the funniest person here?",
  // Nigerian flavour
  "Have you ever used 'network issue' as an excuse when you just didn't want to talk?",
  "What Naija food can you never refuse no matter how full you are?",
  "Have you ever danced to a song you claimed you hated?",
  "What is the most 'Naija parent' thing your parents have ever said to you?",
  "Have you ever pretended to understand a conversation in Yoruba/Igbo/Hausa when you didn't?",
  "What is one thing you do only when nobody is watching?",
  "Who in this group would survive longest in a 'no data' challenge?",
  "Have you ever sent a voice note and immediately regretted it?",
  "What is your most used WhatsApp sticker reply?",
  "Have you ever ghosted someone and later felt bad about it?",
];

const truth: Command = {
  name: "truth",
  description: "Random Truth (you or @user)",
  usage: "!truth | !truth @user",
  aliases: ["t"],
  category: "games",
  cooldown: 4,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx, ctx.from) || ctx.from;
    const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    const name = target === ctx.from ? ctx.senderName : displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text = `🗣️ *TRUTH* for *${name}*\n\n${q}\n\nAnswer honestly 👀`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default truth;
