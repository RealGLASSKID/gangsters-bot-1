import { Command } from "../types";

const SLANGS = [
  { slang: "Abeg shift", meaning: "Please move / give way" },
  { slang: "How far?", meaning: "How are you? / What's up?" },
  { slang: "Sharp sharp", meaning: "Quickly / immediately" },
  { slang: "No wahala", meaning: "No problem" },
  { slang: "I dey", meaning: "I am fine / I am around" },
  { slang: "You too much", meaning: "You are amazing / thank you" },
  { slang: "E choke", meaning: "It is too much / overwhelming (in a good or bad way)" },
  { slang: "Sabi", meaning: "Know / understand" },
  { slang: "Oya", meaning: "Come on / hurry / okay then" },
  { slang: "Wetin dey happen?", meaning: "What is going on?" },
  { slang: "I no fit", meaning: "I cannot / I am unable" },
  { slang: "Gbege", meaning: "Trouble / problem" },
  { slang: "Yarn", meaning: "Talk / speak" },
  { slang: "Mad o", meaning: "That's crazy / impressive" },
  { slang: "No dull", meaning: "Don't be slow / stay sharp" },
];

const slang: Command = {
  name: "slang",
  description: "Naija slang challenge",
  category: "games",
  cooldown: 5,
  async execute(_ctx, reply) {
    const item = SLANGS[Math.floor(Math.random() * SLANGS.length)];
    await reply(
      `🇳🇬 *NAIJA SLANG CHALLENGE*\n\nWhat does "*${item.slang}*" mean?\n\nFirst correct answer wins!`
    );
  },
};

export default slang;
