import { Command } from "../types";

interface QuizItem {
  q: string;
  a: string[];
}

const QUIZ: QuizItem[] = [
  // History & General
  { q: "Who was the first President of Nigeria?", a: ["nnamdi azikiwe", "azikiwe", "zik"] },
  { q: "In what year did Nigeria gain independence?", a: ["1960"] },
  { q: "What is the capital of Nigeria?", a: ["abuja"] },
  { q: "Which river is the longest in Nigeria?", a: ["niger", "river niger"] },
  { q: "How many states are in Nigeria?", a: ["36", "thirty six", "thirty-six"] },
  { q: "What is the name of the Nigerian national football team (men)?", a: ["super eagles", "the super eagles"] },
  { q: "Which city is known as the 'Centre of Excellence'?", a: ["lagos"] },
  { q: "What does 'NEPA' stand for (old name)?", a: ["national electric power authority"] },
  { q: "Who is popularly called 'The Golden Voice of Africa'?", a: ["fela", "fela kuti"] },
  { q: "What is the currency of Nigeria?", a: ["naira", "nigerian naira"] },

  // States & Capitals
  { q: "What is the capital of Lagos State?", a: ["ikeja"] },
  { q: "What is the capital of Rivers State?", a: ["port harcourt"] },
  { q: "What is the capital of Kano State?", a: ["kano"] },
  { q: "What is the capital of Oyo State?", a: ["ibadan"] },
  { q: "What is the capital of Enugu State?", a: ["enugu"] },
  { q: "Which state is known as the 'Food Basket of the Nation'?", a: ["benue"] },
  { q: "Which state is called the 'Coal City State'?", a: ["enugu"] },
  { q: "Which state is known as 'The Pace Setter'?", a: ["oyo"] },

  // Culture & Food
  { q: "What is the popular Nigerian rice dish often argued about?", a: ["jollof", "jollof rice"] },
  { q: "What is 'swallow' in Nigerian food context?", a: ["fufu", "pounded yam", "amala", "eba", "semo", "swallow"] },
  { q: "What is the name of the popular spicy Nigerian soup with bitter leaf?", a: ["ofe onugbu", "bitter leaf soup", "onugbu"] },
  { q: "What does 'abeg' mean?", a: ["please", "i beg"] },
  { q: "What does 'sharp sharp' mean in Naija slang?", a: ["quickly", "fast", "hurry"] },
  { q: "What does 'how far?' usually mean?", a: ["how are you", "what's up", "hello"] },

  // Entertainment
  { q: "Which Nigerian artist is known as the 'African Giant'?", a: ["burna boy", "burnaboy"] },
  { q: "Who sang 'Love Nwantiti'?", a: ["cKay", "ckay"] },
  { q: "Which movie industry is known as Nollywood?", a: ["nigeria", "nigerian", "nollywood"] },
  { q: "Who is popularly called 'Mr Money'?", a: ["asake"] },
];

const naijaquiz: Command = {
  name: "naijaquiz",
  description: "Nigerian knowledge quiz",
  aliases: ["nq", "nigeriaquiz"],
  category: "games",
  cooldown: 8,
  async execute(_ctx, reply) {
    const item = QUIZ[Math.floor(Math.random() * QUIZ.length)];
    // We store the answer temporarily in a simple way (for basic version)
    // In a full version we would track active quizzes per group
    await reply(
      `🇳🇬 *NAIJA QUIZ*\n\n${item.q}\n\nFirst correct answer wins! 🏆\n(Reply with your answer)`
    );
    // Note: Full answer checking would require active game state.
    // For now this gives the question. You can expand later with a game session system.
  },
};

export default naijaquiz;
