import { Command } from "../types";
import { displayId, resolveTarget } from "../utils/target";
import { matchesAny } from "../utils/ids";
import { config } from "../config";

const demote: Command = {
  name: "demote",
  description: "Remove admin from a member",
  usage: "!demote @user",
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !demote @user");
      return;
    }
    if (!ctx.actions) {
      await reply("Demote only works in the group.");
      return;
    }
    if (matchesAny(config.ownerJid, [target])) {
      await reply("Can't demote the owner.");
      return;
    }
    const ok = await ctx.actions.demote(target);
    await reply(ok ? `Demoted ${displayId(target)}.` : "Demote failed. Make the bot a group admin.");
  },
};

export default demote;
