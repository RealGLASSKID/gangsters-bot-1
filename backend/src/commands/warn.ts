import { Command } from "../types";
import { addWarning, findUser } from "../database";
import { resolveTargetJid, publicName } from "../utils/target";
import { matchesAny } from "../utils/ids";

const WARN_LINES = [
  (n: string, c: number, r: string) =>
    `@${n} you no dey hear word 🙄\nReason: ${r}\n⚠ Warning ${c}/3`,
  (n: string, c: number, r: string) =>
    `@${n} abeg calm down small\nWetin you do: ${r}\n⚠ Warning ${c}/3`,
  (n: string, c: number, r: string) =>
    `@${n} no try me oh 😒\n${r}\n⚠ Warning ${c}/3 — next one no go soft`,
  (n: string, c: number, r: string) =>
    `@${n} you dey find cassava? 👀\n${r}\n⚠ Warning ${c}/3`,
];

const warn: Command = {
  name: "warn",
  description: "Warn a member (pidgin style)",
  usage: "!warn @user [reason]",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = await resolveTargetJid(ctx, null);
    if (!target || (!ctx.mentionedJids[0] && !ctx.args[0])) {
      await reply("Usage: `!warn @user [reason]`");
      return;
    }
    if (matchesAny(target, [ctx.from, ctx.sender.raw, ctx.sender.pn, ctx.sender.lid])) {
      await reply("You no fit warn yourself o 😂");
      return;
    }

    const reason =
      (ctx.mentionedJids[0]
        ? ctx.args.join(" ").replace(/@\S+/g, "").trim()
        : ctx.args.slice(1).join(" ").trim()) || "no reason";

    const count = addWarning(target, reason, ctx.from);
    const user = findUser(target);
    const name = publicName(user?.name, target);
    const mention = ctx.mentionedJids[0] || target;
    const line = WARN_LINES[Math.floor(Math.random() * WARN_LINES.length)](
      name.split(" ")[0] || name,
      count,
      reason
    );

    let extra = "";
    if (count >= 3) {
      extra = `\n\n🔇 *${name}* don reach 3 warnings — mute dey load...`;
    }

    await reply({
      text: line + extra,
      mentions: [mention],
    });
  },
};

export default warn;
