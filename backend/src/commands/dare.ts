import { Command } from "../types";
import { resolveTarget, displayId } from "../utils/target";

const DARES = [
  // Chat / text dares
  "Send a voice note singing the chorus of any Afrobeats song.",
  "Change your WhatsApp status to something funny for the next 1 hour.",
  "Send a random appropriate meme to the group right now.",
  "Type your next 3 messages using only emojis.",
  "Compliment the last 3 people who spoke in the group.",
  "Say 'I am the funniest person in this group' in a voice note with full confidence.",
  "Send your most used WhatsApp sticker.",
  "Write a short poem about jollof rice and send it.",
  "Tag someone and tell them why they are a legend.",
  "Speak only in Pidgin for your next 5 messages.",
  "Send a funny childhood story in a voice note.",
  "Make up a fake 'breaking news' about someone in the group (keep it clean).",
  "Describe a throwback photo in detail as if we can see it.",
  "Do your best impression of a Nollywood actor in a voice note.",
  "Write a short motivational speech for the group.",
  "Challenge someone to a !rps battle right now.",
  "Tell the group your most embarrassing 'network issue' moment.",
  "Act like a radio presenter and introduce the next song you would play.",
  "Send a voice note counting from 1 to 20 in your funniest accent.",
  "Write a 4-line rap about this group.",

  // Group energy
  "Tag 2 people and start a mini roast battle (keep it friendly).",
  "Confess one harmless secret to the group.",
  "Post your best pickup line (clean) in the chat.",
  "Describe your morning routine like it's a movie trailer.",
  "Make the group choose: you send a funny selfie description OR a voice note joke.",
  "Invent a new nickname for someone and use it for the next 10 messages.",
  "Send a voice note saying a tongue-twister three times fast.",
  "Tell a joke. If nobody laughs (reacts), send another one.",
  "Rate the last 3 messages in the chat out of 10 with reasons.",
  "Start a chain: write one sentence of a story — next person continues.",

  // Naija spice
  "Argue for 30 seconds (voice note) why your state has the best food.",
  "Translate this to Pidgin out loud (voice note): 'I will be there in five minutes.'",
  "Name 5 Naija street foods without pausing (voice note).",
  "Do a fake 'mama/papa calling you' voice note drama.",
  "Explain offside rule OR jollof ownership debate — your choice — in 20 seconds.",
  "Send a voice note as if you are stuck in Lagos traffic.",
  "Give a weather report for your area in full radio-presenter mode.",
  "Promote a fake product like a TV advert (voice note).",
  "Say a proverb and explain it like you're teaching a class.",
  "Act like a football commentator describing someone typing in the group.",

  // Mild challenge
  "Don't use the letter 'E' in your next 3 messages.",
  "Reply to the next 5 messages only with questions.",
  "Let the group give you a dare for your next status update.",
  "Send a voice note of you trying not to laugh while saying something serious.",
  "Write your bio in the most dramatic Nollywood way possible.",
  "Pick someone and host a mini !truth round for them.",
  "Describe your dream house using only food comparisons.",
  "Make a toast (short speech) to the group like it's New Year.",
  "Share one tip that actually improved your life.",
  "End every message with 'periodt' for the next 5 messages.",
];

const dare: Command = {
  name: "dare",
  description: "Random Dare (you or @user)",
  usage: "!dare | !dare @user",
  aliases: ["d"],
  category: "games",
  cooldown: 4,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx, ctx.from) || ctx.from;
    const q = DARES[Math.floor(Math.random() * DARES.length)];
    const name = target === ctx.from ? ctx.senderName : displayId(target);
    const mentions = target !== ctx.from ? [target] : undefined;
    const text = `🔥 *DARE* for *${name}*\n\n${q}\n\nNo backing out 😂`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default dare;
