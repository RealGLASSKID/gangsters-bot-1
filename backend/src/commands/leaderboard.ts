import { Command } from "../types";
import { getLeaderboard } from "../database";
import { rankTitle } from "../ranking";

const leaderboard: Command = {
  name: "leaderboard",
  description: "Top members by XP",
  cooldown: 10,
  async execute(_ctx, reply) {
    const top = getLeaderboard(10);
    if (top.length === 0) {
      await reply("No rankings yet.");
      return;
    }
    const lines = top.map((u, i) => {
      const name = u.name || u.jid.split("@")[0];
      return `${i + 1}. ${name} — Lv.${u.level} (${rankTitle(u.level)}) · ${u.xp} XP`;
    });
    await reply(`🏆 *Leaderboard*\n\n${lines.join("\n")}`);
  },
};

export default leaderboard;
