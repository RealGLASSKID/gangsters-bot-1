import { Command } from "../types";
import { parseTarget } from "../utils/target";

const kick: Command = {
  name: "kick",
  description: "Kick a member from the group",
  usage: "!kick <number>",
  adminOnly: true,
  cooldown: 5,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !kick <number>"); return; }
    if (target === ctx.from) { await reply("Can't kick yourself."); return; }
    if (!ctx.actions) { await reply("Kick unavailable."); return; }
    if (await ctx.actions.isGroupAdmin(target)) { await reply("Can't kick an admin."); return; }
    const ok = await ctx.actions.kick(target);
    await reply(ok ? `👢 Kicked ${target.split("@")[0]}` : "Failed to kick (is the bot admin?)");
  },
};
export default kick;
