import { Command } from "../types";

const TRUTHS = [
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
  "Have you ever used 'network issue' as an excuse when you just didn't want to talk?",
  "What Naija food can you never refuse no matter how full you are?",
  "Have you ever danced to a song you claimed you hated?",
  "What is the most 'Naija parent' thing your parents have ever said to you?",
  "Have you ever pretended to understand a conversation in Yoruba/Igbo/Hausa when you didn't?",
];

const DARES = [
  "Send a voice note singing the chorus of any Afrobeats song.",
  "Change your WhatsApp status to something funny for the next 1 hour.",
  "Send a random meme to the group right now.",
  "Type a message using only emojis for your next 3 replies.",
  "Compliment the last 3 people who spoke in the group.",
  "Do a 10-second dance and describe it in text (or send a voice note).",
  "Say 'I am the funniest person in this group' in a voice note with full confidence.",
  "Send your most used WhatsApp sticker.",
  "Write a short poem about jollof rice and send it.",
  "Tag someone and tell them why they are a legend.",
  "Speak only in Pidgin for your next 5 messages.",
  "Send a funny childhood story in voice note.",
  "Make up a fake 'breaking news' about someone in the group (keep it clean).",
  "Do your best impression of a Nollywood actor in a voice note.",
  "Challenge someone to a !rps battle right now.",
];

const tod: Command = {
  name: "tod",
  description: "Truth or Dare (random)",
  aliases: ["truthordare"],
  category: "games",
  cooldown: 4,
  async execute(ctx, reply) {
    const choice = Math.random() < 0.5 ? "truth" : "dare";
    if (choice === "truth") {
      const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
      await reply(`🗣️ *TRUTH* for *${ctx.senderName}*\n\n${q}`);
    } else {
      const q = DARES[Math.floor(Math.random() * DARES.length)];
      await reply(`🔥 *DARE* for *${ctx.senderName}*\n\n${q}`);
    }
  },
};

export default tod;
