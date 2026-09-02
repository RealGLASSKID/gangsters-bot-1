import { Command } from "../types";
import { FACTS } from "../games";

const fact: Command = {
  name: "fact",
  description: "Random fact",
  cooldown: 5,
  async execute(_ctx, reply) {
    await reply(`📌 ${FACTS[Math.floor(Math.random() * FACTS.length)]}`);
  },
};
export default fact;
