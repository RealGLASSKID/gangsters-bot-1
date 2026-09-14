import { Command } from "../types";

const QUESTIONS = [
  ["Have unlimited data forever", "Have free food delivery for life"],
  ["Be able to speak every Nigerian language", "Be a world-class Afrobeats artist"],
  ["Never eat jollof again", "Never eat pounded yam again"],
  ["Live in Lagos forever", "Live in Abuja forever"],
  ["Always have network issues", "Always have NEPA issues"],
  ["Be famous on TikTok", "Be rich but anonymous"],
  ["Wake up early every day", "Sleep late every night"],
  ["Only listen to old school Naija music", "Only listen to new school Afrobeats"],
  ["Have a personal generator that never fails", "Have unlimited data that never finishes"],
  ["Be the funniest person in every room", "Be the smartest person in every room"],
  ["Never use WhatsApp again", "Never use Instagram again"],
  ["Always be 5 minutes late", "Always be 30 minutes early"],
  ["Eat only street food for a month", "Eat only home-cooked food for a month"],
  ["Be able to teleport anywhere in Nigeria", "Be able to freeze time for 10 seconds"],
  ["Win ₦10 million once", "Get ₦50,000 every month for life"],
  ["Have perfect English", "Have perfect Pidgin"],
  ["Be stuck in traffic every day but in a cool car", "Have no traffic but use okada forever"],
  ["Know every Naija gossip first", "Never hear any gossip at all"],
  ["Be a Nollywood star", "Be a top footballer for the Super Eagles"],
  ["Lose your phone for a week", "Lose your wallet for a week"],
];

const wyr: Command = {
  name: "wyr",
  description: "Would You Rather",
  aliases: ["wouldyourather"],
  category: "games",
  cooldown: 5,
  async execute(_ctx, reply) {
    const [a, b] = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    await reply(
      `🤔 *WOULD YOU RATHER?*\n\n1️⃣ ${a}\n\n      *OR*\n\n2️⃣ ${b}\n\nReply with 1 or 2 👇`
    );
  },
};

export default wyr;
