import { Command } from "../types";
import { getSetting, setSetting } from "../database";

const welcome: Command = {
  name: "welcome",
  description: "Turn welcome messages on/off",
  usage: "!welcome on | !welcome off",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg = (ctx.args[0] || "").toLowerCase();
    if (arg === "on") {
      setSetting("welcome_enabled", "1");
      await reply("✅ Welcome messages *ON*");
      return;
    }
    if (arg === "off") {
      setSetting("welcome_enabled", "0");
      await reply("✅ Welcome messages *OFF*");
      return;
    }
    const status = getSetting("welcome_enabled", "1") === "1" ? "ON" : "OFF";
    await reply(
      `👋 Welcome is currently *${status}*\n\n` +
        `\`!welcome on\` / \`!welcome off\`\n` +
        `\`!setwelcome Your message here\`\n\n` +
        `Placeholders: {user} {group} {count}`
    );
  },
};

export default welcome;
