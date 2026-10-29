import { Command } from "../types";
import { getSession, setSession, clearSession } from "../games";
import { publicName } from "../utils/target";

const stickerbattle: Command = {
  name: "stickerbattle",
  aliases: ["sbattle", "stickerwar", "stickerduel"],
  description: "Start a sticker battle between two members",
  usage: "!stickerbattle @user1 @user2 | !stickerbattle end",
  category: "games",
  cooldown: 5,
  async execute(ctx, reply) {
    const session = getSession();
    const first = (ctx.args[0] || "").toLowerCase();

    if (first === "end" || first === "stop" || first === "cancel") {
      if (session) {
        const t = session.type;
        clearSession();
        await reply(`✅ Cleared *${t}*. You can start a new sticker battle.`);
      } else {
        await reply("No game was running.");
      }
      return;
    }

    if (session) {
      if (session.type === "stickerbattle") {
        await reply(
          `⚔️ Sticker battle already on!\n` +
            `Players: *${session.playerNames.join(" vs ")}*\n\n` +
            `Next: \`!stickers\`\n` +
            `End: \`!stickers end\` or \`!endgame\``
        );
        return;
      }
      await reply(
        `⏳ Another game is running: *${session.type}*\n\n` +
          `End it first:\n` +
          `• \`!endgame\`\n` +
          `• \`!stickerbattle end\`\n` +
          `• \`!stickers end\`\n\n` +
          `Then: \`!stickerbattle @a @b\``
      );
      return;
    }

    const p1 = ctx.mentionedJids[0];
    const p2 = ctx.mentionedJids[1];
    if (!p1 || !p2) {
      await reply(
        `🎨 *STICKER BATTLE*\n\n` +
          `Tag *two* members:\n\`!stickerbattle @person1 @person2\`\n\n` +
          `Then \`!stickers\` for challenges.\n` +
          `End: \`!stickers end\` · \`!endgame\``
      );
      return;
    }

    const name1 = publicName(null, p1);
    const name2 = publicName(null, p2);

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
        `It's on!\n*${name1}*  vs  *${name2}*\n\n` +
        `Type \`!stickers\` for a challenge.\n` +
        `Drop matching stickers — group judges each round.\n\n` +
        `_End: \`!stickers end\` · \`!endgame\`_`,
      mentions: [p1, p2],
    });
  },
};

export default stickerbattle;
