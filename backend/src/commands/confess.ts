import { Command } from "../types";

const confess: Command = {
  name: "confess",
  description: "Anonymous confession (no name shown)",
  usage: "!confess <message>",
  cooldown: 30,
  async execute(ctx, reply) {
    const text = ctx.args.join(" ").trim();
    if (!text || text.length < 3) { await reply("Usage: !confess <message>"); return; }
    if (text.length > 500) { await reply("Max 500 characters."); return; }
    await reply(`😶 *Anonymous confession*\n\n${text}`);
  },
};
export default confess;
