import { Command } from "../types";
import { getSetting, setSetting } from "../database";
import { resolveTarget, displayId } from "../utils/target";

const welcome: Command = {
  name: "welcome",
  description: "Welcome on/off, or manually welcome @user",
  usage: "!welcome on/off | !welcome @user",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg = (ctx.args[0] || "").toLowerCase();

    // Manual welcome: !welcome @user
    const target = ctx.mentionedJids[0] || null;
    if (target) {
      const template =
        getSetting(
          "welcome_message",
          "👋 Welcome {user} to *{group}*!\nWe are now {count} members."
        ) || "👋 Welcome {user} to *{group}*!";
      let groupName = "the group";
      let count = "?";
      if (ctx.actions) {
        const info = await ctx.actions.getGroupInfo();
        if (info) {
          groupName = info.subject;
          count = String(info.size);
        }
      }
      const nameTag = `@${displayId(target)}`;
      const text = template
        .replace(/\{user\}/gi, nameTag)
        .replace(/\{group\}/gi, groupName)
        .replace(/\{count\}/gi, count);
      await reply({ text, mentions: [target] });
      return;
    }

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
        `\`!welcome @user\` — manual welcome\n` +
        `\`!setwelcome Your message\`\n\n` +
        `Placeholders: {user} {group} {count}`
    );
  },
};

export default welcome;
