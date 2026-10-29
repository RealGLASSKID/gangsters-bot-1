import { Command } from "../types";
import { getSocket } from "../bot";
import { config } from "../config";

const approve: Command = {
  name: "approve",
  aliases: ["acceptjoin", "approvejoin"],
  description: "Approve pending group join requests",
  usage: "!approve | !approve @user",
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const sock = getSocket();
    if (!sock) {
      await reply("❌ Bot not connected.");
      return;
    }
    const groupJid = config.groupJid;
    if (!groupJid) {
      await reply("GROUP_JID not configured.");
      return;
    }

    try {
      // Pending requests list (Baileys)
      const pending =
        (await (sock as any).groupRequestParticipantsList?.(groupJid)) || [];

      if (ctx.mentionedJids.length > 0) {
        const ids = ctx.mentionedJids;
        await (sock as any).groupRequestParticipantsUpdate(groupJid, ids, "approve");
        await reply(`✅ Approved ${ids.length} join request(s).`);
        return;
      }

      if (!pending.length) {
        await reply(
          "No pending join requests right now.\n\n" +
            `_Tip: turn on “Admin approval” in group settings so requests appear here._\n` +
            `Auto-approve is also on when the bot is online.`
        );
        return;
      }

      const ids = pending.map((p: { id?: string; jid?: string }) => p.id || p.jid).filter(Boolean);
      await (sock as any).groupRequestParticipantsUpdate(groupJid, ids, "approve");
      await reply(`✅ Approved *${ids.length}* pending join request(s).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "approve failed";
      await reply(
        `❌ Could not approve requests.\n${msg}\n\n` +
          `_Bot must be a group admin, and the group must use join approval._`
      );
    }
  },
};

export default approve;
