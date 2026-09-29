import { Command } from "../types";
import { getSession, clearSession } from "../games";

const CHALLENGES: { cat: string; prompt: string }[] = [
  // Naija creators / memes
  { cat: "Naija Creator", prompt: "Drop a *Gehgeh* sticker (or closest funny Naija creator sticker)!" },
  { cat: "Naija Creator", prompt: "Drop a *Carter Efe* vibe sticker!" },
  { cat: "Naija Creator", prompt: "Drop a *Peller* sticker if you have one!" },
  { cat: "Naija Creator", prompt: "Drop a *Kolu* / skit-man funny sticker!" },
  { cat: "Naija Meme", prompt: "Drop a classic *Naija meme* sticker!" },
  { cat: "Naija Meme", prompt: "Drop a sticker that says *“network issue”* energy 📶❌" },
  { cat: "Naija Meme", prompt: "Drop a *jollof / food* funny sticker!" },

  // Football / sports
  { cat: "Football", prompt: "Drop any *football club* sticker (EPL, La Liga, NPFL…)." },
  { cat: "Football", prompt: "Drop a *Messi* sticker or meme!" },
  { cat: "Football", prompt: "Drop a *Ronaldo* sticker or meme!" },
  { cat: "Football", prompt: "Drop a *Super Eagles* / Nigeria football sticker!" },
  { cat: "Sports", prompt: "Drop any *sports* sticker (ball, trophy, athlete)!" },

  // Animals
  { cat: "Animals", prompt: "Drop a *funny animal* sticker (cat, dog, monkey…)." },
  { cat: "Animals", prompt: "Drop a sticker of an animal *dancing*!" },
  { cat: "Animals", prompt: "Drop a sticker of an animal *running* or *reacting*!" },

  // Anime
  { cat: "Anime", prompt: "Drop an *anime* sticker (any series)!" },
  { cat: "Anime", prompt: "Drop a *male anime character* sticker!" },
  { cat: "Anime", prompt: "Drop a *female anime character* sticker!" },

  // Mood
  { cat: "Mood", prompt: "Drop a *sad* sticker 😔" },
  { cat: "Mood", prompt: "Drop a *happy / laughing* sticker 😂" },
  { cat: "Mood", prompt: "Drop an *angry* sticker 😡" },
  { cat: "Mood", prompt: "Drop a *love / heart* sticker 😍" },
  { cat: "Mood", prompt: "Drop a *shocked* sticker 😱" },

  // Motivation / roast-safe
  { cat: "Motivation", prompt: "Drop a *motivation / hustle* sticker!" },
  { cat: "Roast (clean)", prompt: "Drop a *friendly roast* sticker (keep it clean)!" },
  { cat: "Reaction", prompt: "Drop your best *side-eye / eyeroll* sticker!" },
  { cat: "Reaction", prompt: "Drop a *“I’m done” / melting* sticker!" },
  { cat: "Party", prompt: "Drop a *party / dance / vibes* sticker!" },
  { cat: "Money", prompt: "Drop a *money / rich* sticker 💰" },
  { cat: "Random", prompt: "Drop your *rarest* sticker!" },
  { cat: "Random", prompt: "Drop a sticker you’d use to end an argument!" },
  { cat: "Random", prompt: "Drop a sticker that describes *Monday morning*!" },
];

const stickers: Command = {
  name: "stickers",
  aliases: ["stickchallenge", "stickerchallenge"],
  description: "Drop next sticker challenge (during sticker battle)",
  usage: "!stickers | !stickers end",
  category: "games",
  cooldown: 4,
  async execute(ctx, reply) {
    const arg = (ctx.args[0] || "").toLowerCase();
    const session = getSession();

    if (arg === "end" || arg === "stop" || arg === "cancel") {
      if (session?.type === "stickerbattle") {
        clearSession();
        await reply("🏁 Sticker battle ended. Respect to both packs 🎨");
      } else {
        await reply("No sticker battle is running.\nStart with `!stickerbattle @a @b`");
      }
      return;
    }

    if (!session || session.type !== "stickerbattle") {
      await reply(
        `🎨 No active sticker battle.\n\n` +
          `Start one:\n\`!stickerbattle @person1 @person2\`\n` +
          `Then \`!stickers\` for challenges.`
      );
      return;
    }

    session.round += 1;
    const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    const [n1, n2] = session.playerNames;

    await reply({
      text:
        `🎨 *STICKER ROUND ${session.round}*\n` +
        `📂 Category: *${c.cat}*\n\n` +
        `${c.prompt}\n\n` +
        `Fighters: *${n1}* vs *${n2}*\n` +
        `_Drop your sticker now — group judges the round!_\n` +
        `Next: \`!stickers\` · End: \`!stickers end\``,
      mentions: session.players,
    });
  },
};

export default stickers;
