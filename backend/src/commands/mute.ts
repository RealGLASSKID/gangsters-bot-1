import { Command } from "../types";
import { muteUser } from "../database";
import { displayId, resolveTarget } from "../utils/target";
import { matchesAny } from "../utils/ids";

const mute: Command = {
  name: "mute",
  description: "Mute a member (bot ignores them)",
  usage: "!mute @user [minutes]",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !mute @user [minutes]");
      return;
    }
    if (matchesAny(target, [ctx.from, ctx.sender.raw, ctx.sender.pn, ctx.sender.lid])) {
      await reply("You can't mute yourself.");
      return;
    }
    const mins = parseInt(ctx.args.find((a) => /^\d+$/.test(a) && a.length < 8) || "0", 10);
    const duration = mins > 0 ? mins * 60 : null;
    muteUser(target, "muted by admin", ctx.from, duration);
    await reply(
      duration
        ? `Muted ${displayId(target)} for ${mins}m.`
        : `Muted ${displayId(target)} until !unmute.`
    );
  },
};

export default mute;
