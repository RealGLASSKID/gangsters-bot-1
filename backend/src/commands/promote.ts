import { Command } from "../types";
import { displayId, resolveTarget } from "../utils/target";

const promote: Command = {
  name: "promote",
  description: "Make a member a group admin",
  usage: "!promote @user",
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !promote @user");
      return;
    }
    if (!ctx.actions) {
      await reply("Promote only works in the group.");
      return;
    }
    if (await ctx.actions.isGroupAdmin(target)) {
      await reply("That member is already an admin.");
      return;
    }
    const ok = await ctx.actions.promote(target);
    await reply(ok ? `Promoted ${displayId(target)}.` : "Promote failed. Make the bot a group admin.");
  },
};

export default promote;
