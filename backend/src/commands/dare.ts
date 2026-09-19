import { Command } from "../types";
import { resolveTarget, displayId } from "../utils/target";

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
  "Post a throwback picture or describe one in detail.",
  "Do your best impression of a Nollywood actor in a voice note.",
  "Send the last photo in your gallery (as long as it's appropriate).",
  "Write a short motivational speech for the group.",
  "Challenge someone to a !rps battle right now.",
  "Tell the group your most embarrassing 'network issue' moment.",
  "Act like a radio presenter and introduce the next song you would play.",
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
    const text = `🔥 *DARE* for *${name}*

${q}

No backing out 😂`;
    await reply(mentions ? { text, mentions } : text);
  },
};

export default dare;
