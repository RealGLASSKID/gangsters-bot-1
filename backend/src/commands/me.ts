import { Command } from "../types";
import { idKind } from "../utils/ids";

const me: Command = {
  name: "me",
  description: "Show your WhatsApp JID / LID",
  aliases: ["whoami", "jid"],
  async execute(ctx, reply) {
    const { raw, pn, lid, primary } = ctx.sender;
    const lines = [
      `👤 *${ctx.senderName}*`,
      `─────────────`,
      `Primary: \`${primary}\``,
      `Kind: ${idKind(primary).toUpperCase()}`,
      `PN JID: ${pn ? `\`${pn}\`` : "_not on this message_"}`,
      `LID: ${lid ? `\`${lid}\`` : "_not on this message_"}`,
    ];
    if (raw && raw !== primary) lines.push(`Raw key: \`${raw}\``);
    lines.push(`Role: ${ctx.isOwner ? "owner" : ctx.isAdmin ? "admin" : "member"}`);
    lines.push(`Group: \`${ctx.groupJid || "n/a"}\``);
    lines.push("");
    lines.push("_Put your PN JID or LID in OWNER_JID if you are the owner._");
    await reply(lines.join("\n"));
  },
};

export default me;
