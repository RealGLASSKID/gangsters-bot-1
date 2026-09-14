import { Command } from "../types";

const PROVERBS = [
  { start: "A kì í fi ìka...", end: "méjì pín epo" }, // You don't divide oil with two fingers
  { start: "Bi a ba n ja...", end: "ki a ma fi oju we ara wa" },
  { start: "The child who says his mother will not sleep...", end: "will also not sleep" },
  { start: "When the roots of a tree begin to decay...", end: "it spreads death to the branches" },
  { start: "A person who has not travelled thinks...", end: "his mother is the best cook" },
  { start: "No matter how long a log stays in the water...", end: "it cannot become a crocodile" },
  { start: "The lizard that jumped from the high iroko tree said...", end: "he would praise himself if no one else did" },
  { start: "He who fetches the firewood...", end: "must be careful of the snake" },
  { start: "A single broom can be broken easily, but a bunch of brooms...", end: "is hard to break" },
  { start: "When the music changes...", end: "so does the dance" },
];

const proverb: Command = {
  name: "proverb",
  description: "Complete the Nigerian proverb",
  category: "games",
  cooldown: 6,
  async execute(_ctx, reply) {
    const p = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
    await reply(
      `📜 *COMPLETE THE PROVERB*\n\n"${p.start}..."\n\nFinish it! First correct answer wins.`
    );
  },
};

export default proverb;
