import { Command } from "../types";
import { getCoinLeaderboard } from "../database";

const richest: Command = {
  name: "richest",
  description: "Top members by coins",
  cooldown: 10,
  async execute(_ctx, reply) {
    const top = getCoinLeaderboard(10);
    if (top.length === 0) { await reply("No data yet."); return; }
    const lines = top.map((u, i) => {
      const name = u.name || u.jid.split("@")[0];
      return `${i + 1}. ${name} — ${u.coins + u.bank} GC`;
    });
    await reply(`💎 *Richest*\n\n${lines.join("\n")}`);
  },
};
export default richest;
