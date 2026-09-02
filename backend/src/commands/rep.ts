import { Command } from "../types";
import { giveRep, getUser, ensureUser } from "../database";
import { parseTarget } from "../utils/target";

const rep: Command = {
  name: "rep",
  description: "Give reputation to someone",
  usage: "!rep <number>",
  cooldown: 5,
  async execute(ctx, reply) {
    const target = parseTarget(ctx.args);
    if (!target) { await reply("Usage: !rep <number>"); return; }
    ensureUser(ctx.from, ctx.senderName);
    const result = giveRep(ctx.from, target);
    if (result === "self") { await reply("Can't rep yourself."); return; }
    if (result === "already") { await reply("You already gave rep to this person today."); return; }
    const user = getUser(target);
    await reply(`👍 +1 rep to ${target.split("@")[0]} (total: ${user?.rep ?? 1})`);
  },
};
export default rep;
