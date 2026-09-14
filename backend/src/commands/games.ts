import { Command } from "../types";
import { config } from "../config";

const games: Command = {
  name: "games",
  description: "Show all available games by category",
  aliases: ["game", "play"],
  category: "games",
  cooldown: 5,
  async execute(_ctx, reply) {
    const text = `╭━━━━━━━━━━━━━━━━━━╮
🎮 *${config.botName} GAMES*
╰━━━━━━━━━━━━━━━━━━╯

*😂 SOCIAL / PARTY*
• !truth / !dare / !tod
• !wyr — Would You Rather
• !nhie — Never Have I Ever
• !sop — Smash or Pass
• !putafinger
• !2truths
• !mostlikely
• !hotseat

*🧠 QUIZ & BRAIN*
• !naijaquiz
• !riddle
• !scramble
• !emoji
• !math
• !trivia
• !guess

*🇳🇬 NAIJA SPECIALS*
• !slang
• !pidgin
• !proverb
• !naijafood
• !state
• !capital

*🎲 CLASSIC*
• !coinflip / !dice / !rps
• !8ball / !joke / !fact

Type the command to play!
Earn XP by playing & winning 🔥`;

    await reply(text);
  },
};

export default games;
