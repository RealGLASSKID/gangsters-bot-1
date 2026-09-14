import { Command } from "../types";

const WORDS = [
  { word: "JOLLOF", hint: "Popular Nigerian rice" },
  { word: "NAIRA", hint: "Nigerian money" },
  { word: "LAGOS", hint: "Former capital city" },
  { word: "ABUJA", hint: "Current capital" },
  { word: "PIDGIN", hint: "Nigerian English style" },
  { word: "AFROBEATS", hint: "Music genre" },
  { word: "SUYA", hint: "Spicy street meat" },
  { word: "POUNDO", hint: "Short for pounded yam" },
  { word: "DANFO", hint: "Lagos yellow bus" },
  { word: "OKADA", hint: "Motorcycle taxi" },
  { word: "GARI", hint: "Cassava flakes" },
  { word: "EGUSI", hint: "Popular soup seed" },
  { word: "NOLLYWOOD", hint: "Nigerian movie industry" },
  { word: "SUPER EAGLES", hint: "National football team" },
];

function scramble(word: string): string {
  const arr = word.replace(/ /g, "").split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join(" ").toUpperCase();
}

const scrambleCmd: Command = {
  name: "scramble",
  description: "Word scramble challenge",
  aliases: ["unscramble"],
  category: "games",
  cooldown: 6,
  async execute(_ctx, reply) {
    const item = WORDS[Math.floor(Math.random() * WORDS.length)];
    const scrambled = scramble(item.word);
    await reply(
      `🔤 *UNSCRAMBLE THIS*\n\n\`${scrambled}\`\n\nHint: ${item.hint}\n\nFirst correct answer wins!`
    );
  },
};

export default scrambleCmd;
