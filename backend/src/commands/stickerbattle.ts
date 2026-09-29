import { Command } from "../types";
import { getSession, setSession, clearSession } from "../games";
import { publicName, displayId } from "../utils/target";
import { resolveTargetJid } from "../utils/target";

const stickerbattle: Command = {
  name: "stickerbattle",
  aliases: ["sbattle", "stickerwar", "stickerduel"],
  description: "Start a sticker battle between two members",
  usage: "!stickerbattle @user1 @user2",
  category: "games",
  cooldown: 8,
  async execute(ctx, reply) {
    const session = getSession();
    if (session?.type === "stickerbattle") {
      await reply(
        `⚔️ A sticker battle is already on!\n` +
          `Players: *${session.playerNames.join(" vs ")}*\n` +
          `Use \`!stickers\` for the next challenge · \`!stickers end\` to stop.`
      );
      return;
    }
    if (session) {
      await reply("⏳ Another game is running. Finish it first.");
      return;
    }

    let p1 = ctx.mentionedJids[0];
    let p2 = ctx.mentionedJids[1];

    if (!p1 || !p2) {
      await reply(
        `🎨 *STICKER BATTLE*\n\n` +
          `Tag *two* members to start:\n` +
          `\`!stickerbattle @person1 @person2\`\n\n` +
          `Then use \`!stickers\` to drop challenges.`
      );
      return;
    }

    // Prefer DB/display names
    const n1 = publicName(null, p1);
    const n2 = publicName(null, p2);
    // Try push names from mentions context — limited; use displayId-style
    const name1 = ctx.args[0]?.startsWith("@") ? n1 : n1;
    const name2 = n2;

    setSession({
      type: "stickerbattle",
      players: [p1, p2],
      playerNames: [name1, name2],
      host: ctx.from,
      round: 0,
    });

    await reply({
      text:
        `🎨⚔️ *STICKER BATTLE*\n\n` +
        `It's on!\n` +
        `@${name1.split(" ")[0]}  vs  @${name2.split(" ")[0]}\n\n` +
        `Who has the deepest sticker pack? 👀\n` +
        `Type \`!stickers\` for a challenge.\n` +
        `Drop the matching sticker in chat — group decides the winner of each round.\n\n` +
        `_End anytime: \`!stickers end\`_`,
      mentions: [p1, p2],
    });
  },
};

export default stickerbattle;
