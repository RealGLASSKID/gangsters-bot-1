import { Command } from "../types";
import { resolveTarget, displayId } from "../utils/target";

const TRUTHS = [
  // Light / funny
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
  "What is the last lie you told (keep it light)?",
  "Have you ever stalked someone's WhatsApp last seen?",
  "What song do you play on repeat when nobody is around?",
  "Have you ever laughed at a serious moment and couldn't stop?",
  "What is your most used emoji and why?",
  "Have you ever sent a message to the wrong person?",
  "What is one fashion choice you regret?",
  "Who in this group has the best vibe?",
  "Have you ever pretended to know a song lyrics and failed?",
  "What is your guilty pleasure TV show or movie?",

  // Naija flavour
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
  "Jollof: party jollof or home jollof — and why?",
  "Have you ever argued about football like it was a court case?",
  "What is the longest you've stayed on data because of a group chat?",
  "Have you ever said 'I'm almost there' when you hadn't left the house?",
  "Who in this group is most likely to start a voice-note essay?",
  "What Naija slang do you overuse?",
  "Have you ever bought something online and regretted it the same day?",
  "Church, mosque, or both — be honest about last Sunday.",
  "Have you ever used 'power failure' as cover for something else?",
  "What is your biggest 'Lagos/Abuja/PH traffic' trauma story?",

  // Deeper but still safe
  "What is one goal you are quietly working on?",
  "Who inspires you the most in real life?",
  "What is something you wish people asked you more often?",
  "When was the last time you felt truly proud of yourself?",
  "What habit are you trying to break?",
  "Who in this group would you call at 2am if you needed help?",
  "What is a compliment you still remember years later?",
  "What does a perfect weekend look like for you?",
  "Have you ever had a dream so wild you told people about it?",
  "What is one thing money can't buy that you value most?",
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
