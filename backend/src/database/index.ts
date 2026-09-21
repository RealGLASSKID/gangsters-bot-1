import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { levelFromXp, totalXpForLevel, XP_COOLDOWN_MS, XP_PER_MESSAGE } from "../ranking";
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

    CREATE TABLE IF NOT EXISTS custom_commands (
      name TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_sop (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_name TEXT NOT NULL,
      media_path TEXT NOT NULL,
      media_type TEXT NOT NULL,
      caption TEXT,
      submitted_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      mode TEXT DEFAULT 'single',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      sent INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS banned_words (
      word TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS group_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      keywords TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

  `);

  migrateUsers();
  try {
    seedDefaultRulesIfEmpty();
  } catch {
    /* table may not exist on first partial migrate */
  }
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

/** Look up user by phone JID or LID-style id (tries common variants). */
export function findUser(jid: string): UserRow | undefined {
  const direct = getUser(jid);
  if (direct) return direct;
  const bare = jid.split("@")[0]?.split(":")[0] || "";
  if (!bare) return undefined;
  const variants = [
    `${bare}@s.whatsapp.net`,
    `${bare}@lid`,
    jid,
  ];
  for (const v of variants) {
    const u = getUser(v);
    if (u) return u;
  }
  // last resort: match bare number prefix in jid column
  const row = db
    .prepare("SELECT * FROM users WHERE jid LIKE ? LIMIT 1")
    .get(`${bare}@%`) as UserRow | undefined;
  return row;
}


export function getRecentlyActive(minutes = 15): UserRow[] {
  return db
    .prepare(
      `SELECT * FROM users
       WHERE last_active IS NOT NULL
         AND datetime(last_active) >= datetime('now', ?)
       ORDER BY last_active DESC
       LIMIT 50`
    )
    .all(`-${Math.max(1, minutes)} minutes`) as UserRow[];
}

export function setUserXp(jid: string, xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safeXp);
  ensureUser(jid);
  db.prepare("UPDATE users SET xp = ?, level = ? WHERE jid = ?").run(safeXp, level, jid);
  return getUser(jid);
}

export function setUserLevel(jid: string, level: number) {
  const lvl = Math.max(1, Math.floor(level));
  const xp = totalXpForLevel(lvl);
  ensureUser(jid);
  db.prepare("UPDATE users SET level = ?, xp = ? WHERE jid = ?").run(lvl, xp, jid);
  return getUser(jid);
}

export function setUserCoins(jid: string, coins: number, bank?: number) {
  ensureUser(jid);
  if (bank === undefined) {
    db.prepare("UPDATE users SET coins = ? WHERE jid = ?").run(Math.max(0, Math.floor(coins)), jid);
  } else {
    db.prepare("UPDATE users SET coins = ?, bank = ? WHERE jid = ?").run(
      Math.max(0, Math.floor(coins)),
      Math.max(0, Math.floor(bank)),
      jid
    );
  }
  return getUser(jid);
}

export function listUsers(limit = 100): UserRow[] {
  return db
    .prepare("SELECT * FROM users ORDER BY xp DESC, message_count DESC LIMIT ?")
    .all(limit) as UserRow[];
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

// ========== Custom Commands ==========
export function setCustomCommand(name: string, response: string, byJid: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!key) return false;
  db.prepare(`
    INSERT INTO custom_commands (name, response, created_by)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET response = excluded.response, created_by = excluded.created_by
  `).run(key, response, byJid);
  return true;
}

export function getCustomCommand(name: string): string | null {
  const row = db
    .prepare("SELECT response FROM custom_commands WHERE name = ?")
    .get(name.toLowerCase()) as { response: string } | undefined;
  return row?.response ?? null;
}

export function deleteCustomCommand(name: string): boolean {
  const result = db.prepare("DELETE FROM custom_commands WHERE name = ?").run(name.toLowerCase());
  return result.changes > 0;
}

export function listCustomCommands(): { name: string; response: string }[] {
  return db.prepare("SELECT name, response FROM custom_commands ORDER BY name").all() as {
    name: string;
    response: string;
  }[];
}

// ========== Pending Smash or Pass ==========
export function addPendingSop(
  targetName: string,
  mediaPath: string,
  mediaType: string,
  caption: string | null,
  submittedBy: string
): number {
  const result = db
    .prepare(
      `INSERT INTO pending_sop (target_name, media_path, media_type, caption, submitted_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(targetName, mediaPath, mediaType, caption, submittedBy);
  return Number(result.lastInsertRowid);
}

export function getPendingSop(id: number) {
  return db
    .prepare(
      `SELECT id, target_name, media_path, media_type, caption, submitted_by, used
       FROM pending_sop WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        target_name: string;
        media_path: string;
        media_type: string;
        caption: string | null;
        submitted_by: string;
        used: number;
      }
    | undefined;
}

export function markSopUsed(id: number) {
  db.prepare("UPDATE pending_sop SET used = 1 WHERE id = ?").run(id);
}

export function listPendingSop(limit = 20) {
  return db
    .prepare(
      `SELECT id, target_name, media_type, created_at, used
       FROM pending_sop ORDER BY id DESC LIMIT ?`
    )
    .all(limit) as {
    id: number;
    target_name: string;
    media_type: string;
    created_at: string;
    used: number;
  }[];
}

// ========== Settings helpers ==========
export function getSetting(key: string, fallback = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

// ========== Polls ==========
export function createPoll(question: string, options: string[], mode: string, byJid: string): number {
  const result = db
    .prepare(
      `INSERT INTO polls (question, options, mode, created_by) VALUES (?, ?, ?, ?)`
    )
    .run(question, JSON.stringify(options), mode, byJid);
  return Number(result.lastInsertRowid);
}

export function getPoll(id: number) {
  return db.prepare("SELECT * FROM polls WHERE id = ?").get(id) as
    | {
        id: number;
        question: string;
        options: string;
        mode: string;
        created_by: string | null;
        created_at: string;
        sent: number;
        closed: number;
      }
    | undefined;
}

export function markPollSent(id: number) {
  db.prepare("UPDATE polls SET sent = 1 WHERE id = ?").run(id);
}

export function markPollClosed(id: number) {
  db.prepare("UPDATE polls SET closed = 1 WHERE id = ?").run(id);
}

export function deletePoll(id: number): boolean {
  const r = db.prepare("DELETE FROM polls WHERE id = ?").run(id);
  return r.changes > 0;
}

export function listPolls(limit = 15) {
  return db
    .prepare(
      `SELECT id, question, sent, closed, created_at FROM polls ORDER BY id DESC LIMIT ?`
    )
    .all(limit) as { id: number; question: string; sent: number; closed: number; created_at: string }[];
}

// ========== Banned words ==========
export function addBannedWord(word: string): boolean {
  const w = word.toLowerCase().trim();
  if (!w) return false;
  try {
    db.prepare("INSERT INTO banned_words (word) VALUES (?)").run(w);
    return true;
  } catch {
    return false;
  }
}

export function removeBannedWord(word: string): boolean {
  const r = db.prepare("DELETE FROM banned_words WHERE word = ?").run(word.toLowerCase().trim());
  return r.changes > 0;
}

export function listBannedWords(): string[] {
  return (db.prepare("SELECT word FROM banned_words ORDER BY word").all() as { word: string }[]).map(
    (r) => r.word
  );
}

export function isBannedWord(text: string): boolean {
  const lower = text.toLowerCase();
  const words = listBannedWords();
  // Also keep the hard-coded ones as base
  const base = ["fuck", "shit", "bitch", "asshole", "nigga", "nigger"];
  const all = [...new Set([...base, ...words])];
  return all.some((w) => lower.includes(w));
}


// —— Group rules (enforceable) ——
export function listGroupRules(enabledOnly = false): Array<{
  id: number;
  title: string;
  body: string;
  keywords: string;
  enabled: number;
  sort_order: number;
}> {
  if (enabledOnly) {
    return db
      .prepare("SELECT * FROM group_rules WHERE enabled = 1 ORDER BY sort_order, id")
      .all() as any[];
  }
  return db.prepare("SELECT * FROM group_rules ORDER BY sort_order, id").all() as any[];
}

export function addGroupRule(title: string, body: string, keywords = "", sortOrder = 0): number {
  const r = db
    .prepare(
      "INSERT INTO group_rules (title, body, keywords, sort_order) VALUES (?, ?, ?, ?)"
    )
    .run(title.trim(), body.trim(), keywords.trim().toLowerCase(), sortOrder);
  return Number(r.lastInsertRowid);
}

export function updateGroupRule(
  id: number,
  data: { title?: string; body?: string; keywords?: string; enabled?: number; sort_order?: number }
): boolean {
  const row = db.prepare("SELECT * FROM group_rules WHERE id = ?").get(id) as any;
  if (!row) return false;
  db.prepare(
    `UPDATE group_rules SET title = ?, body = ?, keywords = ?, enabled = ?, sort_order = ? WHERE id = ?`
  ).run(
    data.title ?? row.title,
    data.body ?? row.body,
    data.keywords !== undefined ? data.keywords.trim().toLowerCase() : row.keywords,
    data.enabled !== undefined ? data.enabled : row.enabled,
    data.sort_order !== undefined ? data.sort_order : row.sort_order,
    id
  );
  return true;
}

export function deleteGroupRule(id: number): boolean {
  const r = db.prepare("DELETE FROM group_rules WHERE id = ?").run(id);
  return r.changes > 0;
}

export function seedDefaultRulesIfEmpty() {
  const c = db.prepare("SELECT COUNT(*) AS c FROM group_rules").get() as { c: number };
  if (c.c > 0) return;
  const defaults: Array<[string, string, string]> = [
    ["18+ only", "Strictly 18+ only.", "underage,minor,i am 16,i am 17"],
    ["Respect members", "Respect all members at all times.", "idiot,stupid,shut up,mumu,fool"],
    ["No harassment", "No harassment, bullying, or threats.", "kill yourself,i will beat you,i will find you"],
    ["Privacy", "No sharing personal information of members.", "this is his number,her number is,house address"],
    ["No scams", "No scams, fraud, or misleading content.", "send money,investment opportunity,double your money"],
    ["No group ads", "No promoting or mentioning other groups.", "join my group,join our group,group link,new group,chat.whatsapp.com,my group link"],
    ["No spam", "No spam or excessive advertising.", "buy now,click this link,promo code"],
  ];
  const ins = db.prepare(
    "INSERT INTO group_rules (title, body, keywords, sort_order) VALUES (?, ?, ?, ?)"
  );
  defaults.forEach((d, i) => ins.run(d[0], d[1], d[2], i + 1));
}

export function findViolatedRule(text: string): { id: number; title: string; body: string } | null {
  const lower = text.toLowerCase();
  const rules = listGroupRules(true);
  for (const r of rules) {
    const keys = (r.keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    for (const k of keys) {
      if (k && lower.includes(k)) {
        return { id: r.id, title: r.title, body: r.body };
      }
    }
  }
  return null;
}
