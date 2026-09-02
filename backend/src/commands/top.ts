import { Command } from "../types";
import leaderboard from "./leaderboard";

/** Alias for !leaderboard */
const top: Command = {
  name: "top",
  description: "Alias for !leaderboard",
  cooldown: leaderboard.cooldown,
  execute: leaderboard.execute,
};

export default top;
