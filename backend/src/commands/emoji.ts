import { Command } from "../types";
import { getSession, setSession, clearSession } from "../games";
import { addCoins, ensureUser } from "../database";

type EmojiPuzzle = {
  emojis: string;
  answers: string[];
  hint?: string;
  style?: "expression" | "phrase"; // expression = "what feeling is this?"
};

const PUZZLES: EmojiPuzzle[] = [
  // ── Expressions / feelings (😔 → sad) ──
  { emojis: "😔", answers: ["sad", "unhappy", "down", "sorrowful"], style: "expression", hint: "Not a happy face" },
  { emojis: "😂", answers: ["laughing", "laugh", "funny", "lol", "haha", "lmao"], style: "expression", hint: "Very funny" },
  { emojis: "😡", answers: ["angry", "mad", "annoyed", "furious", "pissed"], style: "expression", hint: "Hot head" },
  { emojis: "😍", answers: ["love", "in love", "loving", "adore", "crush"], style: "expression", hint: "Heart eyes" },
  { emojis: "😱", answers: ["shocked", "shock", "scared", "surprised", "afraid", "fear"], style: "expression", hint: "Mouth open" },
  { emojis: "😴", answers: ["sleepy", "sleeping", "tired", "sleep", "bored"], style: "expression", hint: "Zzz" },
  { emojis: "🤔", answers: ["thinking", "confused", "hmm", "wondering", "curious"], style: "expression", hint: "Hand on chin" },
  { emojis: "😭", answers: ["crying", "sobbing", "tears", "very sad", "bawling"], style: "expression", hint: "Lots of tears" },
  { emojis: "😏", answers: ["smirk", "smirking", "sassy", "cheeky", "mischievous"], style: "expression", hint: "Side smile" },
  { emojis: "🙄", answers: ["eyeroll", "eye roll", "annoyed", "whatever", "sarcastic"], style: "expression", hint: "Attitude" },
  { emojis: "🥺", answers: ["pleading", "puppy eyes", "please", "begging", "cute sad"], style: "expression", hint: "Soft eyes" },
  { emojis: "😎", answers: ["cool", "confident", "swag", "chill"], style: "expression", hint: "Sunglasses" },
  { emojis: "🤢", answers: ["sick", "nauseous", "disgusted", "gross", "ill"], style: "expression", hint: "Green face" },
  { emojis: "🥶", answers: ["cold", "freezing", "frozen"], style: "expression", hint: "Temperature" },
  { emojis: "🥵", answers: ["hot", "heat", "sweating", "overheating"], style: "expression", hint: "Temperature" },
  { emojis: "😇", answers: ["angel", "innocent", "holy", "sweet", "blessed"], style: "expression", hint: "Halo" },
  { emojis: "😈", answers: ["devil", "naughty", "evil", "mischief", "bad"], style: "expression", hint: "Horns" },
  { emojis: "🫣", answers: ["shy", "embarrassed", "peeking", "awkward", "hiding"], style: "expression", hint: "Peeking" },
  { emojis: "😤", answers: ["frustrated", "huffing", "annoyed", "steam", "fed up"], style: "expression", hint: "Steam nose" },
  { emojis: "🤩", answers: ["amazed", "starstruck", "excited", "wow", "impressed"], style: "expression", hint: "Star eyes" },
  { emojis: "🫠", answers: ["melting", "overwhelmed", "done", "soft", "embarrassed"], style: "expression", hint: "Melting away" },
  { emojis: "😬", answers: ["awkward", "nervous", "cringe", "uncomfortable", "oops"], style: "expression", hint: "Tight smile" },
  { emojis: "🫡", answers: ["salute", "respect", "yes sir", "got it", "ok"], style: "expression", hint: "Military vibe" },
  { emojis: "🫶", answers: ["love", "care", "heart hands", "support"], style: "expression", hint: "Hands heart" },
  { emojis: "💀", answers: ["dead", "dying", "funny", "im dead", "lmao"], style: "expression", hint: "Internet slang" },

  // ── Phrase / movie / food (mixed) ──
  { emojis: "🦁 👑", answers: ["lion king", "the lion king"], style: "phrase", hint: "Disney classic" },
  { emojis: "🕷️ 👨", answers: ["spiderman", "spider-man", "spider man"], style: "phrase", hint: "Marvel hero" },
  { emojis: "🦇 👨", answers: ["batman", "bat man"], style: "phrase", hint: "Gotham" },
  { emojis: "🧊 🧊 🧊", answers: ["frozen"], style: "phrase", hint: "Disney ice" },
  { emojis: "🐟 🔍", answers: ["finding nemo", "nemo"], style: "phrase", hint: "Pixar fish" },
  { emojis: "⭐ ⚔️", answers: ["star wars"], style: "phrase", hint: "Galaxy far away" },
  { emojis: "🚢 ❄️ 💔", answers: ["titanic"], style: "phrase", hint: "Ship movie" },
  { emojis: "🍚 🍅 🌶️", answers: ["jollof", "jollof rice"], style: "phrase", hint: "Naija party food" },
  { emojis: "🥩 🌶️ 🔥", answers: ["suya"], style: "phrase", hint: "Street meat" },
  { emojis: "🥣 🌱", answers: ["egusi", "egusi soup"], style: "phrase", hint: "Soup with seeds" },
  { emojis: "🍌 🍳", answers: ["dodo", "fried plantain", "plantain"], style: "phrase", hint: "Sweet side" },
  { emojis: "🏙️ 🚦 🚌", answers: ["lagos"], style: "phrase", hint: "No sleep city" },
  { emojis: "🦅 🇳🇬", answers: ["super eagles", "nigeria"], style: "phrase", hint: "Football" },
  { emojis: "🎬 🇳🇬", answers: ["nollywood"], style: "phrase", hint: "Movie industry" },
  { emojis: "🕌 🏛️", answers: ["abuja"], style: "phrase", hint: "Capital city" },
  { emojis: "📱 📶 ❌", answers: ["network", "no network", "offline", "poor network"], style: "phrase", hint: "Naija struggle" },
  { emojis: "🛵 📦", answers: ["delivery", "dispatch", "okada", "courier"], style: "phrase", hint: "How package moves" },
  { emojis: "🎤 🎧 🎵", answers: ["music", "singing", "concert", "afrobeats"], style: "phrase", hint: "Sound" },
  { emojis: "💰 🤑 💵", answers: ["money", "rich", "wealth"], style: "phrase", hint: "Cash" },
  { emojis: "🎂 🎉", answers: ["birthday", "party"], style: "phrase", hint: "Celebration" },
  { emojis: "⚽ 🏆", answers: ["football", "soccer", "world cup"], style: "phrase", hint: "Sport" },
  { emojis: "💍 👰 🤵", answers: ["wedding", "marriage"], style: "phrase", hint: "Big day" },
  { emojis: "🔥 💃 🎶", answers: ["party", "club", "dance", "vibes"], style: "phrase", hint: "Weekend mood" },
  { emojis: "📚 ✏️ 🧠", answers: ["study", "school", "exam", "reading"], style: "phrase", hint: "Education" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(guess: string, answers: string[]): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return answers.some((a) => {
    const ans = normalize(a);
    return g === ans || g.includes(ans) || ans.includes(g);
  });
}

const emoji: Command = {
  name: "emoji",
  aliases: ["emojiquiz", "guessemoji", "emote"],
  description: "Guess the expression or phrase from emojis",
  usage: "!emoji | !emoji <answer>",
  category: "games",
  cooldown: 3,
  async execute(ctx, reply) {
    const session = getSession();

    if (ctx.args.length > 0 && session?.type === "emoji") {
      const guess = ctx.args.join(" ");
      session.tries += 1;

      if (isCorrect(guess, session.answers)) {
        ensureUser(ctx.from, ctx.senderName);
        const reward = Math.max(15, 40 - session.tries * 3);
        addCoins(ctx.from, reward);
        const ans = session.answers[0];
        clearSession();
        await reply(
          `✅ *Correct!* *${ctx.senderName}*\n\n` +
            `Answer: *${ans}*\n` +
            `Tries: ${session.tries} · +${reward} GC 💰`
        );
        return;
      }

      if (session.tries >= 6) {
        const ans = session.answers[0];
        clearSession();
        await reply(`❌ Time's up.\nThe answer was: *${ans}*`);
        return;
      }

      await reply(`❌ Wrong. (${session.tries}/6)\nTry again: \`!emoji <answer>\``);
      return;
    }

    if (session) {
      await reply("⏳ A game is already running. Finish it first.");
      return;
    }

    const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    setSession({
      type: "emoji",
      answers: puzzle.answers,
      host: ctx.from,
      tries: 0,
    });

    const isExpr = puzzle.style === "expression";
    let text = isExpr
      ? `🎭 *EMOJI EXPRESSION*\n\n${puzzle.emojis}\n\nWhat expression / feeling is this?\nReply: \`!emoji <answer>\`\nExample: \`!emoji sad\``
      : `🧩 *EMOJI GUESS*\n\n${puzzle.emojis}\n\nWhat is this?\nReply: \`!emoji <your answer>\``;

    text += `\n\nMax 6 tries · first correct wins GC 🔥`;
    if (puzzle.hint) text += `\n💡 Hint: _${puzzle.hint}_`;

    await reply(text);
  },
};

export default emoji;
