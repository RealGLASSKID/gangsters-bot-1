import { Command } from "../types";

const ping: Command = {
  name: "ping",
  description: "Check if the bot is alive",
  cooldown: 3,
  async execute(_ctx, reply) {
    await reply("pong");
  },
};

export default ping;
