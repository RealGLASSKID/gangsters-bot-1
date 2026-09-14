import { Command } from "../types";
import { listCustomCommands } from "../database";

const listcmd: Command = {
  name: "listcmd",
  description: "List all custom commands",
  aliases: ["cmds", "customcmds"],
  category: "admin",
  cooldown: 5,
  async execute(_ctx, reply) {
    const list = listCustomCommands();
    if (!list.length) {
      await reply("No custom commands yet.\nAdmins can create one with:\n`!addcmd name = response`");
      return;
    }
    const lines = list.map((c) => `• *!${c.name}*`);
    await reply(`📋 *Custom Commands*\n\n${lines.join("\n")}`);
  },
};

export default listcmd;
