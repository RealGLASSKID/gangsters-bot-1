import { Command } from "../types";
import { setSetting } from "../database";

const setgoodbye: Command = {
  name: "setgoodbye",
  description: "Set custom goodbye message",
  usage: "!setgoodbye {user} left the gang. Members: {count}",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const text = ctx.body.replace(/^setgoodbye\s*/i, "").trim();
    if (!text) {
      await reply(
        "Usage:\n`!setgoodbye {user} left the gang. Members left: {count}`\n\n" +
          "Placeholders: {user} {group} {count}"
      );
      return;
    }
    setSetting("goodbye_message", text);
    await reply("✅ Goodbye message updated.");
  },
};

export default setgoodbye;
