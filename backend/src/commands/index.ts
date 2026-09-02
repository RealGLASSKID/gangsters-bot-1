import { Command } from "../types";
import ping from "./ping";
import help from "./help";
import rank from "./rank";
import level from "./level";
import profile from "./profile";
import leaderboard from "./leaderboard";
import top from "./top";
import balance from "./balance";
import daily from "./daily";
import work from "./work";
import bank from "./bank";
import deposit from "./deposit";
import withdraw from "./withdraw";
import give from "./give";
import shop from "./shop";
import inventory from "./inventory";
import coinflip from "./coinflip";
import dice from "./dice";
import richest from "./richest";
import warn from "./warn";
import warnings from "./warnings";
import unwarn from "./unwarn";
import mute from "./mute";
import unmute from "./unmute";
import kick from "./kick";
import tagall from "./tagall";
import resetuser from "./resetuser";
import rps from "./rps";
import guess from "./guess";
import trivia from "./trivia";
import eightball from "./eightball";
import joke from "./joke";
import fact from "./fact";
import afk from "./afk";
import birthday from "./birthday";
import mybirthday from "./mybirthday";
import rep from "./rep";
import reptop from "./reptop";
import confess from "./confess";
import giveaway from "./giveaway";
import me from "./me";
import group from "./group";

const commands = new Map<string, Command>();

function register(cmd: Command) {
  commands.set(cmd.name.toLowerCase(), cmd);
  for (const alias of cmd.aliases || []) {
    commands.set(alias.toLowerCase(), cmd);
  }
}

[
  ping, help, me, group,
  rank, level, profile, leaderboard, top,
  balance, daily, work, bank, deposit, withdraw, give,
  shop, inventory, coinflip, dice, richest,
  warn, warnings, unwarn, mute, unmute, kick, tagall, resetuser,
  rps, guess, trivia, eightball, joke, fact,
  afk, birthday, mybirthday, rep, reptop, confess,
  giveaway,
].forEach(register);

export function getCommand(name: string) {
  return commands.get(name.toLowerCase());
}

export function getAllCommands() {
  const unique = new Map<string, Command>();
  for (const cmd of commands.values()) unique.set(cmd.name, cmd);
  return [...unique.values()];
}
