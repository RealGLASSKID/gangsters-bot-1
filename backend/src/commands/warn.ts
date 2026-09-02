import { Command } from "../types";
import { addWarning } from "../database";
import { parseTarget } from "../utils/target";

const warn: Command = {
  name: "warn",
  description: "Warn a member",
  usage: "!warn <number> [reason]",
  adminOnly: true,
  cooldown: 3,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) {
      await reply("Usage: !warn <number> [reason]");
      return;
    }
    if (target === ctx.from) {
      await reply("Can't warn yourself.");
      return;
    }

    const numIdx = ctx.args.findIndex((a) => a.replace(/\D/g, "").length >= 8);
    const reason = (numIdx >= 0 ? ctx.args.slice(numIdx + 1).join(" ") : "").trim() || "no reason";
    const count = addWarning(target, reason, ctx.from);
    await reply(`⚠️ Warned ${target.split("@")[0]}\nReason: ${reason}\nTotal: ${count}/3`);
  },
};

export default warn;
