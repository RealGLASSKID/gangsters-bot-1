import { Command } from "../types";
import { unmuteUser } from "../database";
import { parseTarget } from "../utils/target";

const unmute: Command = {
  name: "unmute",
  description: "Unmute a member",
  usage: "!unmute <number>",
  adminOnly: true,
  cooldown: 3,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !unmute <number>"); return; }
    unmuteUser(target);
    await reply(`🔊 Unmuted ${target.split("@")[0]}`);
  },
};
export default unmute;
