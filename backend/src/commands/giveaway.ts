import { Command } from "../types";
import {
  createGiveaway,
  getActiveGiveaway,
  joinGiveaway,
  getGiveawayEntries,
  endGiveaway,
} from "../database";

const giveaway: Command = {
  name: "giveaway",
  description: "Create or manage giveaways",
  usage: "!giveaway start <minutes> <prize> | join | end",
  cooldown: 5,
  async execute(ctx, reply) {
    const sub = ctx.args[0]?.toLowerCase();

    if (sub === "start") {
      if (!ctx.isAdmin && !ctx.isOwner) { await reply("Admin only."); return; }
      const minutes = parseInt(ctx.args[1], 10);
      const prize = ctx.args.slice(2).join(" ").trim();
      if (!minutes || minutes < 1 || minutes > 1440 || !prize) {
        await reply("Usage: !giveaway start <minutes> <prize>");
        return;
      }
      if (getActiveGiveaway()) { await reply("A giveaway is already active. End it first."); return; }
      const id = createGiveaway(prize, ctx.from, minutes);
      await reply(`🎁 *Giveaway started!*\nPrize: ${prize}\nDuration: ${minutes}m\nID: #${id}\n\nJoin with: !giveaway join`);
      return;
    }

    if (sub === "join") {
      const g = getActiveGiveaway();
      if (!g) { await reply("No active giveaway."); return; }
      if (g.ends_at <= Date.now()) { await reply("Giveaway already ended."); return; }
      const ok = joinGiveaway(g.id, ctx.from);
      if (!ok) { await reply("You already joined."); return; }
      const count = getGiveawayEntries(g.id).length;
      await reply(`✅ You're in! (${count} entries)\nPrize: ${g.prize}`);
      return;
    }

    if (sub === "end") {
      if (!ctx.isAdmin && !ctx.isOwner) { await reply("Admin only."); return; }
      const g = getActiveGiveaway();
      if (!g) { await reply("No active giveaway."); return; }
      const entries = getGiveawayEntries(g.id);
      if (entries.length === 0) {
        endGiveaway(g.id, null);
        await reply("Giveaway ended — no entries.");
        return;
      }
      const winner = entries[Math.floor(Math.random() * entries.length)];
      endGiveaway(g.id, winner);
      await reply(`🎁 *Giveaway ended!*\nPrize: ${g.prize}\nWinner: ${winner.split("@")[0]}\n(${entries.length} entries)`);
      return;
    }

    const g = getActiveGiveaway();
    if (!g) {
      await reply("No active giveaway.\nAdmin: !giveaway start <minutes> <prize>");
      return;
    }
    const left = Math.max(0, Math.round((g.ends_at - Date.now()) / 60000));
    const count = getGiveawayEntries(g.id).length;
    await reply(`🎁 *Active giveaway*\nPrize: ${g.prize}\nEntries: ${count}\nTime left: ~${left}m\n\n!giveaway join`);
  },
};
export default giveaway;
