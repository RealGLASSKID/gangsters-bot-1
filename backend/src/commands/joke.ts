import { Command } from "../types";
import { JOKES } from "../games";

const joke: Command = {
  name: "joke",
  description: "Random joke",
  cooldown: 5,
  async execute(_ctx, reply) {
    await reply(JOKES[Math.floor(Math.random() * JOKES.length)]);
  },
};
export default joke;
