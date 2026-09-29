import { Command } from "../types";

type Riddle = { q: string; a: string[]; tag?: "naija" | "classic" };

const RIDDLES: Riddle[] = [
  // ── Well-known classics ──
  {
    q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    a: ["echo"],
    tag: "classic",
  },
  {
    q: "The more you take, the more you leave behind. What am I?",
    a: ["footsteps", "foot steps", "steps"],
    tag: "classic",
  },
  {
    q: "What has cities, but no houses; forests, but no trees; and water, but no fish?",
    a: ["map"],
    tag: "classic",
  },
  {
    q: "What can travel around the world while staying in a corner?",
    a: ["stamp", "postage stamp"],
    tag: "classic",
  },
  {
    q: "What gets wetter as it dries?",
    a: ["towel"],
    tag: "classic",
  },
  {
    q: "I have keys but no locks. I have space but no room. You can enter but can't go outside. What am I?",
    a: ["keyboard"],
    tag: "classic",
  },
  {
    q: "What has hands but can't clap?",
    a: ["clock", "watch"],
    tag: "classic",
  },
  {
    q: "The more of me there is, the less you see. What am I?",
    a: ["darkness", "dark", "night"],
    tag: "classic",
  },
  {
    q: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    a: ["m", "the letter m", "letter m"],
    tag: "classic",
  },
  {
    q: "What has a neck but no head?",
    a: ["bottle", "shirt", "sweater"],
    tag: "classic",
  },
  {
    q: "What has to be broken before you can use it?",
    a: ["egg"],
    tag: "classic",
  },
  {
    q: "I’m tall when I’m young, and I’m short when I’m old. What am I?",
    a: ["candle"],
    tag: "classic",
  },
  {
    q: "What has many teeth but cannot bite?",
    a: ["comb", "zipper"],
    tag: "classic",
  },
  {
    q: "What can you catch but not throw?",
    a: ["cold", "a cold"],
    tag: "classic",
  },
  {
    q: "What goes up but never comes down?",
    a: ["age"],
    tag: "classic",
  },
  {
    q: "What has an eye but cannot see?",
    a: ["needle", "storm", "potato"],
    tag: "classic",
  },
  {
    q: "What is always in front of you but can’t be seen?",
    a: ["future"],
    tag: "classic",
  },
  {
    q: "What building has the most stories?",
    a: ["library"],
    tag: "classic",
  },
  {
    q: "What kind of band never plays music?",
    a: ["rubber band", "rubberband"],
    tag: "classic",
  },
  {
    q: "What has a bottom at the top?",
    a: ["leg", "legs"],
    tag: "classic",
  },
  {
    q: "What disappears as soon as you say its name?",
    a: ["silence"],
    tag: "classic",
  },
  {
    q: "What can fill a room but takes up no space?",
    a: ["light", "sound", "air"],
    tag: "classic",
  },
  {
    q: "If you drop me, I’m sure to crack, but give me a smile and I’ll always smile back. What am I?",
    a: ["mirror"],
    tag: "classic",
  },
  {
    q: "What has four legs in the morning, two at noon, and three in the evening?",
    a: ["human", "man", "person", "humans"],
    tag: "classic",
  },
  {
    q: "I am not alive, but I grow; I don’t have lungs, but I need air; I don’t have a mouth, but water kills me. What am I?",
    a: ["fire"],
    tag: "classic",
  },
  {
    q: "What invention lets you look through a wall?",
    a: ["window"],
    tag: "classic",
  },
  {
    q: "What has one head, one foot, and four legs?",
    a: ["bed"],
    tag: "classic",
  },
  {
    q: "What runs but never walks, has a bed but never sleeps?",
    a: ["river"],
    tag: "classic",
  },
  {
    q: "What can you hold in your left hand but not in your right?",
    a: ["right elbow", "your right elbow", "right hand", "your right hand"],
    tag: "classic",
  },
  {
    q: "Forward I am heavy, but backward I am not. What am I?",
    a: ["ton"],
    tag: "classic",
  },

  // ── Naija / African-flavoured (well-known style + local life) ──
  {
    q: "I am white when I am dirty, and black when I am clean. What am I?",
    a: ["blackboard", "chalkboard"],
    tag: "naija",
  },
  {
    q: "Everyone in the compound uses me, but I never leave the gate. What am I?",
    a: ["well", "borehole", "tap"],
    tag: "naija",
  },
  {
    q: "I carry many people but I have no legs. In Lagos they paint me yellow. What am I?",
    a: ["danfo", "bus", "molue"],
    tag: "naija",
  },
  {
    q: "I am full of holes but I still hold water. What am I?",
    a: ["sponge"],
    tag: "naija",
  },
  {
    q: "Mothers fear me at night when NEPA takes light. I give light but I can burn the house. What am I?",
    a: ["candle", "generator", "lantern", "torch"],
    tag: "naija",
  },
  {
    q: "I am beaten every day but I never cry. Drummers love me. What am I?",
    a: ["drum", "gangan", "talking drum"],
    tag: "naija",
  },
  {
    q: "I have teeth but I cannot chew amala. What am I?",
    a: ["comb", "saw", "zipper"],
    tag: "naija",
  },
  {
    q: "The more you share me at a party, the less I become — especially if I am jollof. What am I?",
    a: ["food", "rice", "jollof", "jollof rice"],
    tag: "naija",
  },
  {
    q: "I fly without wings, I cry without eyes. Whenever I go, darkness leaves. What am I?",
    a: ["cloud", "rain cloud"],
    tag: "naija",
  },
  {
    q: "You see me in the morning on the road; okada men and bus drivers fight because of me. What am I?",
    a: ["traffic", "go slow", "hold up"],
    tag: "naija",
  },
  {
    q: "I have a neck but no head, I wear a cap but have no hair — and palm wine can sit in me. What am I?",
    a: ["bottle", "calabash"],
    tag: "naija",
  },
  {
    q: "Small small I enter pocket; when you scratch me, credit comes. What am I?",
    a: ["recharge card", "airtime card", "sim", "phone card"],
    tag: "naija",
  },
  {
    q: "I bark but I am not a dog. Security men love me at night. What am I?",
    a: ["generator", "geno", "gate"],
    tag: "naija",
  },
  {
    q: "I am round like a ball, children chase me, and Super Eagles need me. What am I?",
    a: ["football", "soccer ball", "ball"],
    tag: "naija",
  },
  {
    q: "Without me, market women cannot count money well. I have a face but no eyes. What am I?",
    a: ["clock", "watch", "time"],
    tag: "naija",
  },
  {
    q: "I swallow everything — paper, pure water sachet, even secrets — but I am not a person. What am I?",
    a: ["dustbin", "bin", "trash can", "waste basket"],
    tag: "naija",
  },
  {
    q: "I stand on one leg when I rest, and on three when I work. Tailors know me well. What am I?",
    a: ["wheelbarrow", "wheel barrow"],
    tag: "naija",
  },
  {
    q: "The richer the compound, the more of me you see on the roof when NEPA fails. What am I?",
    a: ["generator", "solar", "inverter", "panel"],
    tag: "naija",
  },
  {
    q: "I am black and white and read all over — even in Nigerian secondary schools. What am I?",
    a: ["newspaper", "book", "newspaper"],
    tag: "naija",
  },
  {
    q: "You buy me to talk, but when network fails, I am useless. What am I?",
    a: ["phone", "mobile", "cellphone", "airtime"],
    tag: "naija",
  },
];

const riddle: Command = {
  name: "riddle",
  aliases: ["riddles"],
  description: "Random classic or Naija-style riddle",
  usage: "!riddle",
  category: "games",
  cooldown: 6,
  async execute(_ctx, reply) {
    const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    const badge = r.tag === "naija" ? "🇳🇬 *NAIJA RIDDLE*" : "🌍 *CLASSIC RIDDLE*";
    await reply(
      `🧩 ${badge}\n\n${r.q}\n\n_Shout your answer in the chat — first correct wins the bragging rights!_`
    );
  },
};

export default riddle;
