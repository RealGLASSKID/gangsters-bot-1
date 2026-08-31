import { defineGame, who, pick, normalize, next, win, lose, triesLeft } from "./helpers";

const RIDDLES = [
  { prompt: "I have cities but no houses, forests but no trees, water but no fish. What am I?", answers: ["map", "a map"] },
  { prompt: "The more you take, the more you leave behind. What am I?", answers: ["footsteps", "steps", "footprints"] },
  { prompt: "What has keys but no locks, space but no room, and you can enter but not go inside?", answers: ["keyboard", "a keyboard"] },
  { prompt: "What can travel around the world while staying in a corner?", answers: ["stamp", "a stamp", "postage stamp"] },
  { prompt: "What gets wetter the more it dries?", answers: ["towel", "a towel"] },
  { prompt: "I speak without a mouth and hear without ears. I come alive with wind. What am I?", answers: ["echo", "an echo"] },
  { prompt: "What has a head and a tail but no body?", answers: ["coin", "a coin"] },
  { prompt: "What has to be broken before you can use it?", answers: ["egg", "an egg"] },
  { prompt: "I'm tall when I'm young and short when I'm old. What am I?", answers: ["candle", "a candle"] },
  { prompt: "What goes up but never comes down?", answers: ["age", "your age"] },
];

interface State {
  prompt: string;
  answers: string[];
  tries: number;
}

export const game = defineGame<State>({
  id: "riddle",
  name: "Street Riddles",
  description: "Solve a riddle. Three guesses.",
  aliases: ["riddles"],

  start(user) {
    const item = pick(RIDDLES);
    return {
      state: { prompt: item.prompt, answers: item.answers, tries: 0 },
      reply: `${who(user, "Sharp one")}, listen close.\n\n${item.prompt}\n\nThree guesses. *quit* folds.`,
    };
  },

  turn({ state, raw }) {
    const tries = state.tries + 1;
    const hit = state.answers.some((a) => normalize(a) === normalize(raw));
    if (hit) return win(`That's it. Cracked it in ${tries} ${tries === 1 ? "guess" : "guesses"}.`, "riddle");
    if (tries >= 3) return lose(`Out of guesses. The answer was *${state.answers[0]}*.`, "riddle");
    return next(`Not it. ${triesLeft(3 - tries, "guess", "guesses")}.`, { ...state, tries });
  },
});
