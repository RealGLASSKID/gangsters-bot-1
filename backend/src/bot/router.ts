import type { RelayInboundPayload } from "../types";
import { getOrCreateUser, roleAtLeast, setUserRole, setDisplayName } from "./users";
import { getActiveSession, createSession, updateSessionState, setSessionStatus } from "./sessions";
import { getGame, listRegisteredGames } from "./games/index";
import { getGameDefinition } from "./gameDefinitions";
import { getStats, recordGameResult } from "./stats";
import * as persona from "./persona";

const QUIT_WORDS = new Set(["quit", "stop", "cancel", "exit", "leave"]);

function enabledGames() {
  return listRegisteredGames().filter((g) => {
    const def = getGameDefinition(g.id);
    return !def || def.enabled;
  });
}

/**
 * Given one inbound WhatsApp message, decide what to say back (or null to
 * stay silent). Single entry point the inbound route calls. Synchronous
 * except for game start()/turn() calls, which stay async in the Game
 * interface in case a future game needs to await something (an API call,
 * a random.org roll, whatever) — SQLite itself is synchronous.
 */
export async function handleInboundMessage(payload: RelayInboundPayload): Promise<string | null> {
  const user = getOrCreateUser(payload.from);
  if (user.banned) return null;

  const text = payload.text.trim();
  if (!text) return null;

  const activeSession = getActiveSession(payload.from);
  if (activeSession) {
    const firstWord = text.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (QUIT_WORDS.has(firstWord)) {
      setSessionStatus(activeSession.id, "abandoned");
      return `You walked off *${activeSession.gameId}*. No harm done.\n\nSend *games* to see the table, or *play ${activeSession.gameId}* to start over.`;
    }

    const game = getGame(activeSession.gameId);
    if (game) {
      const result = await game.turn(activeSession, user, text);
      if (result.newState) {
        updateSessionState(activeSession.id, result.newState);
      }
      if (result.finished) {
        setSessionStatus(activeSession.id, "completed");
        recordGameResult(payload.from, activeSession.gameId, Boolean(result.won));
      }
      return result.reply;
    }
    setSessionStatus(activeSession.id, "abandoned");
  }

  const [command, ...rest] = text.split(/\s+/);
  const arg = rest.join(" ");

  switch (command?.toLowerCase()) {
    case "help":
    case "menu":
    case "commands":
      return persona.helpText(user.role);

    case "hi":
    case "hello":
    case "hey":
    case "start":
    case "welcome":
      return persona.welcomeText(user.displayName);

    case "rules":
    case "rule":
    case "code":
      return persona.rulesText();

    case "games":
    case "game":
      return persona.gamesMenu(enabledGames());

    case "stats":
    case "stat":
    case "standing": {
      const stats = getStats(payload.from);
      return persona.statsText({
        name: user.displayName,
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        lastGameId: stats.lastGameId,
      });
    }

    case "name":
    case "nick":
    case "nickname": {
      const nickname = arg.trim().replace(/\s+/g, " ").slice(0, 24);
      if (!nickname) return "Usage: `name <nickname>` — keep it short.";
      setDisplayName(payload.from, nickname);
      return `Got it. We'll call you *${nickname}* from here.`;
    }

    case "play": {
      const gameId = arg.trim().toLowerCase();
      if (!gameId) {
        return persona.gamesMenu(enabledGames());
      }
      const game = getGame(gameId);
      if (!game) {
        return `Never heard of "${gameId}".\n\n${persona.gamesMenu(enabledGames())}`;
      }
      const def = getGameDefinition(game.id);
      if (def && !def.enabled) {
        return "That job's off the table right now. Ask the boss.";
      }
      const { state, reply } = await game.start(user);
      createSession(payload.from, game.id, state);
      return reply;
    }

    case "quit":
    case "stop":
    case "cancel":
      return "You're not in a game. Send *games* to see what's on the table.";

    case "promote": {
      if (!roleAtLeast(user.role, "super_admin")) return persona.permissionDenied();
      const target = arg.trim().replace(/\D/g, "");
      if (!target) return "Usage: `promote <phone>` — digits only, with country code.";
      setUserRole(target, "admin");
      return `Done. ${target} is an admin now. Try not to regret it.`;
    }

    case "broadcast": {
      if (!roleAtLeast(user.role, "admin")) return persona.permissionDenied();
      if (!arg.trim()) return "Usage: `broadcast <message>`";
      return "Use the dashboard's Broadcast page for mass messages — safer on rate limits than a one-liner.";
    }

    default:
      return persona.unknownCommand();
  }
}
