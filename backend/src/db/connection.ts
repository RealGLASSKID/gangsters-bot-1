import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config";

const dbPath = config.db.path;
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL"); // safe concurrent reads while a write is in flight
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'member',
    displayName TEXT,
    createdAt INTEGER NOT NULL,
    lastSeenAt INTEGER NOT NULL,
    banned INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    state TEXT NOT NULL DEFAULT '{}',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (phone) REFERENCES users(phone)
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_phone_status ON sessions(phone, status);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    direction TEXT NOT NULL,
    text TEXT NOT NULL,
    messageId TEXT,
    replyToId TEXT,
    createdAt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone, createdAt DESC);

  CREATE TABLE IF NOT EXISTS stats (
    phone TEXT PRIMARY KEY,
    gamesPlayed INTEGER NOT NULL DEFAULT 0,
    gamesWon INTEGER NOT NULL DEFAULT 0,
    lastGameId TEXT,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (phone) REFERENCES users(phone)
  );
`);
