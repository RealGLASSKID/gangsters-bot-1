import { Command } from "../types";
import { listGroupRules } from "../database";

const grouprules: Command = {
  name: "grouprules",
  description: "List enforced group rules",
  aliases: ["listrules", "enforcedrules"],
  category: "general",
  cooldown: 5,
  async execute(_ctx, reply) {
    const rules = listGroupRules(true);
    if (!rules.length) {
      await reply("No enforced rules configured yet.");
      return;
    }
    const lines = rules.map((r, i) => `*${i + 1}. ${r.title}*\n${r.body}`);
    await reply(`📜 *ENFORCED RULES*\n\n${lines.join("\n\n")}`);
  },
};

export default grouprules;
