import { Command } from "../types";

const STATEMENTS = [
  "Put a finger down if you have ever used 'network issue' as an excuse.",
  "Put a finger down if you have eaten food that fell on the floor.",
  "Put a finger down if you have sung in the bathroom like a star.",
  "Put a finger down if you have checked your bank balance more than 3 times in one day.",
  "Put a finger down if you have laughed at the wrong time.",
  "Put a finger down if you have sent a message to the wrong person.",
  "Put a finger down if you have pretended to be busy to avoid someone.",
  "Put a finger down if you have danced when nobody was watching.",
  "Put a finger down if you have cried during a movie.",
  "Put a finger down if you have blamed NEPA for something that was your fault.",
  "Put a finger down if you have eaten garri plain before.",
  "Put a finger down if you still sleep with a soft toy or pillow in a special way.",
  "Put a finger down if you have stayed up all night scrolling.",
  "Put a finger down if you have said 'I'm almost there' when you hadn't even left.",
];

const putafinger: Command = {
  name: "putafinger",
  description: "Put a Finger Down game",
  aliases: ["finger", "pafd"],
  category: "games",
  cooldown: 5,
  async execute(_ctx, reply) {
    const s = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
    await reply(`👇 *PUT A FINGER DOWN*\n\n${s}`);
  },
};

export default putafinger;
