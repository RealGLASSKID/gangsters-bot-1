import { Command } from "../types";
import { getRecentlyActive } from "../database";
import { displayId } from "../utils/target";

const online: Command = {
  name: "online",
  description: "Show recently active members (admin)",
  usage: "!online [minutes]",
  aliases: ["active", "whoonline"],
  adminOnly: true,
  category: "admin",
  cooldown: 10,
  async execute(ctx, reply) {
    const mins = Math.min(120, Math.max(1, parseInt(ctx.args[0] || "15", 10) || 15));
    const rows = getRecentlyActive(mins);
    if (rows.length === 0) {
      await reply(`😴 No members active in the last *${mins} minutes*.`);
      return;
    }
    const lines = rows.map((u, i) => {
      const name = u.name || displayId(u.jid);
      return `${i + 1}. ${name}`;
    });
    await reply(
      `🟢 *Recently active* (last ${mins} min)\n` +
        `Total: *${rows.length}*\n\n` +
        lines.join("\n") +
        `\n\n_Based on messages in the group, not WhatsApp "online" status._`
    );
  },
};

export default online;
