import { Command } from "../types";

const QUESTIONS = [
  "Become famous first?",
  "Get rich first?",
  "Survive longest without data?",
  "Start a successful business?",
  "Travel out of Nigeria first?",
  "Become a content creator?",
  "Get married first?",
  "Become a group admin somewhere?",
  "Cry during a movie?",
  "Win a dancing competition?",
  "Become a chef?",
  "Start speaking pure English only?",
  "Become the group clown permanently?",
  "Buy a house first?",
  "Become a footballer or sports star?",
  "Open a successful food business?",
  "Become a pastor or imam?",
  "Go viral on social media?",
  "Become the most serious person here?",
  "Never leave this group?",
];

const mostlikely: Command = {
  name: "mostlikely",
  description: "Who is most likely to...",
  aliases: ["mlt", "whoislikely"],
  category: "games",
  cooldown: 5,
  async execute(_ctx, reply) {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    await reply(
      `👀 *WHO IS MOST LIKELY TO...*\n\n${q}\n\nTag the person or just shout the name 😂`
    );
  },
};

export default mostlikely;
