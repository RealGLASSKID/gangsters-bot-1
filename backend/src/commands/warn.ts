import { Command } from "../types";
import { addWarning } from "../database";
import { displayId, resolveTarget } from "../utils/target";
import { matchesAny } from "../utils/ids";

const warn: Command = {
  name: "warn",
  description: "Warn a member",
  usage: "!warn @user [reason]",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !warn @user [reason]");
      return;
    }
    if (matchesAny(target, [ctx.from, ctx.sender.raw, ctx.sender.pn, ctx.sender.lid])) {
      await reply("You can't warn yourself.");
      return;
    }

    const numIdx = ctx.args.findIndex((a) => a.replace(/\D/g, "").length >= 8);
    const reason =
      (ctx.mentionedJids[0]
        ? ctx.args.join(" ")
        : numIdx >= 0
          ? ctx.args.slice(numIdx + 1).join(" ")
          : ctx.args.join(" ")
      ).trim() || "no reason";

    const count = addWarning(target, reason, ctx.from);
    await reply(`Warned ${displayId(target)}\nReason: ${reason}\nTotal: ${count}/3`);
  },
};

export default warn;
