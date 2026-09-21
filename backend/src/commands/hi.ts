import { Command } from "../types";

const hi: Command = {
  name: "hi",
  description: "Greet the bot",
  aliases: ["hello", "hey", "yo"],
  category: "general",
  cooldown: 3,
  async execute(ctx, reply) {
    const name = ctx.senderName || "gangster";
    const mention = ctx.from;
    await reply({
      text:
        `🔥 *GANGSTER BOT* 🔥\n` +
        `Yo wassup! 👋\n` +
        `Welcome to the gang, @${name}! 😎\n` +
        `I'm online and ready to work for you.\n` +
        `Type *!help* for commands.`,
      mentions: [mention],
    });
  },
};

export default hi;
