import { Command } from "../types";
import { unmuteUser } from "../database";
import { displayId, resolveTarget } from "../utils/target";

const unmute: Command = {
  name: "unmute",
  description: "Unmute a member",
  usage: "!unmute @user",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !unmute @user");
      return;
    }
    unmuteUser(target);
    await reply(`Unmuted ${displayId(target)}.`);
  },
};

export default unmute;
