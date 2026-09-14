import { Command } from "../types";
import { displayId } from "../utils/target";

const tagall: Command = {
  name: "tagall",
  description: "Mention all members",
  aliases: ["hidetag", "everyone"],
  adminOnly: true,
  category: "admin",
  cooldown: 60,
  async execute(ctx, reply) {
    if (!ctx.actions || !ctx.groupJid) {
      await reply("Unavailable.");
      return;
    }
    const participants = await ctx.actions.getParticipants();
    if (participants.length === 0) {
      await reply("Couldn't fetch members.");
      return;
    }
    const mentions = participants.slice(0, 75);
    const note = ctx.args.join(" ").trim();
    const text =
      `${note || "Attention"}\n\n` +
      mentions.map((j) => `@${displayId(j)}`).join(" ");
    await reply({ text: `${text}\n\n(${mentions.length} members)`, mentions });
  },
};

export default tagall;
