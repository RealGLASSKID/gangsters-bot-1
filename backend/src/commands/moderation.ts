import { Command } from "../types";
import { getSetting, setSetting } from "../database";

function isOn(key: string, fallback = "1") {
  return getSetting(key, fallback) === "1";
}

const moderation: Command = {
  name: "moderation",
  description: "Turn advanced moderation features on/off",
  usage: "!moderation on/off | !moderation links on | !moderation status",
  aliases: ["mod", "automod"],
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const sub = (ctx.args[0] || "").toLowerCase();
    const val = (ctx.args[1] || "").toLowerCase();

    // Master switch
    if (sub === "on") {
      setSetting("mod_enabled", "1");
      await reply("🛡️ Advanced moderation *ON*");
      return;
    }
    if (sub === "off") {
      setSetting("mod_enabled", "0");
      await reply("🛡️ Advanced moderation *OFF*\n(No auto warnings/deletes for links, bad words, spam, etc.)");
      return;
    }

    // Individual toggles
    const toggles: Record<string, string> = {
      links: "mod_links",
      badwords: "mod_badwords",
      words: "mod_badwords",
      mentions: "mod_mentions",
      flood: "mod_flood",
      spam: "mod_flood",
      caps: "mod_caps",
      repeat: "mod_repeat",
    };

    if (toggles[sub]) {
      if (val !== "on" && val !== "off") {
        await reply(`Usage: \`!moderation ${sub} on\` or \`!moderation ${sub} off\``);
        return;
      }
      setSetting(toggles[sub], val === "on" ? "1" : "0");
      await reply(`🛡️ *${sub}* protection is now *${val.toUpperCase()}*`);
      return;
    }

    // Status
    const master = isOn("mod_enabled") ? "ON" : "OFF";
    const lines = [
      `🛡️ *MODERATION STATUS*`,
      ``,
      `Master ........ *${master}*`,
      `Links ......... *${isOn("mod_links") ? "ON" : "OFF"}*`,
      `Bad words ..... *${isOn("mod_badwords") ? "ON" : "OFF"}*`,
      `Mentions ...... *${isOn("mod_mentions") ? "ON" : "OFF"}*`,
      `Flood/Spam .... *${isOn("mod_flood") ? "ON" : "OFF"}*`,
      `Repeat msg .... *${isOn("mod_repeat") ? "ON" : "OFF"}*`,
      `Caps spam ..... *${isOn("mod_caps") ? "ON" : "OFF"}*`,
      ``,
      `Commands:`,
      `\`!moderation on / off\``,
      `\`!moderation links on/off\``,
      `\`!moderation badwords on/off\``,
      `\`!moderation mentions on/off\``,
      `\`!moderation flood on/off\``,
      `\`!moderation caps on/off\``,
    ];
    await reply(lines.join("\n"));
  },
};

export default moderation;
