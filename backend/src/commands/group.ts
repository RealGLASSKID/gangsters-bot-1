import { Command } from "../types";

const group: Command = {
  name: "group",
  description: "Show this group's JID and info",
  aliases: ["gid", "groupid"],
  async execute(ctx, reply) {
    if (!ctx.groupJid || !ctx.actions) {
      await reply("Not in a group.");
      return;
    }

    const info = await ctx.actions.getGroupInfo();
    if (!info) {
      await reply(`👥 Group JID:\n\`${ctx.groupJid}\`\n\n_Couldn't load extra metadata._`);
      return;
    }

    const admins = info.participants.filter((p) => p.admin).length;
    const created = info.created ? new Date(info.created * 1000).toISOString().slice(0, 10) : "unknown";

    const lines = [
      `👥 *${info.subject}*`,
      `─────────────`,
      `Group JID: \`${info.jid}\``,
      `Members: ${info.size} (${admins} admin${admins === 1 ? "" : "s"})`,
      `Created: ${created}`,
      `Owner: ${info.owner ? `\`${info.owner}\`` : "unknown"}`,
    ];
    if (info.ownerPn && info.ownerPn !== info.owner) {
      lines.push(`Owner PN: \`${info.ownerPn}\``);
    }
    if (info.addressingMode) lines.push(`Addressing: ${info.addressingMode}`);
    lines.push(`Announce-only: ${info.announce ? "yes" : "no"}`);
    lines.push(`Restrict: ${info.restrict ? "yes" : "no"}`);
    if (info.desc) {
      const desc = info.desc.length > 240 ? info.desc.slice(0, 237) + "…" : info.desc;
      lines.push("", desc);
    }
    lines.push("");
    lines.push("_Put this Group JID in GROUP_JID / config.groupJid_");
    await reply(lines.join("\n"));
  },
};

export default group;
