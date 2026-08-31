/**
 * Everything that makes Gangster Bot sound like Gangster Bot lives here,
 * separate from game logic and command routing. Games and handlers return
 * plain intent/data; this module dresses it up in voice. Keeping the two
 * separate means you can reskin the persona later without touching game
 * rules, and keep games' own text clean and testable.
 */

const GREETINGS = [
  "Yo, look who walked in.",
  "Well well, if it ain't {name}.",
  "Ay, {name}. You know the rules round here.",
];

const UNKNOWN_COMMAND = [
  "Never heard of it. Try `help` before you get yourself in trouble.",
  "That ain't a thing here, pal. Send `help` and read the menu.",
  "Nah, we don't do that. Type `help`.",
];

const PERMISSION_DENIED = [
  "That's above your pay grade. Talk to the boss.",
  "Nice try. You don't got the clearance for that.",
  "Easy there — that's admin business, not yours.",
];

function pick(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)]!;
}

export function greeting(name?: string | null): string {
  return pick(GREETINGS).replace("{name}", name || "friend");
}

export function unknownCommand(): string {
  return pick(UNKNOWN_COMMAND);
}

export function permissionDenied(): string {
  return pick(PERMISSION_DENIED);
}

export function welcomeText(name?: string | null): string {
  const who = name || "friend";
  return [
    `🔥 *GANGSTER'S* 🔥`,
    `✨ Welcome to the crew, ${who}. ✨`,
    "",
    "A hangout for bold personalities and good vibes.",
    "Connect with the family, play the games, keep it respectful.",
    "",
    "💎 Exclusive Vibes",
    "🔥 Good Conversations",
    "😎 Respectful Community",
    "",
    "⚡ Join The Family.",
    "⚡ Respect The Code.",
    "⚡ Enjoy The Vibe.",
    "",
    "🔥 GANGSTER'S — Where Legends Connect",
    "",
    "Send *rules* for the house code.",
    "Send *games* to see what's on the table.",
    "Send *help* for every command.",
  ].join("\n");
}

export function rulesText(): string {
  return [
    "📜 *GANGSTER'S RULES* 📜",
    "",
    "1. 🤝 Respect every member, every time.",
    "2. 🚫 No harassment, bullying, or threats.",
    "3. 🔒 Respect privacy — no sharing personal info.",
    "4. ❌ No scams, fraud, or misleading content.",
    "5. ⚠️ No illegal talk or anything that puts people at risk.",
    "6. 🗣️ Keep conversations civil.",
    "7. 🚫 No spam, flooding, or repeated ads.",
    "8. 👑 Admin decisions are final.",
    "9. 🔥 Have fun, be yourself, keep the vibes positive.",
    "",
    "Break the rules and you may get a warning, a mute, or a removal.",
    "",
    "Send *welcome* to see the intro again.",
    "Send *games* to play.",
  ].join("\n");
}

export function helpText(role: string): string {
  const base = [
    "*Gangster Bot* — here's the menu:",
    "`welcome` — crew intro",
    "`rules` — house code",
    "`games` — what's on the table",
    "`play <game>` — start a game",
    "`quit` — walk away from an active game",
    "`stats` — your standing",
    "`name <nickname>` — set what we call you",
    "`help` — this menu",
  ];
  if (role === "admin" || role === "super_admin") {
    base.push("", "*Admin:*", "`broadcast <msg>` — message every player");
  }
  if (role === "super_admin") {
    base.push("`promote <phone>` — make someone an admin");
  }
  return base.join("\n");
}

export function gamesMenu(
  games: { id: string; name: string; description: string }[]
): string {
  if (games.length === 0) {
    return "Nothing on the table right now. Ask the boss.";
  }
  const lines = games.map((g) => `• *${g.id}* — ${g.name}: ${g.description}`);
  return [
    "*Games on the table:*",
    ...lines,
    "",
    "Start one with `play <id>` — example: `play heist`",
    "In a game, send `quit` to walk away.",
  ].join("\n");
}

export function statsText(input: {
  name?: string | null;
  gamesPlayed: number;
  gamesWon: number;
  lastGameId: string | null;
}): string {
  const who = input.name || "you";
  const winRate =
    input.gamesPlayed === 0
      ? "—"
      : `${Math.round((input.gamesWon / input.gamesPlayed) * 100)}%`;
  return [
    `*Standing — ${who}*`,
    `Games played: ${input.gamesPlayed}`,
    `Wins: ${input.gamesWon}`,
    `Win rate: ${winRate}`,
    `Last game: ${input.lastGameId || "none yet"}`,
  ].join("\n");
}
