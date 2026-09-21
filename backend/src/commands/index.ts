import { Command } from "../types";
import ping from "./ping";
import hi from "./hi";
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
import del from "./delete";
import promote from "./promote";
import demote from "./demote";
import close from "./close";
import open from "./open";
import lock from "./lock";
import unlock from "./unlock";
import setname from "./setname";
import setdesc from "./setdesc";
import admins from "./admins";
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

// New games
import games from "./games";
import truth from "./truth";
import dare from "./dare";
import tod from "./tod";
import wyr from "./wyr";
import nhie from "./nhie";
import sop from "./sop";
import mostlikely from "./mostlikely";
import putafinger from "./putafinger";
import naijaquiz from "./naijaquiz";
import riddle from "./riddle";
import scramble from "./scramble";
import slang from "./slang";
import proverb from "./proverb";

// Admin / utility
import addcmd from "./addcmd";
import delcmd from "./delcmd";
import listcmd from "./listcmd";
import quickpoll from "./quickpoll";
import sopsubmit from "./sopsubmit";
import release from "./release";
import welcome from "./welcome";
import setwelcome from "./setwelcome";
import goodbye from "./goodbye";
import setgoodbye from "./setgoodbye";
import poll from "./poll";
import banword from "./banword";
import moderation from "./moderation";
import online from "./online";
import views from "./views";
import grouprules from "./grouprules";

const commands = new Map<string, Command>();

function register(cmd: Command) {
  commands.set(cmd.name.toLowerCase(), cmd);
  for (const alias of cmd.aliases || []) {
    commands.set(alias.toLowerCase(), cmd);
  }
}

[
  ping, hi, help, me, group, admins,
  rank, level, profile, leaderboard, top,
  balance, daily, work, bank, deposit, withdraw, give,
  shop, inventory, coinflip, dice, richest,
  warn, warnings, unwarn, mute, unmute, kick, del,
  promote, demote, close, open, lock, unlock, setname, setdesc,
  tagall, resetuser,
  rps, guess, trivia, eightball, joke, fact,
  afk, birthday, mybirthday, rep, reptop, confess,
  giveaway,

  // New games
  games, truth, dare, tod, wyr, nhie, sop, mostlikely, putafinger,
  naijaquiz, riddle, scramble, slang, proverb,

  // Admin / utility
  addcmd, delcmd, listcmd, quickpoll, sopsubmit, release,
  welcome, setwelcome, goodbye, setgoodbye,
  poll, banword, moderation, online, views, grouprules,
].forEach(register);

export function getCommand(name: string) {
  return commands.get(name.toLowerCase());
}

export function getAllCommands() {
  const unique = new Map<string, Command>();
  for (const cmd of commands.values()) unique.set(cmd.name, cmd);
  return [...unique.values()];
}
