import { Command } from "../types";

const help: Command = {
  name: "help",
  description: "List commands",
  cooldown: 5,
  async execute(ctx, reply) {
    // Lazy import avoids circular dependency with commands/index
    const { getAllCommands } = await import("./index");
    const cmds = getAllCommands()
      .filter((c) => {
        if (c.ownerOnly && !ctx.isOwner) return false;
        if (c.adminOnly && !ctx.isAdmin) return false;
        return true;
      })
      .map((c) => `!${c.name} — ${c.description}`)
      .sort();

    const text = `*GANGSTER BOT*\n\n${cmds.join("\n")}`;
    await reply(text.length < 3500 ? text : cmds.slice(0, 25).join("\n") + "\n…");
  },
};

export default help;
