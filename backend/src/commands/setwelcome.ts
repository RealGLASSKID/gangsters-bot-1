import { Command } from "../types";
import { setSetting } from "../database";

const setwelcome: Command = {
  name: "setwelcome",
  description: "Set custom welcome message",
  usage: "!setwelcome Yo {user} welcome to {group}!",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const text = ctx.body.replace(/^setwelcome\s*/i, "").trim();
    if (!text) {
      await reply(
        "Usage:\n`!setwelcome Yo {user} welcome to {group}!`\n\n" +
          "Placeholders:\n• {user} — mentioned name\n• {group} — group name\n• {count} — member count"
      );
      return;
    }
    setSetting("welcome_message", text);
    await reply("✅ Welcome message updated.\n\nPreview placeholders: {user} {group} {count}");
  },
};

export default setwelcome;
