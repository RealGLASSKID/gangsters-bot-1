import { Command } from "../types";
import { deleteCustomCommand } from "../database";

const delcmd: Command = {
  name: "delcmd",
  description: "Delete a custom command (admin)",
  usage: "!delcmd name",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const name = ctx.args[0];
    if (!name) {
      await reply("Usage: `!delcmd name`");
      return;
    }
    const ok = deleteCustomCommand(name);
    if (!ok) {
      await reply(`No custom command named *${name}* found.`);
      return;
    }
    await reply(`🗑️ Deleted custom command *!${name.toLowerCase()}*`);
  },
};

export default delcmd;
