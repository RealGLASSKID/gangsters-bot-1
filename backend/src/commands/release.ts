import { Command } from "../types";
import { getPendingSop, markSopUsed } from "../database";
import { getSocket } from "../bot";
import { config } from "../config";
import fs from "fs";

const release: Command = {
  name: "release",
  description: "Release a pending Smash or Pass by number",
  usage: "!12  (or just the number after submitting)",
  aliases: [],
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    // Also support bare numbers via a special path in the handler
    const idStr = ctx.args[0] || ctx.body.replace(/^release\s*/i, "").trim();
    const id = parseInt(idStr, 10);
    if (!id || isNaN(id)) {
      await reply("Usage: `!12`  (use the number I gave you when you submitted)");
      return;
    }

    const item = getPendingSop(id);
    if (!item) {
      await reply(`No pending Smash or Pass with ID *${id}*`);
      return;
    }
    if (item.used) {
      await reply(`ID *${id}* was already posted.`);
      return;
    }

    const sock = getSocket();
    if (!sock) {
      await reply("Bot is not connected.");
      return;
    }

    if (!fs.existsSync(item.media_path)) {
      await reply("Media file is missing. Please submit again.");
      return;
    }

    const buffer = fs.readFileSync(item.media_path);
    const groupJid = config.groupJid;

    try {
      // 1. Send the media
      if (item.media_type === "video") {
        await sock.sendMessage(groupJid, {
          video: buffer,
          caption: `😏 *Smash or Pass — ${item.target_name}*`,
        });
      } else {
        await sock.sendMessage(groupJid, {
          image: buffer,
          caption: `😏 *Smash or Pass — ${item.target_name}*`,
        });
      }

      // 2. Send the poll
      await sock.sendMessage(groupJid, {
        poll: {
          name: `Smash or Pass — ${item.target_name}`,
          values: ["🔥 Smash", "😴 Pass"],
          selectableCount: 1,
        },
      });

      markSopUsed(id);
      await reply(`✅ Posted *#${id}* (${item.target_name}) to the group with poll.`);
    } catch (err) {
      console.error("Release SOP error:", err);
      await reply("Failed to post. Check that the bot is in the group.");
    }
  },
};

export default release;
