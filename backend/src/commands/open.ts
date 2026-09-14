import { Command } from "../types";

const open: Command = {
  name: "open",
  description: "Everyone can send messages",
  aliases: ["unannounce"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setSetting("not_announcement");
    await reply(ok ? "Group opened. Everyone can chat." : "Failed. Make the bot a group admin.");
  },
};

export default open;
