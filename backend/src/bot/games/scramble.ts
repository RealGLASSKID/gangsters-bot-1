import { defineGame, who, pick, next, win, lose, triesLeft } from "./helpers";

const WORDS = ["legend", "crew", "vibe", "respect", "family", "city", "night", "style", "signal", "shadow", "crown", "spark"];

function scramble(word: string): string {
  const chars = word.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  const out = chars.join("");
  return out === word ? scramble(word) : out;
}

interface State {
  word: string;
  scrambled: string;
  tries: number;
}

export const game = defineGame<State>({
  id: "scramble",
  name: "Word Job",
  description: "Unscramble the word. Three tries.",
  aliases: ["word", "anagram"],

  start(user) {
    const word = pick(WORDS);
    const mixed = scramble(word);
    return {
      state: { word, scrambled: mixed, tries: 0 },
      reply: `${who(user, "Crew")}, letters got mixed.\nUnscramble: *${mixed.toUpperCase()}*\nThree tries.`,
    };
  },

  turn({ state, input }) {
    const tries = state.tries + 1;
    if (input === state.word) return win(`That's the word — *${state.word}*. Clean work.`, "scramble");
    if (tries >= 3) return lose(`Time's up. The word was *${state.word}*.`, "scramble");
    return next(
      `Not that one. ${triesLeft(3 - tries)}. Letters: *${state.scrambled.toUpperCase()}*`,
      { ...state, tries }
    );
  },
});
