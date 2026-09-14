import { Command } from "../types";

const PROMPTS = [
  "Would you smash or pass: Someone who can cook perfect jollof but always late?",
  "Smash or pass: A person who always has data but never replies on time?",
  "Smash or pass: Someone who speaks pure Pidgin and makes you laugh non-stop?",
  "Smash or pass: A person who can fix any generator but can't dance?",
  "Smash or pass: Someone who knows every Naija gossip but is always calm?",
  "Smash or pass: A quiet person who suddenly turns into a comedian?",
  "Smash or pass: Someone who always has the right sticker for every situation?",
  "Smash or pass: A person who can eat pepper soup at any time of the day?",
  "Smash or pass: Someone who never runs out of banter?",
  "Smash or pass: A person who always brings the group back when things get too serious?",
];

const sop: Command = {
  name: "sop",
  description: "Smash or Pass (fun group game)",
  aliases: ["smashorpass"],
  category: "games",
  cooldown: 5,
  async execute(ctx, reply) {
    // If someone is mentioned, use them, otherwise use a random prompt
    if (ctx.mentionedJids.length > 0) {
      await reply(
        `😏 *SMASH OR PASS*\n\nWhat do you think about the mentioned person?\n\nReply with *SMASH* or *PASS* 👀`
      );
      return;
    }

    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    await reply(`😏 *SMASH OR PASS*\n\n${prompt}\n\nReply with *SMASH* or *PASS*`);
  },
};

export default sop;
