import { Command } from "../types";
import { displayId } from "../utils/target";

const admins: Command = {
  name: "admins",
  description: "List group admins",
  category: "general",
  cooldown: 8,
  async execute(ctx, reply) {
    if (!ctx.actions) {
      await reply("Only works in the group.");
      return;
    }
    const info = await ctx.actions.getGroupInfo();
    if (!info) {
      await reply("Couldn't load group info.");
      return;
    }
    const list = info.participants.filter((p) => p.admin);
    if (list.length === 0) {
      await reply("No admins found.");
      return;
    }
    const mentions = list.map((p) => p.id);
    const lines = list.map((p) => `• @${displayId(p.id)}${p.admin === "superadmin" ? " (owner)" : ""}`);
    await reply({ text: `*Group admins*\n${lines.join("\n")}`, mentions });
  },
};

export default admins;
