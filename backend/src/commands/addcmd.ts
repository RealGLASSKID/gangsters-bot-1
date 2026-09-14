import { Command } from "../types";
import { setCustomCommand } from "../database";

const addcmd: Command = {
  name: "addcmd",
  description: "Create a custom command (admin)",
  usage: "!addcmd name = response text here",
  adminOnly: true,
  category: "admin",
  cooldown: 3,
  async execute(ctx, reply) {
    const body = ctx.body.slice("addcmd".length).trim();
    // Support: !addcmd rules = No spam...
    const eq = body.indexOf("=");
    if (eq === -1) {
      await reply(
        "Usage:\n`!addcmd name = your response text`\n\nExample:\n`!addcmd rules = No insults. No spam. Respect everyone.`"
      );
      return;
    }
    const name = body.slice(0, eq).trim();
    const response = body.slice(eq + 1).trim();
    if (!name || !response) {
      await reply("Both name and response are required.");
      return;
    }
    const ok = setCustomCommand(name, response, ctx.from);
    if (!ok) {
      await reply("Invalid command name. Use letters/numbers only.");
      return;
    }
    await reply(`✅ Custom command created:\n*!${name.toLowerCase().replace(/[^a-z0-9_]/g, "")}*\n\nAnyone can now type it.`);
  },
};

export default addcmd;
