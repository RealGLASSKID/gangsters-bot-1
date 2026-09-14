import { Command } from "../types";
import { clearWarnings } from "../database";
import { displayId, resolveTarget } from "../utils/target";

const unwarn: Command = {
  name: "unwarn",
  description: "Clear all warnings for a user",
  usage: "!unwarn @user",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !unwarn @user");
      return;
    }
    clearWarnings(target);
    await reply(`Cleared warnings for ${displayId(target)}.`);
  },
};

export default unwarn;
