import { Command } from "../types";
import { addWarning, findUser } from "../database";
import { resolveTargetJid, displayId } from "../utils/target";
import { matchesAny } from "../utils/ids";

const warn: Command = {
  name: "warn",
  description: "Warn a member",
  usage: "!warn @user [reason]",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = await resolveTargetJid(ctx, null);
    if (!target || !ctx.mentionedJids[0] && !ctx.args[0]) {
      await reply("Usage: !warn @user [reason]");
      return;
    }
    if (!target) {
      await reply("Usage: !warn @user [reason]");
      return;
    }
    if (matchesAny(target, [ctx.from, ctx.sender.raw, ctx.sender.pn, ctx.sender.lid])) {
      await reply("You can't warn yourself.");
      return;
    }

    const reason =
      (ctx.mentionedJids[0]
        ? ctx.args.join(" ").replace(/@\S+/g, "").trim()
        : ctx.args.slice(1).join(" ").trim()) || "no reason";

    const count = addWarning(target, reason, ctx.from);
    const user = findUser(target);
    const name = user?.name || displayId(target);
    const mention = ctx.mentionedJids[0] || target;
    await reply({
      text: `⚠️ Warned *${name}*\nReason: ${reason}\nTotal: ${count}/3`,
      mentions: [mention],
    });
  },
};

export default warn;
