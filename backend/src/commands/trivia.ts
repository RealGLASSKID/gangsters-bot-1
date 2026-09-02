import { Command } from "../types";
import { TRIVIA, getSession, setSession, clearSession } from "../games";
import { addCoins, ensureUser } from "../database";

const trivia: Command = {
  name: "trivia",
  description: "Start or answer trivia",
  usage: "!trivia | !trivia <answer>",
  cooldown: 3,
  async execute(ctx, reply) {
    const session = getSession();
    if (ctx.args.length > 0 && session?.type === "trivia") {
      const answer = ctx.args.join(" ").toLowerCase().trim();
      if (answer === session.answer || session.answer.includes(answer) || answer.includes(session.answer)) {
        ensureUser(ctx.from, ctx.senderName);
        addCoins(ctx.from, 30);
        clearSession();
        await reply(`✅ Correct, *${ctx.senderName}*! +30 GC`);
      } else {
        await reply("❌ Wrong. Try again or wait for someone else.");
      }
      return;
    }
    if (session) { await reply("A game is already running."); return; }
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    setSession({ type: "trivia", answer: q.a, host: ctx.from });
    await reply(`🧠 *Trivia*\n\n${q.q}\n\nAnswer with: !trivia <answer>`);
  },
};
export default trivia;
