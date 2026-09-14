import { Command } from "../types";
import { config } from "../config";

const LABELS: Record<string, string> = {
  identity: "Identity",
  general: "General",
  economy: "Economy",
  games: "Games",
  admin: "Admin",
  owner: "Owner",
};

function bucket(c: Command): string {
  if (c.category) return c.category;
  if (c.ownerOnly) return "owner";
  if (c.adminOnly) return "admin";
  return "general";
}

const help: Command = {
  name: "help",
  description: "List commands",
  category: "general",
  cooldown: 5,
  async execute(ctx, reply) {
    const { getAllCommands } = await import("./index");
    const cmds = getAllCommands().filter((c) => {
      if (c.ownerOnly && !ctx.isOwner) return false;
      if (c.adminOnly && !ctx.isAdmin) return false;
      return true;
    });

    const groups = new Map<string, string[]>();
    for (const c of cmds) {
      const key = bucket(c);
      const list = groups.get(key) || [];
      list.push(`!${c.name} — ${c.description}`);
      groups.set(key, list);
    }

    const order = ["identity", "general", "economy", "games", "admin", "owner"];
    const parts = [`*${config.botName}*`];
    for (const key of order) {
      const list = groups.get(key);
      if (!list?.length) continue;
      parts.push(`\n*${LABELS[key] || key}*`);
      parts.push(...list.sort());
    }

    const text = parts.join("\n");
    await reply(text.length < 3500 ? text : text.slice(0, 3480) + "\n…");
  },
};

export default help;
