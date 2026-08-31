import fs from "node:fs";
import path from "node:path";
import { isGame, registerGame, type Game } from "./engine";
import { upsertGameDefinition } from "../gameDefinitions";

const SKIP = new Set([
  "engine.ts",
  "engine.js",
  "helpers.ts",
  "helpers.js",
  "load.ts",
  "load.js",
  "index.ts",
  "index.js",
]);

function listGameFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => {
      if (file.startsWith("_") || file.startsWith(".")) return false;
      if (SKIP.has(file)) return false;
      return file.endsWith(".ts") || file.endsWith(".js");
    })
    .sort();
}

function gamesFromModule(mod: Record<string, unknown>, file: string): Game[] {
  const found: Game[] = [];
  for (const [key, value] of Object.entries(mod)) {
    if (key === "default" && isGame(value)) {
      found.push(value);
      continue;
    }
    if (isGame(value)) found.push(value);
  }
  if (found.length === 0) {
    console.warn(`[games] ${file} exported nothing that looks like a Game — skipped`);
  }
  return found;
}

/**
 * Require every game file in this folder, register them, and upsert the
 * dashboard row. New game = new file. Restart the brain. Done.
 */
export function loadAndRegisterGames(): Game[] {
  const dir = __dirname;
  const registered: Game[] = [];

  for (const file of listGameFiles(dir)) {
    // tsx and compiled `node dist` both resolve this.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(dir, file)) as Record<string, unknown>;
    for (const game of gamesFromModule(mod, file)) {
      registerGame(game);
      upsertGameDefinition({
        id: game.id,
        name: game.name,
        description: game.description,
        enabled: true,
      });
      registered.push(game);
    }
  }

  console.log(
    `[games] loaded ${registered.length}: ${registered.map((g) => g.id).join(", ") || "(none)"}`
  );
  return registered;
}
