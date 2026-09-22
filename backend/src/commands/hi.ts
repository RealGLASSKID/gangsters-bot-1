import { Command } from "../types";

const hi: Command = {
  name: "hi",
  description: "Greet Sandra (Gangster Bot)",
  aliases: ["hello", "hey", "yo"],
  category: "general",
  cooldown: 3,
  async execute(ctx, reply) {
    const name = ctx.senderName || "fam";
    await reply({
      text:
        `🔥 𝐆𝐀𝐍𝐆𝐒𝐓𝐄𝐑 𝐁𝐎𝐓 🔥\n\n` +
        `Hey *${name}* 👋\n\n` +
        `I'm *Sandra* — AKA *Gangster Bot* 😎🤖\n` +
        `Online, locked in, and ready to run things for the gang.\n\n` +
        `💡 Type *!help* to see how I can help you.\n` +
        `🎮 Games, ranks, fun & more — just ask.`,
      mentions: [ctx.from],
    });
  },
};

export default hi;
