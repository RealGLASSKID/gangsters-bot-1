import { loadAndRegisterGames } from "./load";

loadAndRegisterGames();

export { getGame, listRegisteredGames, registerGame, isGame } from "./engine";
export { defineGame, who, pick, randInt, normalize, again, win, lose, next, matchChoice } from "./helpers";
