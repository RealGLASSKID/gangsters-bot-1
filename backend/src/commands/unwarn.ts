import { Command } from "../types";
import { clearWarnings } from "../database";
import { parseTarget } from "../utils/target";

const unwarn: Command = {
  name: "unwarn",
  description: "Clear all warnings for a user",
  usage: "!unwarn <number>",
  adminOnly: true,
  cooldown: 3,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !unwarn <number>"); return; }
    clearWarnings(target);
    await reply(`✅ Cleared warnings for ${target.split("@")[0]}`);
  },
};
export default unwarn;
