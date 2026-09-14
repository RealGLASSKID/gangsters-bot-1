import { Command } from "../types";
import { getSetting, setSetting } from "../database";

const goodbye: Command = {
  name: "goodbye",
  description: "Turn goodbye messages on/off",
  usage: "!goodbye on | !goodbye off",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg = (ctx.args[0] || "").toLowerCase();
    if (arg === "on") {
      setSetting("goodbye_enabled", "1");
      await reply("✅ Goodbye messages *ON*");
      return;
    }
    if (arg === "off") {
      setSetting("goodbye_enabled", "0");
      await reply("✅ Goodbye messages *OFF*");
      return;
    }
    const status = getSetting("goodbye_enabled", "1") === "1" ? "ON" : "OFF";
    await reply(
      `🚪 Goodbye is currently *${status}*\n\n` +
        `\`!goodbye on\` / \`!goodbye off\`\n` +
        `\`!setgoodbye Your message here\`\n\n` +
        `Placeholders: {user} {group} {count}`
    );
  },
};

export default goodbye;
