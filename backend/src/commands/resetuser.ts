import { Command } from "../types";
import { resetUser } from "../database";
import { displayId, resolveTarget } from "../utils/target";

const resetuser: Command = {
  name: "resetuser",
  description: "Reset a user's bot data",
  usage: "!resetuser @user",
  ownerOnly: true,
  category: "owner",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = resolveTarget(ctx);
    if (!target) {
      await reply("Usage: !resetuser @user");
      return;
    }
    resetUser(target);
    await reply(`Reset data for ${displayId(target)}.`);
  },
};

export default resetuser;
