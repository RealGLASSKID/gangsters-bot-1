import { Command } from "../types";
const rankladder: Command = {
  name: "rankladder",
  aliases: ["ranks", "levels", "levelladder", "xp"],
  description: "Show XP rank ladder",
  usage: "!rankladder",
  category: "general",
  cooldown: 5,
  async execute(_ctx, reply) {
    // ranking.ts RANKS may not be exported — build from known ladder
    const ladder = [
      { min: 1, title: "Rookie", emoji: "🥚" },
      { min: 5, title: "Street Member", emoji: "🔰" },
      { min: 10, title: "Hustler", emoji: "😈" },
      { min: 18, title: "Gangster", emoji: "🔥" },
      { min: 28, title: "OG", emoji: "👑" },
      { min: 40, title: "Elite Gangster", emoji: "💎" },
      { min: 55, title: "Boss", emoji: "☠️" },
      { min: 75, title: "Don", emoji: "🕶️" },
      { min: 100, title: "Legend", emoji: "🏆" },
    ];

    const lines = ladder.map(
      (r, i) => {
        const next = ladder[i + 1];
        const range = next ? `Lvl ${r.min}–${next.min - 1}` : `Lvl ${r.min}+`;
        return `${r.emoji} *${r.title}* — ${range}`;
      }
    );

    await reply(
      `╭━━━━━━━━━━━━━━━━━━╮\n` +
        `🏆 *RANK LADDER*\n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
        lines.join("\n") +
        `\n\nChat, play games & win to earn XP.\n` +
        `Check yourself: \`!rank\` · \`!profile\``
    );
  },
};

export default rankladder;
