export interface TriviaQ {
  q: string;
  a: string;
}

export const TRIVIA: TriviaQ[] = [
  { q: "What is the capital of France?", a: "paris" },
  { q: "How many continents are there?", a: "7" },
  { q: "What planet is known as the Red Planet?", a: "mars" },
  { q: "Who wrote Romeo and Juliet?", a: "shakespeare" },
  { q: "What is 12 x 12?", a: "144" },
  { q: "What gas do plants absorb?", a: "carbon dioxide" },
  { q: "Largest ocean on Earth?", a: "pacific" },
  { q: "How many sides does a hexagon have?", a: "6" },
  { q: "What is the chemical symbol for gold?", a: "au" },
  { q: "In what year did WW2 end?", a: "1945" },
];

export const JOKES = [
  "Why don't skeletons fight each other? They don't have the guts.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Why don't eggs tell jokes? They'd crack each other up.",
];

export const FACTS = [
  "Octopuses have three hearts.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Venus is longer than its year.",
  "Honey never spoils.",
  "Sharks existed before trees.",
];

export const EIGHT_BALL = [
  "Yes.",
  "No.",
  "Maybe.",
  "Ask again later.",
  "Definitely.",
  "I doubt it.",
  "Without a doubt.",
  "Don't count on it.",
  "Looks good.",
  "Not a chance.",
];

export type GameSession =
  | { type: "guess"; number: number; tries: number; host: string }
  | { type: "trivia"; answer: string; host: string };

let session: GameSession | null = null;

export function getSession() {
  return session;
}

export function setSession(s: GameSession | null) {
  session = s;
}

export function clearSession() {
  session = null;
}
