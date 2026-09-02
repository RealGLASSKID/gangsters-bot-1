import { Command } from "../types";
import { setAfk } from "../database";

const afk: Command = {
  name: "afk",
  description: "Set AFK status",
  usage: "!afk [reason]",
  cooldown: 5,
  async execute(ctx, reply) {
    const reason = ctx.args.join(" ").trim() || "AFK";
    setAfk(ctx.from, reason);
    await reply(`💤 *${ctx.senderName}* is now AFK: ${reason}`);
  },
};
export default afk;
