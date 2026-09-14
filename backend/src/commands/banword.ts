import { Command } from "../types";
import { addBannedWord, removeBannedWord, listBannedWords } from "../database";

const banword: Command = {
  name: "banword",
  description: "Manage banned words",
  usage: "!banword add word | !banword remove word | !banword list",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const sub = (ctx.args[0] || "").toLowerCase();
    const word = ctx.args.slice(1).join(" ").trim();

    if (sub === "add") {
      if (!word) {
        await reply("Usage: `!banword add badword`");
        return;
      }
      const ok = addBannedWord(word);
      if (!ok) {
        await reply("Word already banned or invalid.");
        return;
      }
      await reply(`🚫 Added banned word: *${word.toLowerCase()}*`);
      return;
    }

    if (sub === "remove" || sub === "del" || sub === "delete") {
      if (!word) {
        await reply("Usage: `!banword remove badword`");
        return;
      }
      const ok = removeBannedWord(word);
      if (!ok) {
        await reply("Word not found in banned list.");
        return;
      }
      await reply(`✅ Removed banned word: *${word.toLowerCase()}*`);
      return;
    }

    if (sub === "list") {
      const list = listBannedWords();
      if (!list.length) {
        await reply("No custom banned words yet.\n(Some default bad words are always blocked)");
        return;
      }
      await reply(`🚫 *Banned words*\n\n${list.map((w) => `• ${w}`).join("\n")}`);
      return;
    }

    await reply(
      `🚫 *Banned Words*\n\n` +
        `\`!banword add word\`\n` +
        `\`!banword remove word\`\n` +
        `\`!banword list\``
    );
  },
};

export default banword;
