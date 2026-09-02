import { Command } from "../types";
import { muteUser } from "../database";
import { parseTarget } from "../utils/target";

const mute: Command = {
  name: "mute",
  description: "Mute a member (bot ignores them)",
  usage: "!mute <number> [minutes]",
  adminOnly: true,
  cooldown: 3,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !mute <number> [minutes]"); return; }
    if (target === ctx.from) { await reply("Can't mute yourself."); return; }
    const mins = parseInt(ctx.args.find((a) => /^\d+$/.test(a) && a.length < 8) || "0", 10);
    const duration = mins > 0 ? mins * 60 : null;
    muteUser(target, "muted by admin", ctx.from, duration);
    await reply(duration ? `🔇 Muted ${target.split("@")[0]} for ${mins}m` : `🔇 Muted ${target.split("@")[0]} (permanent until !unmute)`);
  },
};
export default mute;
