import { Command } from "../types";
import { setBirthday, ensureUser } from "../database";

const birthday: Command = {
  name: "birthday",
  description: "Set your birthday (MM-DD)",
  usage: "!birthday MM-DD",
  cooldown: 5,
  async execute(ctx, reply) {
    const raw = ctx.args[0];
    if (!raw || !/^\d{1,2}-\d{1,2}$/.test(raw)) {
      await reply("Usage: !birthday MM-DD\nExample: !birthday 03-15");
      return;
    }
    const [m, d] = raw.split("-").map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) { await reply("Invalid date."); return; }
    const mmdd = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    ensureUser(ctx.from, ctx.senderName);
    setBirthday(ctx.from, mmdd);
    await reply(`🎂 Birthday set to *${mmdd}*`);
  },
};
export default birthday;
