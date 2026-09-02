import { Command } from "../types";
import { getSession, setSession, clearSession } from "../games";
import { addCoins, ensureUser } from "../database";

const guess: Command = {
  name: "guess",
  description: "Guess the number 1-50",
  usage: "!guess start | !guess <number>",
  cooldown: 3,
  async execute(ctx, reply) {
    const arg = ctx.args[0]?.toLowerCase();
    if (arg === "start") {
      if (getSession()) { await reply("A game is already running. Finish it first."); return; }
      setSession({ type: "guess", number: 1 + Math.floor(Math.random() * 50), tries: 0, host: ctx.from });
      await reply("🎲 Guess the number between *1 and 50*!\nType `!guess <n>`");
      return;
    }
    const session = getSession();
    if (!session || session.type !== "guess") { await reply("No active game. Start with `!guess start`"); return; }
    const n = parseInt(arg || "", 10);
    if (!n || n < 1 || n > 50) { await reply("Enter a number 1–50: `!guess <n>`"); return; }
    session.tries++;
    if (n === session.number) {
      ensureUser(ctx.from, ctx.senderName);
      const reward = Math.max(10, 60 - session.tries * 5);
      addCoins(ctx.from, reward);
      clearSession();
      await reply(`🎯 Correct! It was *${n}*\nTries: ${session.tries} · +${reward} GC`);
      return;
    }
    if (session.tries >= 8) {
      clearSession();
      await reply(`❌ Out of tries. The number was *${session.number}*`);
      return;
    }
    await reply(`${n < session.number ? "⬆️ Higher" : "⬇️ Lower"} (${session.tries}/8)`);
  },
};
export default guess;
