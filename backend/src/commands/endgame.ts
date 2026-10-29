import { Command } from "../types";
import { getSession, clearSession } from "../games";

const endgame: Command = {
  name: "endgame",
  aliases: ["stopgame", "cleargame", "cancelgame", "stopg", "forceend"],
  description: "Force-end any active game (emoji, trivia, sticker battle, etc.)",
  usage: "!endgame",
  category: "games",
  cooldown: 2,
  async execute(_ctx, reply) {
    const session = getSession();
    if (!session) {
      await reply("No active game right now.\nStart one with `!games`.");
      return;
    }
    const type = session.type;
    clearSession();
    await reply(
      `✅ Ended active game: *${type}*\n\n` +
        `You can start a new one now.\n` +
        `\`!stickerbattle @a @b\` · \`!emoji\` · \`!trivia\``
    );
  },
};

export default endgame;
