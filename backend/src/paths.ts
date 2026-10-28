import fs from "fs";
import path from "path";

/** SQLite, WhatsApp auth, and media. Set DATA_DIR to a Render disk mount to survive restarts. */
export const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, "gangster.db");
export const authDir = path.join(dataDir, "auth");
export const sopMediaDir = path.join(dataDir, "sop_media");
