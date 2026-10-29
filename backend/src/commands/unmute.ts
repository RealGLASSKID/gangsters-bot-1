import { Command } from "../types";
import { unmuteUser, listMutes } from "../database";
import { displayId, publicName, resolveTarget, resolveTargetJid } from "../utils/target";

const unmute: Command = {
  name: "unmute",
  description: "Unmute a member (bot will respond again)",
  usage: "!unmute @user | !unmute list",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg0 = (ctx.args[0] || "").toLowerCase();
    if (arg0 === "list" || arg0 === "all") {
      const rows = listMutes();
      if (!rows.length) {
        await reply("No one is muted right now.");
        return;
      }
      const lines = rows.map((r, i) => {
        const exp = r.expires_at
          ? `until ${new Date(r.expires_at).toLocaleString()}`
          : "until unmuted";
        return `${i + 1}. ${displayId(r.jid)} — ${r.reason || "muted"} (${exp})`;
      });
      await reply(`🔇 *Muted list*\n\n${lines.join("\n")}\n\nUnmute: \`!unmute @user\``);
      return;
    }

    let target = await resolveTargetJid(ctx, null);
    if (!ctx.mentionedJids[0] && !ctx.args[0]) {
      await reply("Usage: `!unmute @user`\nList: `!unmute list`");
      return;
    }
    if (!target) target = resolveTarget(ctx) || "";
    if (!target) {
      await reply("Usage: `!unmute @user`");
      return;
    }

    unmuteUser(target);
    for (const m of ctx.mentionedJids) unmuteUser(m);

    const name = publicName(null, target);
    await reply({
      text: `🔊 Unmuted *${name}*.\nThey can use the bot again.`,
      mentions: ctx.mentionedJids[0] ? [ctx.mentionedJids[0]] : [target],
    });
  },
};

export default unmute;
