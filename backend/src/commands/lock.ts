import { Command } from "../types";

const lock: Command = {
  name: "lock",
  description: "Only admins can edit group info",
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setSetting("locked");
    await reply(ok ? "Group info locked to admins." : "Failed. Make the bot a group admin.");
  },
};

export default lock;
