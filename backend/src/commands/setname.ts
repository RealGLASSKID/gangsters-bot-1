import { Command } from "../types";

const setname: Command = {
  name: "setname",
  description: "Change the group name",
  usage: "!setname <new name>",
  aliases: ["subject"],
  adminOnly: true,
  category: "admin",
  cooldown: 8,
  async execute(ctx, reply) {
    const name = ctx.args.join(" ").trim();
    if (!name || name.length > 80) {
      await reply("Usage: !setname <new name>");
      return;
    }
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const ok = await ctx.actions.setSubject(name);
    await reply(ok ? `Group name set to *${name}*.` : "Failed. Make the bot a group admin.");
  },
};

export default setname;
