import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { levelFromXp, XP_COOLDOWN_MS, XP_PER_MESSAGE } from "../ranking";
import { DAILY_BASE, DAILY_STREAK_BONUS, DAILY_STREAK_CAP } from "../economy";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "gangster.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export interface UserRow {
  jid: string;
  name: string | null;
  is_admin: number;
  join_date: string;
  last_active: string;
  message_count: number;
  xp: number;
  level: number;
  last_xp_at: number;
  coins: number;
  bank: number;
  last_daily: string | null;
  daily_streak: number;
  birthday: string | null;
  rep: number;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      name TEXT,
      is_admin INTEGER DEFAULT 0,
      join_date TEXT DEFAULT (datetime('now')),
      last_active TEXT DEFAULT (datetime('now')),
      message_count INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_xp_at INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      last_daily TEXT,
      daily_streak INTEGER DEFAULT 0,
      birthday TEXT,
      rep INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      jid TEXT NOT NULL,
      item_id TEXT NOT NULL,
      qty INTEGER DEFAULT 1,
      PRIMARY KEY (jid, item_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS cooldowns (
      jid TEXT NOT NULL,
      command TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (jid, command)
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL,
      reason TEXT,
      by_jid TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mutes (
      jid TEXT PRIMARY KEY,
      reason TEXT,
      by_jid TEXT,
      expires_at INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS afk (
      jid TEXT PRIMARY KEY,
      reason TEXT,
      since INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reputation (
      from_jid TEXT NOT NULL,
      to_jid TEXT NOT NULL,
      day TEXT NOT NULL,
      PRIMARY KEY (from_jid, to_jid, day)
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize TEXT NOT NULL,
      host_jid TEXT NOT NULL,
      ends_at INTEGER NOT NULL,
      active INTEGER DEFAULT 1,
      winner_jid TEXT
    );

    CREATE TABLE IF NOT EXISTS giveaway_entries (
      giveaway_id INTEGER NOT NULL,
      jid TEXT NOT NULL,
      PRIMARY KEY (giveaway_id, jid)
    );
  `);

  migrateUsers();
  console.log("[DB] ready →", dbPath);
}

function migrateUsers() {
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  const add = (col: string, def: string) => {
    if (!names.has(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
  };
  add("xp", "INTEGER DEFAULT 0");
  add("level", "INTEGER DEFAULT 1");
  add("last_xp_at", "INTEGER DEFAULT 0");
  add("coins", "INTEGER DEFAULT 0");
  add("bank", "INTEGER DEFAULT 0");
  add("last_daily", "TEXT");
  add("daily_streak", "INTEGER DEFAULT 0");
  add("birthday", "TEXT");
  add("rep", "INTEGER DEFAULT 0");
}

export function trackMessage(
  jid: string,
  name?: string
): { leveledUp: boolean; newLevel: number; oldLevel: number } | null {
  const now = Date.now();

  db.prepare(`
    INSERT INTO users (jid, name, last_active, message_count)
    VALUES (?, ?, datetime('now'), 1)
    ON CONFLICT(jid) DO UPDATE SET
      name = COALESCE(excluded.name, users.name),
      last_active = datetime('now'),
      message_count = message_count + 1
  `).run(jid, name ?? null);

  const user = db.prepare("SELECT xp, level, last_xp_at FROM users WHERE jid = ?").get(jid) as {
    xp: number;
    level: number;
    last_xp_at: number;
  };

  if (now - user.last_xp_at < XP_COOLDOWN_MS) return null;

  const oldLevel = user.level;
  const newXp = user.xp + XP_PER_MESSAGE;
  const newLevel = levelFromXp(newXp);

  db.prepare("UPDATE users SET xp = ?, level = ?, last_xp_at = ? WHERE jid = ?").run(
    newXp,
    newLevel,
    now,
    jid
  );

  if (newLevel > oldLevel) return { leveledUp: true, newLevel, oldLevel };
  return null;
}

export function getUser(jid: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE jid = ?").get(jid) as UserRow | undefined;
}

export function ensureUser(jid: string, name?: string) {
  db.prepare(`
    INSERT INTO users (jid, name) VALUES (?, ?)
    ON CONFLICT(jid) DO UPDATE SET name = COALESCE(excluded.name, users.name)
  `).run(jid, name ?? null);
}

export function getLeaderboard(limit = 10): UserRow[] {
  return db
    .prepare("SELECT * FROM users ORDER BY xp DESC, message_count DESC LIMIT ?")
    .all(limit) as UserRow[];
}

export function getCoinLeaderboard(limit = 10): UserRow[] {
  return db
    .prepare("SELECT * FROM users ORDER BY (coins + bank) DESC LIMIT ?")
    .all(limit) as UserRow[];
}

export function getUserRank(jid: string): number {
  const row = db
    .prepare(`
      SELECT 1 + (SELECT COUNT(*) FROM users u2 WHERE u2.xp > u1.xp
        OR (u2.xp = u1.xp AND u2.message_count > u1.message_count)) AS rank
      FROM users u1 WHERE u1.jid = ?
    `)
    .get(jid) as { rank: number } | undefined;
  return row?.rank ?? 0;
}

export function addCoins(jid: string, amount: number) {
  db.prepare("UPDATE users SET coins = coins + ? WHERE jid = ?").run(amount, jid);
}

export function removeCoins(jid: string, amount: number): boolean {
  const user = getUser(jid);
  if (!user || user.coins < amount) return false;
  db.prepare("UPDATE users SET coins = coins - ? WHERE jid = ?").run(amount, jid);
  return true;
}

export function transferCoins(from: string, to: string, amount: number): boolean {
  if (amount <= 0) return false;
  const sender = getUser(from);
  if (!sender || sender.coins < amount) return false;

  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET coins = coins - ? WHERE jid = ?").run(amount, from);
    ensureUser(to);
    db.prepare("UPDATE users SET coins = coins + ? WHERE jid = ?").run(amount, to);
  });
  tx();
  return true;
}

export function deposit(jid: string, amount: number): boolean {
  if (amount <= 0) return false;
  const user = getUser(jid);
  if (!user || user.coins < amount) return false;
  db.prepare("UPDATE users SET coins = coins - ?, bank = bank + ? WHERE jid = ?").run(
    amount,
    amount,
    jid
  );
  return true;
}

export function withdraw(jid: string, amount: number): boolean {
  if (amount <= 0) return false;
  const user = getUser(jid);
  if (!user || user.bank < amount) return false;
  db.prepare("UPDATE users SET bank = bank - ?, coins = coins + ? WHERE jid = ?").run(
    amount,
    amount,
    jid
  );
  return true;
}

export function claimDaily(jid: string): { amount: number; streak: number } | null {
  const user = getUser(jid);
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (user.last_daily === today) return null;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = user.last_daily === yesterday ? user.daily_streak + 1 : 1;
  const bonusDays = Math.min(streak - 1, DAILY_STREAK_CAP);
  const amount = DAILY_BASE + bonusDays * DAILY_STREAK_BONUS;

  db.prepare(`
    UPDATE users SET coins = coins + ?, last_daily = ?, daily_streak = ? WHERE jid = ?
  `).run(amount, today, streak, jid);

  return { amount, streak };
}

export function addItem(jid: string, itemId: string, qty = 1) {
  db.prepare(`
    INSERT INTO inventory (jid, item_id, qty) VALUES (?, ?, ?)
    ON CONFLICT(jid, item_id) DO UPDATE SET qty = qty + excluded.qty
  `).run(jid, itemId, qty);
}

export function getInventory(jid: string): { item_id: string; qty: number }[] {
  return db.prepare("SELECT item_id, qty FROM inventory WHERE jid = ?").all(jid) as {
    item_id: string;
    qty: number;
  }[];
}

export function isOnCooldown(jid: string, command: string): boolean {
  const row = db
    .prepare("SELECT expires_at FROM cooldowns WHERE jid = ? AND command = ?")
    .get(jid, command) as { expires_at: number } | undefined;

  if (!row) return false;
  if (row.expires_at <= Date.now()) {
    db.prepare("DELETE FROM cooldowns WHERE jid = ? AND command = ?").run(jid, command);
    return false;
  }
  return true;
}

export function setCooldown(jid: string, command: string, seconds: number) {
  db.prepare(`
    INSERT INTO cooldowns (jid, command, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(jid, command) DO UPDATE SET expires_at = excluded.expires_at
  `).run(jid, command, Date.now() + seconds * 1000);
}

export function addWarning(jid: string, reason: string, byJid: string): number {
  ensureUser(jid);
  db.prepare("INSERT INTO warnings (jid, reason, by_jid) VALUES (?, ?, ?)").run(jid, reason, byJid);
  const row = db.prepare("SELECT COUNT(*) AS c FROM warnings WHERE jid = ?").get(jid) as { c: number };
  return row.c;
}

export function getWarnings(jid: string): { id: number; reason: string | null; created_at: string }[] {
  return db
    .prepare("SELECT id, reason, created_at FROM warnings WHERE jid = ? ORDER BY id DESC")
    .all(jid) as { id: number; reason: string | null; created_at: string }[];
}

export function clearWarnings(jid: string) {
  db.prepare("DELETE FROM warnings WHERE jid = ?").run(jid);
}

export function muteUser(jid: string, reason: string, byJid: string, durationSec: number | null) {
  ensureUser(jid);
  const expires = durationSec ? Date.now() + durationSec * 1000 : null;
  db.prepare(`
    INSERT INTO mutes (jid, reason, by_jid, expires_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(jid) DO UPDATE SET reason = excluded.reason, by_jid = excluded.by_jid, expires_at = excluded.expires_at
  `).run(jid, reason, byJid, expires);
}

export function unmuteUser(jid: string) {
  db.prepare("DELETE FROM mutes WHERE jid = ?").run(jid);
}

export function isMuted(jid: string): boolean {
  const row = db.prepare("SELECT expires_at FROM mutes WHERE jid = ?").get(jid) as
    | { expires_at: number | null }
    | undefined;
  if (!row) return false;
  if (row.expires_at && row.expires_at <= Date.now()) {
    db.prepare("DELETE FROM mutes WHERE jid = ?").run(jid);
    return false;
  }
  return true;
}

export function resetUser(jid: string) {
  db.prepare(`
    UPDATE users SET xp = 0, level = 1, coins = 0, bank = 0, message_count = 0,
      daily_streak = 0, last_daily = NULL, last_xp_at = 0, rep = 0 WHERE jid = ?
  `).run(jid);
  db.prepare("DELETE FROM inventory WHERE jid = ?").run(jid);
  db.prepare("DELETE FROM warnings WHERE jid = ?").run(jid);
  db.prepare("DELETE FROM mutes WHERE jid = ?").run(jid);
  db.prepare("DELETE FROM cooldowns WHERE jid = ?").run(jid);
  db.prepare("DELETE FROM afk WHERE jid = ?").run(jid);
}

export function setAfk(jid: string, reason: string) {
  db.prepare(`
    INSERT INTO afk (jid, reason, since) VALUES (?, ?, ?)
    ON CONFLICT(jid) DO UPDATE SET reason = excluded.reason, since = excluded.since
  `).run(jid, reason, Date.now());
}

export function clearAfk(jid: string): { reason: string; since: number } | null {
  const row = db.prepare("SELECT reason, since FROM afk WHERE jid = ?").get(jid) as
    | { reason: string; since: number }
    | undefined;
  if (!row) return null;
  db.prepare("DELETE FROM afk WHERE jid = ?").run(jid);
  return row;
}

export function getAfk(jid: string): { reason: string; since: number } | null {
  return (
    (db.prepare("SELECT reason, since FROM afk WHERE jid = ?").get(jid) as
      | { reason: string; since: number }
      | undefined) || null
  );
}

export function setBirthday(jid: string, mmdd: string) {
  ensureUser(jid);
  db.prepare("UPDATE users SET birthday = ? WHERE jid = ?").run(mmdd, jid);
}

export function getBirthdaysToday(): UserRow[] {
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return db.prepare("SELECT * FROM users WHERE birthday = ?").all(mmdd) as UserRow[];
}

export function giveRep(fromJid: string, toJid: string): "ok" | "self" | "already" {
  if (fromJid === toJid) return "self";
  const day = new Date().toISOString().slice(0, 10);
  try {
    db.prepare("INSERT INTO reputation (from_jid, to_jid, day) VALUES (?, ?, ?)").run(
      fromJid,
      toJid,
      day
    );
    ensureUser(toJid);
    db.prepare("UPDATE users SET rep = rep + 1 WHERE jid = ?").run(toJid);
    return "ok";
  } catch {
    return "already";
  }
}

export function getRepLeaderboard(limit = 10): UserRow[] {
  return db.prepare("SELECT * FROM users WHERE rep > 0 ORDER BY rep DESC LIMIT ?").all(limit) as UserRow[];
}

export function createGiveaway(prize: string, hostJid: string, durationMin: number): number {
  const endsAt = Date.now() + durationMin * 60 * 1000;
  const result = db
    .prepare("INSERT INTO giveaways (prize, host_jid, ends_at) VALUES (?, ?, ?)")
    .run(prize, hostJid, endsAt);
  return Number(result.lastInsertRowid);
}

export function getActiveGiveaway(): {
  id: number;
  prize: string;
  host_jid: string;
  ends_at: number;
} | null {
  return (
    (db
      .prepare("SELECT id, prize, host_jid, ends_at FROM giveaways WHERE active = 1 ORDER BY id DESC LIMIT 1")
      .get() as { id: number; prize: string; host_jid: string; ends_at: number } | undefined) || null
  );
}

export function joinGiveaway(giveawayId: number, jid: string): boolean {
  try {
    db.prepare("INSERT INTO giveaway_entries (giveaway_id, jid) VALUES (?, ?)").run(giveawayId, jid);
    return true;
  } catch {
    return false;
  }
}

export function getGiveawayEntries(giveawayId: number): string[] {
  return (
    db.prepare("SELECT jid FROM giveaway_entries WHERE giveaway_id = ?").all(giveawayId) as {
      jid: string;
    }[]
  ).map((r) => r.jid);
}

export function endGiveaway(giveawayId: number, winnerJid: string | null) {
  db.prepare("UPDATE giveaways SET active = 0, winner_jid = ? WHERE id = ?").run(winnerJid, giveawayId);
}
