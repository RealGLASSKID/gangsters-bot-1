import { Command } from "../types";

const views: Command = {
  name: "views",
  description: "Message view count (not available on WhatsApp groups)",
  usage: "Reply to a message with !views",
  aliases: ["viewcount", "seenby"],
  adminOnly: true,
  category: "admin",
  cooldown: 5,
  async execute(ctx, reply) {
    if (!ctx.quoted) {
      await reply(
        "Reply to a message with `!views`.\n\n" +
          "⚠️ WhatsApp does *not* give bots a real “who viewed this” count for group messages " +
          "(unlike Channels). That data is not available through the bot API."
      );
      return;
    }
    await reply(
      "⚠️ *View count unavailable*\n\n" +
        "WhatsApp does not expose how many people opened a normal group message to bots.\n\n" +
        "What *is* available:\n" +
        "• `!online` — recently active members\n" +
        "• `!rank @user` / `!profile @user` — activity stats\n" +
        "• Reactions on a message (you can see those in the app)"
    );
  },
};

export default views;
