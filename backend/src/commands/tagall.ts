import { Command } from "../types";

const tagall: Command = {
  name: "tagall",
  description: "Mention all members",
  adminOnly: true,
  cooldown: 60,
  async execute(ctx, reply) {
    if (!ctx.actions || !ctx.groupJid) { await reply("Unavailable."); return; }
    const participants = await ctx.actions.getParticipants();
    if (participants.length === 0) { await reply("Couldn't fetch members."); return; }
    const mentions = participants.slice(0, 50);
    const text = `📢 *Attention*\n\n` + mentions.map((j) => `@${j.split("@")[0]}`).join(" ");
    await reply(text + `\n\n(${mentions.length} members)`);
  },
};
export default tagall;
