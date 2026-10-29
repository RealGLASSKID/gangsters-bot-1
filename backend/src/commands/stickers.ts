import { Command } from "../types";
import { getSession, clearSession } from "../games";

const CHALLENGES: { cat: string; prompt: string }[] = [
  { cat: "Naija Creator", prompt: "Drop a *Gehgeh* sticker (or closest funny Naija creator sticker)!" },
  { cat: "Naija Creator", prompt: "Drop a *Carter Efe* vibe sticker!" },
  { cat: "Naija Creator", prompt: "Drop a *Peller* sticker if you have one!" },
  { cat: "Naija Creator", prompt: "Drop a *Kolu* / skit-man funny sticker!" },
  { cat: "Naija Meme", prompt: "Drop a classic *Naija meme* sticker!" },
  { cat: "Naija Meme", prompt: "Drop a sticker that says *“network issue”* energy 📶❌" },
  { cat: "Football", prompt: "Drop any *football club* sticker!" },
  { cat: "Football", prompt: "Drop a *Messi* sticker or meme!" },
  { cat: "Football", prompt: "Drop a *Ronaldo* sticker or meme!" },
  { cat: "Football", prompt: "Drop a *Super Eagles* sticker!" },
  { cat: "Animals", prompt: "Drop a *funny animal* sticker!" },
  { cat: "Animals", prompt: "Drop a sticker of an animal *dancing*!" },
  { cat: "Anime", prompt: "Drop an *anime* sticker!" },
  { cat: "Anime", prompt: "Drop a *male anime character* sticker!" },
  { cat: "Anime", prompt: "Drop a *female anime character* sticker!" },
  { cat: "Mood", prompt: "Drop a *sad* sticker 😔" },
  { cat: "Mood", prompt: "Drop a *happy / laughing* sticker 😂" },
  { cat: "Mood", prompt: "Drop an *angry* sticker 😡" },
  { cat: "Motivation", prompt: "Drop a *motivation / hustle* sticker!" },
  { cat: "Party", prompt: "Drop a *party / dance / vibes* sticker!" },
  { cat: "Money", prompt: "Drop a *money / rich* sticker 💰" },
  { cat: "Random", prompt: "Drop your *rarest* sticker!" },
  { cat: "Random", prompt: "Drop a sticker that describes *Monday morning*!" },
];

const stickers: Command = {
  name: "stickers",
  aliases: ["stickchallenge", "stickerchallenge"],
  description: "Next sticker challenge, or end any stuck game",
  usage: "!stickers | !stickers end",
  category: "games",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg = (ctx.args[0] || "").toLowerCase();
    const session = getSession();

    if (arg === "end" || arg === "stop" || arg === "cancel") {
      if (!session) {
        await reply("No active game to end.");
        return;
      }
      const t = session.type;
      clearSession();
      await reply(
        t === "stickerbattle"
          ? "🏁 Sticker battle ended. Respect to both packs 🎨"
          : `✅ Cleared stuck game (*${t}*). Start fresh anytime.`
      );
      return;
    }

    if (!session || session.type !== "stickerbattle") {
      if (session) {
        await reply(
          `⏳ Active game is *${session.type}*, not sticker battle.\n` +
            `Clear: \`!endgame\` or \`!stickers end\`\n` +
            `Then: \`!stickerbattle @a @b\``
        );
        return;
      }
      await reply(
        `🎨 No active sticker battle.\n\n` +
          `Start: \`!stickerbattle @person1 @person2\`\n` +
          `Then: \`!stickers\``
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
        `_Drop your sticker — group judges!_\n` +
        `Next: \`!stickers\` · End: \`!stickers end\``,
      mentions: session.players,
    });
  },
};

export default stickers;
