import { Command } from "../types";

const unlock: Command = {
  name: "unlock",
  description: "Members can edit group info",
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setSetting("unlocked");
    await reply(ok ? "Group info unlocked." : "Failed. Make the bot a group admin.");
  },
};

export default unlock;
