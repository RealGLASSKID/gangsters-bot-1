import { Command } from "../types";

const STATEMENTS = [
  "Skipped school or class without permission",
  "Used 'network issue' as an excuse when I just didn't want to talk",
  "Danced in front of the mirror when nobody was watching",
  "Eaten food that fell on the floor (5-second rule)",
  "Pretended to know a song lyrics and messed up badly",
  "Sent a message to the wrong WhatsApp chat",
  "Stalked someone on social media for more than 10 minutes",
  "Laughed at a serious moment and couldn't stop",
  "Blamed NEPA for something that was actually my fault",
  "Eaten indigestion medicine like sweet",
  "Sung in the bathroom like I was on stage",
  "Pretended to be busy just to avoid a call",
  "Cried during a Nollywood movie",
  "Eaten garri plain when I was broke or hungry",
  "Used my mother's wrapper as a blanket",
  "Told a small lie to avoid wahala",
  "Checked my bank account more than 5 times in one day",
  "Acted like I understood a language I don't speak",
  "Slept during a church or mosque service",
  "Spent money I shouldn't have on food delivery",
];

const nhie: Command = {
  name: "nhie",
  description: "Never Have I Ever",
  aliases: ["never"],
  category: "games",
  cooldown: 4,
  async execute(_ctx, reply) {
    const s = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
    await reply(
      `🙈 *NEVER HAVE I EVER...*\n\n${s}\n\nPut a finger down if you have done it 👀\n(Or just type "guilty" / "innocent")`
    );
  },
};

export default nhie;
