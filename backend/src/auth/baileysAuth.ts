import fs from "fs";
import path from "path";
import {
  BufferJSON,
  initAuthCreds,
  proto,
  useMultiFileAuthState,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { getRedis, hasRedis } from "../redis";
import { authDir } from "../paths";
import { logger } from "../utils/logger";

export type BaileysAuth = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
};

const KEY_PREFIX = process.env.REDIS_AUTH_PREFIX || "gangster:wa-auth";

function redisKey(file: string): string {
  return `${KEY_PREFIX}:${fixFileName(file)}`;
}

function fixFileName(file: string): string {
  return file.replace(/\//g, "__").replace(/:/g, "-");
}

async function writeRedis(file: string, data: unknown): Promise<void> {
  await getRedis().set(redisKey(file), JSON.stringify(data, BufferJSON.replacer));
}

async function readRedis(file: string): Promise<unknown> {
  const raw = await getRedis().get(redisKey(file));
  if (!raw) return null;
  return JSON.parse(raw, BufferJSON.reviver);
}

async function removeRedis(file: string): Promise<void> {
  await getRedis().del(redisKey(file));
}

async function clearRedisAuth(): Promise<void> {
  const redis = getRedis();
  const match = `${KEY_PREFIX}:*`;
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", match, "COUNT", 200);
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== "0");
}

function clearFileAuth(): void {
  try {
    fs.rmSync(authDir, { recursive: true, force: true });
  } catch (err) {
    logger.error(err, "wipe auth files");
  }
  fs.mkdirSync(authDir, { recursive: true });
}

/** Copy existing `data/auth/*.json` into Redis once, so a local session survives the switch. */
async function migrateFileAuthToRedis(): Promise<void> {
  const existing = await getRedis().get(redisKey("creds.json"));
  if (existing) return;

  if (!fs.existsSync(authDir)) return;
  const files = fs.readdirSync(authDir).filter((name) => name.endsWith(".json"));
  if (!files.length) return;

  const pipeline = getRedis().pipeline();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(authDir, file), "utf8");
    pipeline.set(redisKey(file), raw);
  }
  await pipeline.exec();
  logger.info(`Migrated ${files.length} WhatsApp auth files to Redis`);
}

async function useRedisAuthState(): Promise<BaileysAuth> {
  await migrateFileAuthToRedis();

  const creds = ((await readRedis("creds.json")) as AuthenticationCreds | null) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readRedis(`${type}-${id}.json`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value as SignalDataTypeMap[typeof type];
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<unknown>[] = [];
          for (const category in data) {
            const bucket = data[category as keyof typeof data];
            if (!bucket) continue;
            for (const id in bucket) {
              const value = bucket[id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeRedis(file, value) : removeRedis(file));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeRedis("creds.json", creds);
    },
    clear: clearRedisAuth,
  };
}

async function useFileAuthState(): Promise<BaileysAuth> {
  fs.mkdirSync(authDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  return {
    state,
    saveCreds,
    clear: async () => clearFileAuth(),
  };
}

export async function loadBaileysAuth(): Promise<BaileysAuth> {
  if (hasRedis()) {
    logger.info("WhatsApp auth store: Redis");
    return useRedisAuthState();
  }

  if (process.env.NODE_ENV === "production") {
    logger.warn("REDIS_URL is not set — WhatsApp auth is on local disk and will be lost on restart");
  } else {
    logger.info("WhatsApp auth store: files (set REDIS_URL to use Redis)");
  }
  return useFileAuthState();
}
