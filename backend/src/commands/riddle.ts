import { Command } from "../types";

const RIDDLES = [
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: ["echo"] },
  { q: "The more you take, the more you leave behind. What am I?", a: ["footsteps", "foot steps"] },
  { q: "What has cities, but no houses; forests, but no trees; and water, but no fish?", a: ["map"] },
  { q: "What can travel around the world while staying in a corner?", a: ["stamp", "postage stamp"] },
  { q: "What has a head, a tail, is brown, and has no legs?", a: ["penny", "coin"] },
  { q: "What gets wetter as it dries?", a: ["towel"] },
  { q: "I have keys but no locks. I have space but no room. You can enter but can't go outside. What am I?", a: ["keyboard"] },
  { q: "What has hands but can't clap?", a: ["clock"] },
  { q: "The more of me there is, the less you see. What am I?", a: ["darkness", "dark"] },
  { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: ["m"] },
];

const riddle: Command = {
  name: "riddle",
  description: "Get a random riddle",
  category: "games",
  cooldown: 6,
  async execute(_ctx, reply) {
    const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    await reply(`🧩 *RIDDLE*\n\n${r.q}\n\nFirst to answer correctly wins!`);
  },
};

export default riddle;
