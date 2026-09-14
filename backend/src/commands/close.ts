import { Command } from "../types";

const close: Command = {
  name: "close",
  description: "Only admins can send messages",
  aliases: ["announce"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setSetting("announcement");
    await reply(ok ? "Group closed. Only admins can chat." : "Failed. Make the bot a group admin.");
  },
};

export default close;
