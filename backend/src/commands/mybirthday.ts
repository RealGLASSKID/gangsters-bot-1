import { Command } from "../types";
import { getUser } from "../database";

const mybirthday: Command = {
  name: "mybirthday",
  description: "Show your saved birthday",
  cooldown: 5,
  async execute(ctx, reply) {
    const user = getUser(ctx.from);
    if (!user?.birthday) { await reply("No birthday set. Use `!birthday MM-DD`"); return; }
    await reply(`🎂 Your birthday: *${user.birthday}*`);
  },
};
export default mybirthday;
