import { Command } from "../types";
import { getRepLeaderboard } from "../database";

const reptop: Command = {
  name: "reptop",
  description: "Reputation leaderboard",
  cooldown: 10,
  async execute(_ctx, reply) {
    const top = getRepLeaderboard(10);
    if (top.length === 0) { await reply("No reputation yet."); return; }
    const lines = top.map((u, i) => `${i + 1}. ${u.name || u.jid.split("@")[0]} — ${u.rep} rep`);
    await reply(`👍 *Reputation Top*\n\n${lines.join("\n")}`);
  },
};
export default reptop;
