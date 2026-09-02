import { Command } from "../types";
import { resetUser } from "../database";
import { parseTarget } from "../utils/target";

const resetuser: Command = {
  name: "resetuser",
  description: "Reset a user's bot data",
  usage: "!resetuser <number>",
  ownerOnly: true,
  cooldown: 5,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !resetuser <number>"); return; }
    resetUser(target);
    await reply(`🗑️ Reset data for ${target.split("@")[0]}`);
  },
};
export default resetuser;
