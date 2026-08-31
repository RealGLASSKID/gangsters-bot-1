import { defineGame, who, pick, normalize, next, win, lose } from "./helpers";

const QUESTIONS = [
  { q: "How many sides does a hexagon have?", answers: ["6", "six"] },
  { q: "What planet is known as the Red Planet?", answers: ["mars"] },
  { q: "How many continents are there on Earth?", answers: ["7", "seven"] },
  { q: "What is the capital of France?", answers: ["paris"] },
  { q: "Which ocean is the largest?", answers: ["pacific", "pacific ocean"] },
  { q: "How many minutes are in two hours?", answers: ["120"] },
  { q: "What gas do plants take in that people breathe out?", answers: ["carbon dioxide", "co2"] },
  { q: "Who wrote Romeo and Juliet?", answers: ["shakespeare", "william shakespeare"] },
  { q: "What is 12 times 12?", answers: ["144"] },
  { q: "Which animal is known as the king of the jungle?", answers: ["lion", "the lion"] },
  { q: "What color do you get when you mix red and blue?", answers: ["purple"] },
  { q: "How many days are in a leap year?", answers: ["366"] },
];

interface State {
  question: string;
  answers: string[];
  tries: number;
}

export const game = defineGame<State>({
  id: "trivia",
  name: "Street Smarts",
  description: "Quick-fire trivia. Two guesses per question.",
  aliases: ["quiz", "smarts"],

  start(user) {
    const item = pick(QUESTIONS);
    return {
      state: { question: item.q, answers: item.answers, tries: 0 },
      reply: `Street Smarts, ${who(user)}.\n\n${item.q}\n\nTwo guesses.`,
    };
  },

  turn({ state, raw }) {
    const tries = state.tries + 1;
    const hit = state.answers.some((a) => normalize(a) === normalize(raw));
    if (hit) return win("Correct. You know your stuff.", "trivia");
    if (tries >= 2) return lose(`That's a miss. Answer was *${state.answers[0]}*.`, "trivia");
    return next("Not quite. One more shot.", { ...state, tries });
  },
});
