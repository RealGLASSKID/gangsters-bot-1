import { Command } from "../types";

const setdesc: Command = {
  name: "setdesc",
  description: "Change the group description",
  usage: "!setdesc <text>",
  aliases: ["setdescription"],
  adminOnly: true,
  category: "admin",
  cooldown: 8,
  async execute(ctx, reply) {
    const desc = ctx.args.join(" ").trim();
    if (!desc || desc.length > 500) {
      await reply("Usage: !setdesc <text>");
      return;
    }
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setDescription(desc);
    await reply(ok ? "Group description updated." : "Failed. Make the bot a group admin.");
  },
};

export default setdesc;
