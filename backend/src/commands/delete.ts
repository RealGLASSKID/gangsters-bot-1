import { Command } from "../types";

const del: Command = {
  name: "delete",
  description: "Delete the quoted message",
  usage: "Reply to a message with !delete",
  aliases: ["del", "d"],
  adminOnly: true,
  category: "admin",
  cooldown: 2,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Delete only works in the group.");
      return;
    }
    if (!ctx.quoted) {
      await reply("Reply to the message you want deleted, then send !delete.");
      return;
    }
    const ok = await ctx.actions.deleteMessage(ctx.quoted);
    if (!ok) {
      await reply("Could not delete that message. Make the bot a group admin.");
      return;
    }
    await reply("Message deleted.");
  },
};

export default del;
