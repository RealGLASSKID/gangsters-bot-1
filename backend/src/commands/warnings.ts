import { Command } from "../types";
import { getWarnings } from "../database";
import { parseTarget } from "../utils/target";

const warnings: Command = {
  name: "warnings",
  description: "Show warnings for a user",
  usage: "!warnings [number]",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args) || ctx.from;
    const list = getWarnings(target);
    if (list.length === 0) { await reply("No warnings."); return; }
    const lines = list.slice(0, 10).map((w, i) => `${i + 1}. ${w.reason || "—"} (${w.created_at.slice(0, 10)})`);
    await reply(`⚠️ Warnings for ${target.split("@")[0]} (${list.length})\n\n${lines.join("\n")}`);
  },
};
export default warnings;
