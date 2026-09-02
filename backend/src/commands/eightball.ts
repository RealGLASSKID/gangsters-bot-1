import { Command } from "../types";
import { EIGHT_BALL } from "../games";

const eightball: Command = {
  name: "8ball",
  description: "Ask the magic 8-ball",
  usage: "!8ball <question>",
  cooldown: 3,
  async execute(ctx, reply) {
    if (ctx.args.length === 0) { await reply("Usage: !8ball <question>"); return; }
    await reply(`🎱 ${EIGHT_BALL[Math.floor(Math.random() * EIGHT_BALL.length)]}`);
  },
};
export default eightball;
