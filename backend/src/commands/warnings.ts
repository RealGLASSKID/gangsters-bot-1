import { Command } from "../types";
import { getWarnings } from "../database";
import { displayId, resolveTarget } from "../utils/target";

const warnings: Command = {
  name: "warnings",
  description: "Show warnings for a user",
  usage: "!warnings [@user]",
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx, ctx.from);
    if (!target) return;
    const list = getWarnings(target);
    if (list.length === 0) {
      await reply(`No warnings for ${displayId(target)}.`);
      return;
    }
    const lines = list
      .slice(0, 10)
      .map((w, i) => `${i + 1}. ${w.reason || "—"} (${w.created_at.slice(0, 10)})`);
    await reply(`Warnings for ${displayId(target)} (${list.length})\n\n${lines.join("\n")}`);
  },
};

export default warnings;
