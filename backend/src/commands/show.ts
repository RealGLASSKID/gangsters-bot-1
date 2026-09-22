import { Command } from "../types";
import { getRecentDeleted } from "../database";

const show: Command = {
  name: "show",
  description: "Show recent deleted messages (admin)",
  usage: "!show [count]",
  aliases: ["deleted", "antidelete", "showdeleted"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const n = Math.min(15, Math.max(1, parseInt(ctx.args[0] || "5", 10) || 5));
    const rows = getRecentDeleted(n);
    if (!rows.length) {
      await reply(
        "🗑️ No recent deleted messages in the log.\n\n" +
          "_Messages are stored for a few hours. Only deletes the bot already saw can be recovered._"
      );
      return;
    }

    const lines = rows.map((r, i) => {
      const when = new Date(r.deleted_at).toLocaleString();
      const body =
        r.body.length > 300 ? r.body.slice(0, 300) + "…" : r.body;
      return (
        `*${i + 1}. ${r.sender_name || "Unknown"}*\n` +
        `⏰ ${when}\n` +
        `${body}`
      );
    });

    await reply(
      `🗑️ *Recent deleted messages* (last ${rows.length})\n\n` +
        lines.join("\n\n────────────\n\n")
    );
  },
};

export default show;
