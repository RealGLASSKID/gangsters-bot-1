import { Command } from "../types";
import { displayId, resolveTarget } from "../utils/target";
import { matchesAny } from "../utils/ids";
import { config } from "../config";

const kick: Command = {
  name: "kick",
  description: "Remove a member from the group",
  usage: "!kick @user  or  !kick <number>",
  aliases: ["remove"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !kick @user");
      return;
    }
    if (!ctx.actions) {
      await reply("Kick only works in the group.");
      return;
    }
    if (matchesAny(target, [ctx.from, ctx.sender.raw, ctx.sender.pn, ctx.sender.lid])) {
      await reply("You can't kick yourself.");
      return;
    }
    if (matchesAny(config.ownerJid, [target])) {
      await reply("Can't kick the owner.");
      return;
    }
    if (ctx.botJid && matchesAny(ctx.botJid, [target])) {
      await reply("Can't kick the bot.");
      return;
    }
    if (await ctx.actions.isGroupAdmin(target)) {
      await reply("Can't kick a group admin.");
      return;
    }
    const ok = await ctx.actions.kick(target);
    await reply(ok ? `Removed ${displayId(target)}.` : "Kick failed. Make the bot a group admin.");
  },
};

export default kick;
